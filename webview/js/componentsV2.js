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
    this.currentGPS = { latitude: this.data.originLat, longitude: this.data.originLon };
  },
  
  tick(time, timeDelta) {
    if (this.data.type === "spin") {
      // Aumentamos o multiplicador para 1000000 para tornar o movimento bem mais rápido
      this.angle += (this.data.speed * 1000000) * (timeDelta / 1000);
      if (this.angle >= 360) this.angle -= 360;
      
      const newCoords = computeOffset(
        this.data.originLat,
        this.data.originLon,
        this.data.distance,
        this.angle
      );
      
      this.currentGPS = { 
        latitude: newCoords.lat, 
        longitude: newCoords.lon 
      };
      
      this.el.setAttribute('gps-new-entity-place', {
        latitude: this.currentGPS.latitude,
        longitude: this.currentGPS.longitude
      });
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
    completed: { type: 'boolean', default: false }
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

    if (!entityCoords || entityCoords.latitude === undefined) return;

    const dist = getDistanceFromLatLonInM(
      camCoords.latitude, camCoords.longitude,
      entityCoords.latitude, entityCoords.longitude
    );

    if (isNaN(dist)) return;

    if (dist <= this.data.range) {
      updateOrbitColor(planetName, "#ffff00", 0.8);
      if (!this.triggered) {
        this.triggered = true;
        this.showQuestion();
      }
    } else if (dist <= 50) {
      updateOrbitColor(planetName, "#ffff00", 0.4);
    } else {
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

          // Marcamos como completo no componente
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
    
    // Lista de entidades que têm o componente de proximidade
    const planets = Array.from(document.querySelectorAll('[proximity-check]'));

    // Encontra o próximo planeta que NÃO está completado
    let targetPlanet = planets.find(planet => {
      const prox = planet.components['proximity-check'];
      // Acedemos diretamente aos dados do componente para garantir atualização em tempo real
      return prox && prox.data && !prox.data.completed;
    });

    const display = document.getElementById('distanceDisplay');

    if (targetPlanet) {
      const dynMovement = targetPlanet.components['dynamic-movement'];
      let entityCoords = dynMovement ? dynMovement.currentGPS : targetPlanet.getAttribute('gps-new-entity-place');
      
      if (entityCoords && entityCoords.latitude !== undefined) {
        const dist = getDistanceFromLatLonInM(
          camCoords.latitude, camCoords.longitude,
          entityCoords.latitude, entityCoords.longitude
        );
        
        if (!isNaN(dist)) {
          display.textContent = `${Math.round(dist)} metros até ${targetPlanet.getAttribute('name')}`;
        }
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
      const camera = document.querySelector('[gps-new-camera]');
      const gpsComponent = camera.components['gps-new-camera'];
      const proxCheck = this.el.components['proximity-check'];
      
      if (gpsComponent && gpsComponent._currentPosition && proxCheck && !proxCheck.data.completed) {
        const camCoords = gpsComponent._currentPosition;
        const dynMovement = this.el.components['dynamic-movement'];
        let entityCoords = dynMovement ? dynMovement.currentGPS : this.el.getAttribute('gps-new-entity-place');

        const dist = getDistanceFromLatLonInM(
          camCoords.latitude, camCoords.longitude,
          entityCoords.latitude, entityCoords.longitude
        );

        if (dist <= 10) {
          proxCheck.showQuestion();
          return;
        }
      }

      const panel = document.getElementById('info-panel');
      const text = document.getElementById('info-text');
      text.innerHTML = `<strong>${this.data.name}</strong><br>${this.data.desc || "Sem descrição disponível."}`;
      panel.style.display = 'block';
    });
  }
});