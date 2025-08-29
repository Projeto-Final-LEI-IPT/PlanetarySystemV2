// ===================
// Global Variables
// ===================
let score = 0;
let pontos = 4;

// ===================
// Utility Functions
// ===================

function updateScoreDisplay() {
  document.getElementById("scoreDisplay").textContent = "Pontuação: " + score;
}

function computeOffset(lat, lon, distance, angle) {
  const earthRadius = 6378137;
  const deltaLat = (distance * Math.cos(angle * Math.PI / 180)) / earthRadius * (180 / Math.PI);
  const deltaLon = (distance * Math.sin(angle * Math.PI / 180)) / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  return { lat: lat + deltaLat, lon: lon + deltaLon };
}

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ===================
// AFRAME Components
// ===================

// Movement around orbit
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

// Quiz trigger when close to planet
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

    const camCoords = gpsComponent._currentPosition;
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
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    const questionData = this.questions[randomIndex];
    if (!questionData) return;

    const modal = document.getElementById('quizModal');
    const planetTitle = document.getElementById('quizPlanetName');
    planetTitle.textContent = this.el.getAttribute('name') || 'Planeta';
    const qText = document.getElementById('quizQuestion');
    const answersContainer = document.getElementById('quizAnswers');

    qText.textContent = questionData.question;
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
          score += pontos;
          pontos = 4;
          updateScoreDisplay();
          this.currentQuestionIndex++;
          this.triggeredOnce = this.currentQuestionIndex >= this.questions.length;
          setTimeout(() => modal.classList.remove('show'), 1000);
        } else {
          btn.classList.add('incorrect');
          pontos -= 1;
          updateScoreDisplay();
        }
      });
      answersContainer.appendChild(btn);
    });

    modal.classList.add('show');
  }
});

// Track distance to nearest planet
AFRAME.registerComponent('planet-distance-tracker', {
  tick() {
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

    const camCoords = gpsComponent._currentPosition;
    const planets = document.querySelectorAll('[gps-new-entity-place]');

    let closest = null, minDistance = Infinity;

    planets.forEach((planet) => {
      const entityCoords = planet.getAttribute('gps-new-entity-place');
      if (!entityCoords) return;
      const dist = getDistanceFromLatLonInM(
        camCoords.latitude, camCoords.longitude,
        entityCoords.latitude, entityCoords.longitude
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

// Show info panel on click
AFRAME.registerComponent('show-plane', {
  schema: { name: { type: 'string' }, desc: { type: 'string' }, image: { type: 'string' } },
  init() {
    this.el.addEventListener('click', () => {
      const panel = document.getElementById('info-panel');
      const text = document.getElementById('info-text');
      text.innerHTML = `<strong>${this.data.name}</strong><br><img src="${this.data.image}" style="max-width:100%; border-radius:10px;"/><br><br>${this.data.desc || "Sem descrição disponível."}`;
      panel.style.display = 'block';
    });
  }
});

// ===================
// Main Initialization
// ===================

async function initPlanets() {
  try {
    const response = await fetch('system2.json'); // relative path from index.html
    const data = await response.json();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          createPlanets(position.coords.latitude, position.coords.longitude, data);
        },
        (error) => console.error("Erro ao obter localização:", error),
        { enableHighAccuracy: true }
      );
    }
  } catch (error) {
    console.error("Erro ao carregar system2.json:", error);
  }
}

function createOrbitRing(userLat, userLon, orbitDistance) {
  const ring = document.createElement("a-ring");
  ring.setAttribute("gps-new-entity-place", {latitude: userLat, longitude: userLon});
  ring.setAttribute("radius-inner", orbitDistance - 1);
  ring.setAttribute("radius-outer", orbitDistance + 1);
  ring.setAttribute("rotation", "-90 0 0");
  ring.setAttribute("material", { color: "#ffffff", shader: "flat", opacity: 0.3, side: "double" });
  document.querySelector("a-scene").appendChild(ring);
}

function createPlanets(userLat, userLon, data) {
  const planetData = data.planets;
  const scene = document.querySelector("a-scene");

  planetData.forEach((planet) => {
    const coords = computeOffset(userLat, userLon, planet.distanciafoco1, 0);
    const entity = document.createElement("a-entity");
    entity.setAttribute("cursor", "rayOrigin:mouse");

    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("name", planet.name);
    sphere.setAttribute("gps-new-entity-place", { latitude: coords.lat, longitude: coords.lon });
    sphere.setAttribute("radius", planet.size);
    sphere.setAttribute("shadow", "");
    const imgSrc = "data:image/jpg;base64," + planet.texture;
    sphere.setAttribute("material", { src: imgSrc, shader: "standard" });
    sphere.setAttribute("show-plane", { name: planet.name, desc: planet.description, image: planet.image });

    if (planet.speed > 0) {
      sphere.setAttribute("dynamic-movement", {
        type: "spin", speed: planet.speed,
        originLat: userLat, originLon: userLon, distance: planet.distanciafoco1
      });
      createOrbitRing(userLat, userLon, planet.distanciafoco1);
    }

    if (planet.questions && planet.questions.length > 0) {
      sphere.setAttribute("proximity-check", {
        range: 5, questions: JSON.stringify(planet.questions), triggered: false
      });
    }

    entity.appendChild(sphere);
    scene.appendChild(entity);
  });
}

// Run once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initPlanets();
  updateScoreDisplay();
});
