// ===========================================
// COMPONENTES A-FRAME (VERSÃO 3 - HIERARQUIA 3D + SMOOTHING)
// ===========================================

// ================================
// Componente: Movimento Dinâmico (Rotação de Pivot)
// ================================
AFRAME.registerComponent('dynamic-movement', {
  schema: {
    speed: { type: 'number', default: 0.00001 }
  },
  
  init() {
    this.angle = 0;
  },
  
  tick(time, timeDelta) {
    // Reduzi o multiplicador de 1.000.000 para 200.000 para andar 5x mais devagar
    const speedMultiplier = 200000; 
    this.angle += (this.data.speed * speedMultiplier) * (timeDelta / 1000);
    if (this.angle >= 360) this.angle -= 360;
    this.el.setAttribute('rotation', `0 ${this.angle} 0`);
  }
});

// ================================
// Componente: Verificação de Proximidade (3D World Distance + Smoothing)
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
    this.isCompleted = false;
    this.worldPos = new THREE.Vector3();
    this.camWorldPos = new THREE.Vector3();
    this.smoothedDist = null;
  },
  
  tick() {
    const planetName = this.el.getAttribute('name');
    
    if (this.data.completed || this.isCompleted) {
      updateOrbitColor(planetName, "#00ff00", 0.7);
      return;
    }

    this.el.object3D.getWorldPosition(this.worldPos);
    const cameraEl = this.el.sceneEl.camera.el;
    cameraEl.object3D.getWorldPosition(this.camWorldPos);

    const rawDist = this.camWorldPos.distanceTo(this.worldPos);
    if (isNaN(rawDist)) return;

    // Filtro Passa-Baixo (Smoothing)
    if (this.smoothedDist === null) {
      this.smoothedDist = rawDist;
    } else {
      this.smoothedDist = (this.smoothedDist * 0.9) + (rawDist * 0.1);
    }

    const dist = this.smoothedDist;
    const distanciaAviso = 15;

    if (dist <= this.data.range) {
      updateOrbitColor(planetName, "#ffaa00", 0.8);
      if (!this.triggered) {
        this.triggered = true;
        this.showQuestion();
      }
    } else if (dist <= distanciaAviso) {
      updateOrbitColor(planetName, "#ffff00", 0.6); 
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

// ================================
// Componente: Rastreador de Distância (3D World Distance + Smoothing)
// ================================
AFRAME.registerComponent('planet-distance-tracker', {
  init() {
    this.worldPos = new THREE.Vector3();
    this.camWorldPos = new THREE.Vector3();
    this.smoothedDist = null;
    this.lastTarget = null;
  },
  tick() {
    const planets = Array.from(document.querySelectorAll('[proximity-check]'));
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
      
      const rawDist = this.camWorldPos.distanceTo(this.worldPos);
      
      if (!isNaN(rawDist)) {
        if (this.smoothedDist === null) {
          this.smoothedDist = rawDist;
        } else {
          this.smoothedDist = (this.smoothedDist * 0.9) + (rawDist * 0.1);
        }
        display.textContent = `${Math.round(this.smoothedDist)} metros até ${targetPlanet.getAttribute('name')}`;
      }
      display.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
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
    this.worldPos = new THREE.Vector3();
    this.camWorldPos = new THREE.Vector3();

    this.el.addEventListener('click', () => {
      const proxCheck = this.el.components['proximity-check'];
      
      if (proxCheck && !proxCheck.isCompleted && !proxCheck.data.completed) {
        this.el.object3D.getWorldPosition(this.worldPos);
        const cameraEl = this.el.sceneEl.camera.el;
        cameraEl.object3D.getWorldPosition(this.camWorldPos);

        const rawDist = this.camWorldPos.distanceTo(this.worldPos);

        if (rawDist <= 10) {
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
