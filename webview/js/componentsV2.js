// ===========================================
// COMPONENTES A-FRAME (VERSÃO 2)
// ===========================================

// ================================
// Componente: Movimento Dinâmico
// ================================
AFRAME.registerComponent('dynamic-movement', {
  schema: {
    type: { type: 'string' },
    speed: { type: 'number', default: 0.00001 },
    originLat: { type: 'number' },
    originLon: { type: 'number' },
    distance: { type: 'number' }
  },
  
  init() {
    this.angle = 0;
    this.currentGPS = { lat: this.data.originLat, lon: this.data.originLon };
  },
  
  tick(time, timeDelta) {
    if (this.data.type === "spin") {
      this.angle += (this.data.speed * 100) * (timeDelta / 1000);
      if (this.angle >= 360) this.angle -= 360;
      
      const newCoords = computeOffset(
        this.data.originLat,
        this.data.originLon,
        this.data.distance,
        this.angle
      );
      
      this.el.setAttribute('gps-new-entity-place', {
        latitude: newCoords.lat,
        longitude: newCoords.lon
      });
      
      this.currentGPS = newCoords;
    }
  }
});

// ================================
// Componente: Verificação de Proximidade
// ================================
AFRAME.registerComponent('proximity-check', {
  schema: {
    range: { type: 'number', default: 5 },
    questions: { type: 'string', default: '[]' },
    completed: { type: 'boolean', default: false } // Estado guardado no schema
  },
  
  init() {
    this.questions = JSON.parse(this.data.questions);
    this.triggered = false;
  },
  
  tick() {
    const planetName = this.el.getAttribute('name');
    
    // Se já completou, garante que a órbita fica verde e para aqui
    if (this.data.completed) {
      updateOrbitColor(planetName, "#00ff00", 0.7);
      return;
    }

    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

    const camCoords = gpsComponent._currentPosition;
    const dynMovement = this.el.components['dynamic-movement'];
    let entityCoords = dynMovement ? dynMovement.currentGPS : this.el.getAttribute('gps-new-entity-place');

    if (!entityCoords) return;

    const dist = getDistanceFromLatLonInM(
      camCoords.latitude, camCoords.longitude,
      entityCoords.latitude, entityCoords.longitude
    );

    // Lógica de cores da órbita
    if (dist <= this.data.range) {
      // No raio do quiz: Amarelo brilhante
      updateOrbitColor(planetName, "#ffff00", 0.8);
      if (!this.triggered) {
        this.triggered = true;
        this.showQuestion();
      }
    } else if (dist <= 50) {
      // Perto: Amarelo suave
      updateOrbitColor(planetName, "#ffff00", 0.4);
    } else {
      // Longe: Branco
      updateOrbitColor(planetName, "#ffffff", 0.3);
    }
  },
  
  showQuestion() {
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    const questionData = this.questions[randomIndex];
    if (!questionData) return;

    const modal = document.getElementById('quizModal');
    const planetTitle = document.getElementById('quizPlanetName');
    const qText = document.getElementById('quizQuestion');
    const answersContainer = document.getElementById('quizAnswers');

    planetTitle.textContent = this.el.getAttribute('name') || 'Planeta';
    qText.textContent = questionData.question;
    answersContainer.innerHTML = '';

    const planetEl = this.el;
    const planetName = planetEl.getAttribute('name');

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

          // MARCAR COMO COMPLETADO NO SCHEMA (O tracker vai ver isto)
          planetEl.setAttribute('proximity-check', 'completed', true);
          
          showCompletionMark(planetEl, planetName);
          
          setTimeout(() => modal.classList.remove('show'), 1000);
        } else {
          btn.classList.add('incorrect');
          pontos = Math.max(1, pontos - 1);
        }
      });
      answersContainer.appendChild(btn);
    });

    modal.classList.add('show');
  }
});

// ================================
// Componente: Rastreador de Distância
// ================================
AFRAME.registerComponent('planet-distance-tracker', {
  tick() {
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

    const camCoords = gpsComponent._currentPosition;
    
    // Lista de planetas na ordem correta
    const planets = Array.from(document.querySelectorAll('[proximity-check]'));

    // Encontra o próximo planeta que NÃO está completado
    let targetPlanet = planets.find(planet => {
      const proxData = planet.getAttribute('proximity-check');
      // O getAttribute pode retornar string ou objeto dependendo do estado
      return proxData && !proxData.completed;
    });

    const display = document.getElementById('distanceDisplay');

    if (targetPlanet) {
      const dynMovement = targetPlanet.components['dynamic-movement'];
      let entityCoords = dynMovement ? dynMovement.currentGPS : targetPlanet.getAttribute('gps-new-entity-place');
      
      if (entityCoords) {
        const dist = getDistanceFromLatLonInM(
          camCoords.latitude, camCoords.longitude,
          entityCoords.latitude, entityCoords.longitude
        );
        display.textContent = `${Math.round(dist)} metros até ${targetPlanet.getAttribute('name')}`;
        display.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      }
    } else {
      display.textContent = "Sistema Solar Conquistado! Parabéns!";
      display.style.backgroundColor = "rgba(0, 255, 0, 0.7)";
    }
  }
});

// ================================
// Componente: Mostrar Painel de Informações
// ================================
AFRAME.registerComponent('show-plane', {
  schema: {
    name: { type: 'string' },
    desc: { type: 'string' },
    image: { type: 'string' }
  },
  init() {
    this.el.addEventListener('click', () => {
      const panel = document.getElementById('info-panel');
      const text = document.getElementById('info-text');
      text.innerHTML = `<strong>${this.data.name}</strong><br>${this.data.desc || "Sem descrição disponível."}`;
      panel.style.display = 'block';
    });
  }
});