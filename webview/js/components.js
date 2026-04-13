<<<<<<< HEAD
// Movement around orbit
AFRAME.registerComponent('dynamic-movement', {
  schema: {
    type: { type: 'string' },
    speed: { type: 'number', default: 0.00001 },
    originLat: { type: 'number' },
    originLon: { type: 'number' },
    distance: { type: 'number' },
    startAngle: { type: 'number', default: 0 } // Nova propriedade para receber o ângulo
  },
  init() { 
    // Começa no ângulo aleatório gerado no script.js
    this.angle = this.data.startAngle; 
  },
  tick(time, timeDelta) {
    if (this.data.type === "spin") {
      this.angle += this.data.speed * timeDelta;
      // Keep angle in 0–360 range
      if (this.angle >= 360) this.angle -= 360;
      const newCoords = computeOffset(this.data.originLat, this.data.originLon, this.data.distance, this.angle * (180 / Math.PI));
      this.el.setAttribute('gps-new-entity-place', { latitude: newCoords.lat, longitude: newCoords.lon });
=======
// ================================
// Componente: Movimento Dinâmico
// ================================
// Regista um componente A-Frame que permite o movimento orbital dos planetas
// Os planetas orbitam à volta de um ponto de origem com uma velocidade configurável
AFRAME.registerComponent('dynamic-movement', {
  // Esquema de dados para o componente
  schema: {
    type: { type: 'string' },              // Tipo de movimento (ex: "spin")
    speed: { type: 'number', default: 0.00001 },  // Velocidade de rotação
    originLat: { type: 'number' },          // Latitude do ponto de origem
    originLon: { type: 'number' },          // Longitude do ponto de origem
    distance: { type: 'number' }            // Distância em metros da órbita
  },
  
  // Inicialização do componente
  init() {
    this.angle = 0;  // Ângulo inicial em graus
  },
  
  // Função chamada a cada fotograma para atualizar a posição
  tick(time, timeDelta) {
    if (this.data.type === "spin") {
      // Incrementa o ângulo de acordo com a velocidade
      this.angle += this.data.speed * timeDelta;
      
      // Mantém o ângulo entre 0 e 360 graus
      if (this.angle >= 360) this.angle -= 360;
      
      // Calcula as novas coordenadas da órbita usando as coordenadas GPS
      const newCoords = computeOffset(
        this.data.originLat,
        this.data.originLon,
        this.data.distance,
        this.angle * (180 / Math.PI)
      );
      
      // Atualiza a posição do elemento no mapa
      this.el.setAttribute('gps-new-entity-place', {
        latitude: newCoords.lat,
        longitude: newCoords.lon
      });
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    }
  }
});

<<<<<<< HEAD
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
  },
  tick() {
    if (this.triggeredOnce || this.currentQuestionIndex >= this.questions.length) return;

=======
// ================================
// Componente: Verificação de Proximidade
// ================================
// Regista um componente A-Frame que verifica a distância entre o utilizador e um planeta
// Quando o utilizador se aproxima o suficiente, dispara um quiz com perguntas
AFRAME.registerComponent('proximity-check', {
  // Esquema de dados para o componente
  schema: {
    range: { type: 'number', default: 1 },           // Intervalo em metros para disparar o quiz
    questions: { type: 'string', default: '[]' },    // Array JSON com as perguntas do quiz
    triggered: { type: 'boolean', default: false }   // Flag indicando se foi disparado
  },
  
  // Inicialização do componente
  init() {
    // Converte as perguntas de string JSON para array
    this.questions = JSON.parse(this.data.questions);
    this.currentQuestionIndex = 0;  // Índice da pergunta atual
    this.triggeredOnce = false;      // Indica se já foi disparado uma vez
  },
  
  // Função chamada a cada fotograma para verificar a proximidade
  tick() {
    // Obtém a câmara GPS do utilizador
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

<<<<<<< HEAD
    const camCoords = gpsComponent._currentPosition;
    const entityCoords = this.el.getAttribute('gps-new-entity-place');
    if (!entityCoords) return;

=======
    // Obtém as coordenadas GPS do utilizador
    const camCoords = gpsComponent._currentPosition;
    
    // Obtém as coordenadas GPS do planeta
    const entityCoords = this.el.getAttribute('gps-new-entity-place');
    if (!entityCoords) return;

    // Calcula a distância entre o utilizador e o planeta
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    const dist = getDistanceFromLatLonInM(
      camCoords.latitude,
      camCoords.longitude,
      entityCoords.latitude,
      entityCoords.longitude
    );

<<<<<<< HEAD
    if (dist <= this.data.range) {
      this.triggeredOnce = true;
      this.showQuestion();
    }
  },
  showQuestion() {
=======
    // Obtém o nome do planeta
    const planetName = this.el.getAttribute('name');
    
    // Se o utilizador está próximo da órbita, muda a cor para amarela
    if (dist <= 50 && dist > this.data.range) {  // 50 metros é um bom raio
      updateOrbitColor(planetName, "#ffff00", 0.6);  // Amarelo
    } else if (dist > 50) {
      // Se se afastou, volta à cor original (branca)
      updateOrbitColor(planetName, "#ffffff", 0.3);  // Branco
    }

    // Sai da função se já foi disparado ou se não há mais perguntas
    if (this.triggeredOnce || this.currentQuestionIndex >= this.questions.length) return;

    // Se o utilizador está dentro do intervalo de proximidade, mostra o quiz
    if (dist <= this.data.range) {
      this.triggeredOnce = true;  // Marca para não disparar novamente
      this.showQuestion();         // Mostra a pergunta
    }
  },
  // Mostra a pergunta do quiz ao utilizador
  showQuestion() {
    // Seleciona uma pergunta aleatória do array de perguntas
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    const questionData = this.questions[randomIndex];
    if (!questionData) return;

<<<<<<< HEAD
    const modal = document.getElementById('quizModal');
    const planetTitle = document.getElementById('quizPlanetName');
    planetTitle.textContent = this.el.getAttribute('name') || 'Planeta';
    const qText = document.getElementById('quizQuestion');
    const answersContainer = document.getElementById('quizAnswers');

    qText.textContent = questionData.question;
    answersContainer.innerHTML = '';

=======
    // Obtém os elementos da interface do modal de quiz
    const modal = document.getElementById('quizModal');
    const planetTitle = document.getElementById('quizPlanetName');
    const qText = document.getElementById('quizQuestion');
    const answersContainer = document.getElementById('quizAnswers');

    // Define o título do planeta no modal
    const planetName = this.el.getAttribute('name') || 'Planeta';
    planetTitle.textContent = planetName;
    
    // Define o texto da pergunta
    qText.textContent = questionData.question;
    
    // Limpa as respostas anteriores
    answersContainer.innerHTML = '';

    // Mantém referência ao elemento do planeta para uso posterior
    const planetEl = this.el;

    // Cria um botão para cada resposta possível
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    questionData.answers.forEach((answer, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer';
      btn.textContent = answer;

<<<<<<< HEAD
      btn.addEventListener('click', () => {
=======
      // Adiciona um listener para quando o utilizador clica numa resposta
      btn.addEventListener('click', () => {
        // Evita cliques múltiplos no mesmo botão
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
        if (btn.classList.contains('clicked')) return;
        btn.classList.add('clicked');
        btn.disabled = true;

<<<<<<< HEAD
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
=======
        // Verifica se é a resposta correta
        if (i === questionData.rightAnswer) {
          // Resposta correta: adiciona pontos e marca como verde
          btn.classList.add('correct');
          score += pontos;     // Adiciona os pontos à pontuação total
          pontos = 4;           // Redefine os pontos para a próxima pergunta
          updateScoreDisplay(); // Atualiza o display da pontuação
          
          // Mostra a marca de conclusão e muda a cor da órbita para verde
          showCompletionMark(planetEl, planetName);
          
          this.currentQuestionIndex++;
          this.triggeredOnce = this.currentQuestionIndex >= this.questions.length;
          // Fecha o modal após 1 segundo
          setTimeout(() => modal.classList.remove('show'), 1000);
        } else {
          // Resposta incorreta: subtrai pontos e marca como vermelho
          btn.classList.add('incorrect');
          pontos -= 1;          // Subtrai um ponto pela resposta incorreta
          updateScoreDisplay(); // Atualiza o display da pontuação
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
        }
      });
      answersContainer.appendChild(btn);
    });

<<<<<<< HEAD
=======
    // Mostra o modal de quiz
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    modal.classList.add('show');
  }
});

<<<<<<< HEAD
// Track distance to nearest planet
AFRAME.registerComponent('planet-distance-tracker', {
  tick() {
=======
// ================================
// Componente: Rastreador de Distância
// ================================
// Regista um componente A-Frame que calcula e apresenta a distância até ao planeta mais próximo
AFRAME.registerComponent('planet-distance-tracker', {
  // Função chamada a cada fotograma para atualizar a distância
  tick() {
    // Obtém a câmara GPS do utilizador
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

<<<<<<< HEAD
    const camCoords = gpsComponent._currentPosition;
    const planets = document.querySelectorAll('[gps-new-entity-place]');

    let closest = null, minDistance = Infinity;

    planets.forEach((planet) => {
      const entityCoords = planet.getAttribute('gps-new-entity-place');
      if (!entityCoords) return;
=======
    // Obtém as coordenadas GPS do utilizador
    const camCoords = gpsComponent._currentPosition;
    
    // Obtém todos os planetas da cena
    const planets = document.querySelectorAll('[gps-new-entity-place]');

    // Variáveis para rastrear o planeta mais próximo
    let closest = null, minDistance = Infinity;

    // Percorre todos os planetas para encontrar o mais próximo
    planets.forEach((planet) => {
      const entityCoords = planet.getAttribute('gps-new-entity-place');
      if (!entityCoords) return;
      
      // Calcula a distância até este planeta
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
      const dist = getDistanceFromLatLonInM(
        camCoords.latitude, camCoords.longitude,
        entityCoords.latitude, entityCoords.longitude
      );
<<<<<<< HEAD
=======
      
      // Atualiza o planeta mais próximo se encontrar um mais perto
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
      if (dist < minDistance) {
        minDistance = dist;
        closest = planet;
      }
    });

<<<<<<< HEAD
    const display = document.getElementById('distanceDisplay');
    if (closest && minDistance < 1000) {
      display.textContent = `${Math.round(minDistance)} metros até ${closest.getAttribute('name') || 'um planeta'}`;
    } else if (closest) {
=======
    // Obtém o elemento para apresentar a distância
    const display = document.getElementById('distanceDisplay');
    
    // Atualiza o texto apresentado
    if (closest && minDistance < 1000) {
      // Se há um planeta próximo (menos de 1km), mostra a distância em metros
      display.textContent = `${Math.round(minDistance)} metros até ${closest.getAttribute('name') || 'um planeta'}`;
    } else if (closest) {
      // Se há um planeta mas está longe, mostra uma mensagem genérica
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
      display.textContent = `Aproximando-se de ${closest.getAttribute('name') || 'um planeta'}`;
    }
  }
});

<<<<<<< HEAD
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
=======
// ================================
// Componente: Mostrar Painel de Informações
// ================================
// Regista um componente A-Frame que mostra informações sobre um planeta quando clicado
AFRAME.registerComponent('show-plane', {
  // Esquema de dados para o componente
  schema: {
    name: { type: 'string' },      // Nome do planeta
    desc: { type: 'string' },      // Descrição do planeta
    image: { type: 'string' }      // URL da imagem do planeta
  },
  
  // Inicialização do componente
  init() {
    // Adiciona um listener de clique ao elemento
    this.el.addEventListener('click', () => {
      // Obtém o painel de informações
      const panel = document.getElementById('info-panel');
      const text = document.getElementById('info-text');
      
      // Constrói o conteúdo HTML com a informação do planeta
      text.innerHTML = `<strong>${this.data.name}</strong><br><img src="${this.data.image}" style="max-width:100%; border-radius:10px;"/><br><br>${this.data.desc || "Sem descrição disponível."}`;
      
      // Mostra o painel de informações
      panel.style.display = 'block';
    });
  }
});
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
