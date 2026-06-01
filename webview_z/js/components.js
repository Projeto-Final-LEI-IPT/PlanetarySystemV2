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
    }
  }
});

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
    // Sai da função se já foi disparado ou se não há mais perguntas
    if (this.triggeredOnce || this.currentQuestionIndex >= this.questions.length) return;

    // Obtém a câmara GPS do utilizador
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

    // Obtém as coordenadas GPS do utilizador
    const camCoords = gpsComponent._currentPosition;
    
    // Obtém as coordenadas GPS do planeta
    const entityCoords = this.el.getAttribute('gps-new-entity-place');
    if (!entityCoords) return;

    // Calcula a distância entre o utilizador e o planeta
    const dist = getDistanceFromLatLonInM(
      camCoords.latitude,
      camCoords.longitude,
      entityCoords.latitude,
      entityCoords.longitude
    );

    // Se o utilizador está dentro do intervalo de proximidade, mostra o quiz
    if (dist <= this.data.range) {
      this.triggeredOnce = true;  // Marca para não disparar novamente
      this.showQuestion();         // Mostra a pergunta
    }
  },
  // Mostra a pergunta do quiz ao utilizador
  showQuestion() {
    // Seleciona uma pergunta aleatória do array de perguntas
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    const questionData = this.questions[randomIndex];
    if (!questionData) return;

    // Obtém os elementos da interface do modal de quiz
    const modal = document.getElementById('quizModal');
    const planetTitle = document.getElementById('quizPlanetName');
    const qText = document.getElementById('quizQuestion');
    const answersContainer = document.getElementById('quizAnswers');

    // Define o título do planeta no modal
    planetTitle.textContent = this.el.getAttribute('name') || 'Planeta';
    
    // Define o texto da pergunta
    qText.textContent = questionData.question;
    
    // Limpa as respostas anteriores
    answersContainer.innerHTML = '';

    // Cria um botão para cada resposta possível
    questionData.answers.forEach((answer, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer';
      btn.textContent = answer;

      // Adiciona um listener para quando o utilizador clica numa resposta
      btn.addEventListener('click', () => {
        // Evita cliques múltiplos no mesmo botão
        if (btn.classList.contains('clicked')) return;
        btn.classList.add('clicked');
        btn.disabled = true;

        // Verifica se é a resposta correta
        if (i === questionData.rightAnswer) {
          // Resposta correta: adiciona pontos e marca como verde
          btn.classList.add('correct');
          score += pontos;     // Adiciona os pontos à pontuação total
          pontos = 4;           // Redefine os pontos para a próxima pergunta
          updateScoreDisplay(); // Atualiza o display da pontuação
          this.currentQuestionIndex++;
          this.triggeredOnce = this.currentQuestionIndex >= this.questions.length;
          // Fecha o modal após 1 segundo
          setTimeout(() => modal.classList.remove('show'), 1000);
        } else {
          // Resposta incorreta: subtrai pontos e marca como vermelho
          btn.classList.add('incorrect');
          pontos -= 1;          // Subtrai um ponto pela resposta incorreta
          updateScoreDisplay(); // Atualiza o display da pontuação
        }
      });
      answersContainer.appendChild(btn);
    });

    // Mostra o modal de quiz
    modal.classList.add('show');
  }
});

// ================================
// Componente: Rastreador de Distância
// ================================
// Regista um componente A-Frame que calcula e apresenta a distância até ao planeta mais próximo
AFRAME.registerComponent('planet-distance-tracker', {
  // Função chamada a cada fotograma para atualizar a distância
  tick() {
    // Obtém a câmara GPS do utilizador
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

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
      const dist = getDistanceFromLatLonInM(
        camCoords.latitude, camCoords.longitude,
        entityCoords.latitude, entityCoords.longitude
      );
      
      // Atualiza o planeta mais próximo se encontrar um mais perto
      if (dist < minDistance) {
        minDistance = dist;
        closest = planet;
      }
    });

    // Obtém o elemento para apresentar a distância
    const display = document.getElementById('distanceDisplay');
    
    // Atualiza o texto apresentado
    if (closest && minDistance < 1000) {
      // Se há um planeta próximo (menos de 1km), mostra a distância em metros
      display.textContent = `${Math.round(minDistance)} metros até ${closest.getAttribute('name') || 'um planeta'}`;
    } else if (closest) {
      // Se há um planeta mas está longe, mostra uma mensagem genérica
      display.textContent = `Aproximando-se de ${closest.getAttribute('name') || 'um planeta'}`;
    }
  }
});

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
