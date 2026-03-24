function computeOffset(lat, lon, distance, angle) {
  const earthRadius = 6378137;
  const deltaLat = (distance * Math.cos(angle * Math.PI / 180)) / earthRadius * (180 / Math.PI);
  const deltaLon = (distance * Math.sin(angle * Math.PI / 180)) / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  return { lat: lat + deltaLat, lon: lon + deltaLon };
}

AFRAME.registerComponent('dynamic-movement', {
  schema: {
    type: { type: 'string' },
    speed: { type: 'number', default: 0.00001 },
    originLat: { type: 'number' },
    originLon: { type: 'number' },
    distance: { type: 'number' }
  },
  init() { this.angle = 0; },
  tick(time, timeDelta) {
    if (this.data.type === "spin") {
      this.angle += this.data.speed * timeDelta;
      const newCoords = computeOffset(this.data.originLat, this.data.originLon, this.data.distance, this.angle * (180 / Math.PI));
      this.el.setAttribute('gps-new-entity-place', { latitude: newCoords.lat, longitude: newCoords.lon });
    }
  }
});

AFRAME.registerComponent('proximity-check', {
  schema: {
    range: { type: 'number', default: 5 },
    questions: { type: 'string', default: '[]' },
    triggered: { type: 'boolean', default: false }
  },
  init() {
    this.questions = JSON.parse(this.data.questions);
    this.currentQuestionIndex = 0;
    this.triggeredOnce = false;
  },
  tick() {
    if (this.triggeredOnce || this.currentQuestionIndex >= this.questions.length) return;
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

    const camCoords = camera.components['gps-new-camera']._currentPosition;
    const entityCoords = this.el.getAttribute('gps-new-entity-place');
    if (!entityCoords) return;

    const dist = getDistanceFromLatLonInM(
      camCoords.latitude,
      camCoords.longitude,
      entityCoords.latitude,
      entityCoords.longitude
    );

    if (dist <= this.data.range) {
      this.triggeredOnce = true;
      this.showQuestion();
    }
  },
  showQuestion() {
    const questionData = this.questions[this.currentQuestionIndex];
    if (!questionData) return;

    const modal = document.getElementById('quizModal');
    document.getElementById('quizPlanetName').textContent = this.el.getAttribute('name') || 'Planet';
    document.getElementById('quizQuestion').textContent = questionData.question;

    const answersContainer = document.getElementById('quizAnswers');
    answersContainer.innerHTML = '';

    questionData.answers.forEach((answer, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer';
      btn.textContent = answer;

      btn.addEventListener('click', () => {
        if (btn.classList.contains('clicked')) return;
        btn.classList.add('clicked');
        btn.disabled = true;

        if (i === questionData.rightAnswer) {
          btn.classList.add('correct');
          setTimeout(() => {
            modal.classList.remove('show');
            this.currentQuestionIndex++;
            this.triggeredOnce = false;
          }, 1000);
        } else {
          btn.classList.add('incorrect');
        }
      });
      answersContainer.appendChild(btn);
    });

    modal.classList.add('show');
  }
});

AFRAME.registerComponent('planet-distance-tracker', {
  tick() {
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

    const camCoords = gpsComponent._currentPosition;
    const planets = document.querySelectorAll('[gps-new-entity-place]');
    let closest = null;
    let minDistance = Infinity;

    planets.forEach((planet) => {
      const entityCoords = planet.getAttribute('gps-new-entity-place');
      if (!entityCoords) return;

      const dist = getDistanceFromLatLonInM(
        camCoords.latitude,
        camCoords.longitude,
        entityCoords.latitude,
        entityCoords.longitude
      );

      if (dist < minDistance) {
        minDistance = dist;
        closest = planet;
      }
    });

    const display = document.getElementById('distanceDisplay');
    if (closest && minDistance < 1000) {
      display.textContent = `${Math.round(minDistance)} metros até ${closest.getAttribute('name') || 'um planeta'}`;
    } else if (closest) {
      display.textContent = `Aproximando-se de ${closest.getAttribute('name') || 'um planeta'}`;
    }
  }
});

AFRAME.registerComponent('show-plane', {
  schema: { name: { type: 'string' }, desc: { type: 'string' } },
  init() {
    this.el.addEventListener('click', () => {
      const panel = document.getElementById('info-panel');
      const text = document.getElementById('info-text');
      text.innerHTML = `<strong>${this.data.name}</strong><br>${this.data.desc}`;
      panel.style.display = 'block';
    });
  }
});

function createOrbitWithCircles(userLat, userLon, distance, segments = null) {
  const scene = document.querySelector("a-scene");
  const count = segments || Math.round(20 + distance * 20);
  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i;
    const { lat, lon } = computeOffset(userLat, userLon, distance, angle);
    const circle = document.createElement("a-circle");
    circle.setAttribute("gps-new-entity-place", { latitude: lat, longitude: lon });
    circle.setAttribute("radius", 0.1);
    circle.setAttribute("rotation", "-90 0 0");
    circle.setAttribute("color", "white");
    circle.setAttribute("material", "opacity: 1; transparent: true");
    scene.appendChild(circle);
  }
}

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🌍 INIT PLANETS (with worker)
document.addEventListener("DOMContentLoaded", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const worker = new Worker('planetWorker.js');
        worker.postMessage({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });

        worker.onmessage = function(e) {
          const scene = document.querySelector("a-scene");
          e.data.planets.forEach(p => {
            const entity = document.createElement("a-entity");
            entity.setAttribute("cursor", "rayOrigin:mouse");

            const sphere = document.createElement("a-sphere");
            sphere.setAttribute("name", p.name);
            sphere.setAttribute("gps-new-entity-place", { latitude: p.lat, longitude: p.lon });
            sphere.setAttribute("radius", p.size);
            sphere.setAttribute("material", { src: "data:image/jpg;base64," + p.texture, shader: "standard" });
            sphere.setAttribute("show-plane", { name: p.name, desc: p.desc });

            if (p.speed > 0) {
              sphere.setAttribute("dynamic-movement", {
                type: "spin",
                speed: p.speed * 0.000001,
                originLat: e.data.lat,
                originLon: e.data.lon,
                distance: p.distance
              });
              createOrbitWithCircles(e.data.userLat, e.data.userLon, p.distance);
            }

            if (p.questions.length > 0) {
              sphere.setAttribute("proximity-check", {
                range: 5,
                questions: JSON.stringify(p.questions),
                triggered: false
              });
            }

            entity.appendChild(sphere);
            scene.appendChild(entity);
          });
        };
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true }
    );
  }
});
