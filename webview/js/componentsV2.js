// ===========================================
// COMPONENTES A-FRAME (VERSÃO 2)
// ===========================================
// Este ficheiro contém componentes melhorados para a experiência em realidade aumentada

// ================================
// Componente: Movimento Dinâmico
// ================================
// Regista um componente A-Frame que permite o movimento orbital dos planetas
// Os planetas orbitam à volta de um ponto de origem com uma velocidade configurável
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
    // Guardamos a posição inicial para cálculos de proximidade sem saltos
    this.currentGPS = { lat: this.data.originLat, lon: this.data.originLon };
  },
  
  tick(time, timeDelta) {
    if (this.data.type === "spin") {
      // Aumentamos o ângulo. Multiplicamos a velocidade para um movimento visível
      // speed no JSON é pequena, então ajustamos para graus/segundo
      this.angle += (this.data.speed * 100) * (timeDelta / 1000);
      
      if (this.angle >= 360) this.angle -= 360;
      
      // Em vez de setAttribute('gps-new-entity-place'), calculamos a posição 
      // mas apenas atualizamos o GPS logicamente se necessário.
      // Para o movimento visual ser estável, usamos a transposição local do A-Frame
      const x = this.data.distance * Math.cos(this.angle * Math.PI / 180);
      const z = this.data.distance * Math.sin(this.angle * Math.PI / 180);
      
      // Aplicamos a posição relativa ao ponto de origem GPS
      this.el.setAttribute('position', `${x} 0 ${z}`);
      
      // Atualizamos as coordenadas lógicas para o proximity-check saber onde o planeta está
      const newCoords = computeOffset(
        this.data.originLat,
        this.data.originLon,
        this.data.distance,
        this.angle
      );
      this.currentGPS = newCoords;
    }
  }
});

// ================================
// Componente: Verificação de Proximidade (Versão Melhorada)
// ================================
// Regista um componente A-Frame que verifica a distância entre o utilizador e um planeta
// Quando o utilizador se aproxima o suficiente, dispara um quiz com perguntas
// Esta versão é melhorada com marcas de conclusão
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
    this.completed = false;          // Flag para indicar se foi completado
  },
  
  // Função chamada a cada fotograma para verificar a proximidade
  tick() {
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

    // Obtém o nome do planeta
    const planetName = this.el.getAttribute('name');
    
    // Se o utilizador está próximo da órbita, muda a cor para amarela (se não foi completado)
    if (dist <= 50 && dist > this.data.range && !this.completed) {  // 50 metros é um bom raio
      updateOrbitColor(planetName, "#ffff00", 0.6);  // Amarelo
    } else if (dist > 50 && !this.completed) {
      // Se se afastou, volta à cor original (branca) se não foi completado
      updateOrbitColor(planetName, "#ffffff", 0.3);  // Branco
    }

    // Sai da função se foi completado ou disparado
    if (this.triggeredOnce || this.completed) return;

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
    const planetName = this.el.getAttribute('name') || 'Planeta';
    planetTitle.textContent = planetName;
    
    // Define o texto da pergunta
    qText.textContent = questionData.question;
    
    // Limpa as respostas anteriores
    answersContainer.innerHTML = '';

    // Mantém referência ao elemento do planeta para uso posterior
    const planetEl = this.el;

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

          // Mostra uma marca indicando que o planeta foi conquistado e muda a cor da órbita para verde
          showCompletionMark(planetEl, planetName);
          
          // Marca como completado
          this.completed = true;
          
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
  tick() {
    const camera = document.querySelector('[gps-new-camera]');
    const gpsComponent = camera.components['gps-new-camera'];
    if (!gpsComponent || !gpsComponent._currentPosition) return;

    const camCoords = gpsComponent._currentPosition;
    const planets = document.querySelectorAll('[name]'); // Busca por elementos com nome (planetas)

    let closest = null, minDistance = Infinity;

    planets.forEach((planet) => {
      const dynMovement = planet.components['dynamic-movement'];
      let entityCoords = dynMovement ? dynMovement.currentGPS : planet.getAttribute('gps-new-entity-place');
      
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
      text.innerHTML = `<strong>${this.data.name}</strong><br>${this.data.desc || "Sem descrição disponível."}`;
      
      // Mostra o painel de informações
      panel.style.display = 'block';
    });
  }
});
