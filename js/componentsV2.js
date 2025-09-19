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
      // Keep angle in 0–360 range
      if (this.angle >= 360) this.angle -= 360;
      const newCoords = computeOffset(this.data.originLat, this.data.originLon, this.data.distance, this.angle * (180 / Math.PI));
      this.el.setAttribute('gps-new-entity-place', { latitude: newCoords.lat, longitude: newCoords.lon });
    }
  }
});

// Quiz trigger when close to planet
AFRAME.registerComponent('proximity-check', {
  schema: {
    range: { type: 'number', default: 1 },
    questions: { type: 'string', default: '[]' },
    triggered: { type: 'boolean', default: false }
  },
  init() {
    this.questions = JSON.parse(this.data.questions);
    this.currentQuestionIndex = 0;
    this.triggeredOnce = false;
    this.completed = false;
  },
  tick() {
    if (this.triggeredOnce || this.completed) return;

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

    const planetEl = this.el;

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

          showCompletionMark(planetEl);
          
          this.completed = true;
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
