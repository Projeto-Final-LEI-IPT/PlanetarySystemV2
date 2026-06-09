// ===========================================
// COMPONENTES A-FRAME (VERSÃO 3.2 - ESTABILIZAÇÃO TOTAL)
// ===========================================

AFRAME.registerComponent('dynamic-movement', {
  schema: {
    speed: { type: 'number', default: 0.00001 }
  },
  init() { this.angle = 0; },
  tick(time, timeDelta) {
    const speedMultiplier = 200000; 
    this.angle += (this.data.speed * speedMultiplier) * (timeDelta / 1000);
    if (this.angle >= 360) this.angle -= 360;
    this.el.setAttribute('rotation', `0 ${this.angle} 0`);
  }
});

AFRAME.registerComponent('proximity-check', {
  schema: {
    range: { type: 'number', default: 5 },
    questions: { type: 'string', default: '[]' },
    completed: { type: 'boolean', default: false }
  },
  
  init() {
    this.questions = JSON.parse(this.data.questions);
    this.triggered = false;
    this.isCompleted = false;
    this.worldPos = new THREE.Vector3();
    this.camWorldPos = new THREE.Vector3();
    this.smoothedDist = null;
    this.startTime = Date.now(); // Delay inicial para evitar bugs de sobreposição
  },
  
  tick() {
    // IGNORA OS PRIMEIROS 3 SEGUNDOS PARA ESTABILIZAR GPS
    if (Date.now() - this.startTime < 3000) return;

    const planetName = this.el.getAttribute('name');
    if (this.data.completed || this.isCompleted) {
      updateOrbitColor(planetName, "#00ff00", 0.7);
      return;
    }

    this.el.object3D.getWorldPosition(this.worldPos);
    const cameraEl = this.el.sceneEl.camera.el;
    cameraEl.object3D.getWorldPosition(this.camWorldPos);

    // CALCULO 2D
    const rawDist = Math.sqrt(
      Math.pow(this.camWorldPos.x - this.worldPos.x, 2) + 
      Math.pow(this.camWorldPos.z - this.worldPos.z, 2)
    );

    if (isNaN(rawDist)) return;

    // SUAVIZAÇÃO MODERADA (Mais reativo que o original)
    if (this.smoothedDist === null) {
      this.smoothedDist = rawDist;
    } else {
      this.smoothedDist = (this.smoothedDist * 0.8) + (rawDist * 0.2);
    }

    const dist = this.smoothedDist;
    const distanciaAviso = 15;
    const margemSaida = 3; 

    if (dist <= this.data.range) {
      updateOrbitColor(planetName, "#ffaa00", 0.8);
      if (!this.triggered) {
        this.triggered = true;
        this.showQuestion();
      }
    } else if (dist > this.data.range + margemSaida) {
      this.triggered = false; 
      if (dist <= distanciaAviso) {
        updateOrbitColor(planetName, "#ffff00", 0.6); 
      } else {
        updateOrbitColor(planetName, "#ffffff", 0.3);
      }
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
          this.isCompleted = true;
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

AFRAME.registerComponent('planet-distance-tracker', {
  init() {
    this.worldPos = new THREE.Vector3();
    this.camWorldPos = new THREE.Vector3();
    this.smoothedDist = null;
    this.lastTarget = null;
    this.victoryTriggered = false;
  },
  tick() {
    const planets = Array.from(document.querySelectorAll('[proximity-check]'));
    
    // EVITA MENSAGEM DE VITÓRIA SE A CENA AINDA ESTIVER A CARREGAR
    if (planets.length === 0) return;

    let targetPlanet = null;
    for (let planet of planets) {
      const prox = planet.components['proximity-check'];
      if (prox && !prox.isCompleted && !prox.data.completed) {
        targetPlanet = planet;
        break;
      }
    }

    const display = document.getElementById('distanceDisplay');
    if (targetPlanet) {
      if (this.lastTarget !== targetPlanet) {
        this.smoothedDist = null;
        this.lastTarget = targetPlanet;
      }

      targetPlanet.object3D.getWorldPosition(this.worldPos);
      this.el.object3D.getWorldPosition(this.camWorldPos);
      
      const rawDist = Math.sqrt(
        Math.pow(this.camWorldPos.x - this.worldPos.x, 2) + 
        Math.pow(this.camWorldPos.z - this.worldPos.z, 2)
      );
      
      if (!isNaN(rawDist)) {
        if (this.smoothedDist === null) this.smoothedDist = rawDist;
        else this.smoothedDist = (this.smoothedDist * 0.7) + (rawDist * 0.3);
        
        display.textContent = `${Math.round(this.smoothedDist)} metros até ${targetPlanet.getAttribute('name')}`;
      }
      display.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      display.classList.remove('victory-state');
    } else {
      if (!this.victoryTriggered) {
        this.victoryTriggered = true;
        showVictoryModal();
      }
      display.textContent = "Sistema Solar Conquistado!";
      display.style.backgroundColor = "rgba(0, 255, 0, 0.8)";
      display.classList.add('victory-state');
    }
  }
});

AFRAME.registerComponent('show-plane', {
  schema: { name: { type: 'string' }, desc: { type: 'string' }, image: { type: 'string' } },
  init() {
    this.worldPos = new THREE.Vector3();
    this.camWorldPos = new THREE.Vector3();
    this.el.addEventListener('click', () => {
      const proxCheck = this.el.components['proximity-check'];
      if (proxCheck && !proxCheck.isCompleted && !proxCheck.data.completed) {
        this.el.object3D.getWorldPosition(this.worldPos);
        const cameraEl = this.el.sceneEl.camera.el;
        cameraEl.object3D.getWorldPosition(this.camWorldPos);
        const dist = Math.sqrt(Math.pow(this.camWorldPos.x - this.worldPos.x, 2) + Math.pow(this.camWorldPos.z - this.worldPos.z, 2));
        if (dist <= 10) { proxCheck.showQuestion(); return; }
      }
      const panel = document.getElementById('info-panel');
      const text = document.getElementById('info-text');
      text.innerHTML = `<strong>${this.data.name}</strong><br>${this.data.desc || "Sem descrição disponível."}`;
      panel.style.display = 'block';
    });
  }
});
