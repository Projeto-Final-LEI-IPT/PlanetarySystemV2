// ===========================================
// VARIÁVEIS GLOBAIS DO QUIZ
// ===========================================
// Pontuação total do utilizador
let score = 0;

// Pontos por resposta correta (varia consoante o número de tentativas)
let pontos = 4;

// ===========================================
// FUNÇÃO: Mostrar Quiz
// ===========================================
// Constrói e apresenta a interface do quiz ao utilizador quando próximo de um planeta
// Parâmetros:
//   - questionData: Objeto com a pergunta e as opções de resposta
//   - planetName: Nome do planeta para apresentar no título do quiz
function showQuiz(questionData, planetName) {
  // Seleciona uma pergunta aleatória do array de perguntas
  const randomIndex = Math.floor(Math.random() * this.questions.length);
  const questionData = this.questions[randomIndex];
  
  // Se não há dados de pergunta, sai da função
  if (!questionData) return;

  // Obtém os elementos da interface DOM
  const modal = document.getElementById('quizModal');
  const planetTitle = document.getElementById('quizPlanetName');
  const qText = document.getElementById('quizQuestion');
  const answersContainer = document.getElementById('quizAnswers');

  // Define o título com o nome do planeta
  planetTitle.textContent = this.el.getAttribute('name') || 'Planeta';
  
  // Define o texto da pergunta
  qText.textContent = questionData.question;
  
  // Limpa qualquer conteúdo anterior
  answersContainer.innerHTML = '';

  // Cria um botão para cada resposta possível
  questionData.answers.forEach((answer, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer';
    btn.textContent = answer;

    // Adiciona listener para quando o utilizador clica numa resposta
    btn.addEventListener('click', () => {
      // Volta e sai se o utilizador já clicou neste botão
      if (btn.classList.contains('clicked')) return;
      
      // Marca o botão como clicado e desabilita-o
      btn.classList.add('clicked');
      btn.disabled = true;

      // Verifica se é a resposta correta
      if (i === questionData.rightAnswer) {
        // Resposta correta: marca como verde e adiciona pontos
        btn.classList.add('correct');
        score += pontos;      // Soma os pontos à pontuação total
        pontos = 4;           // Redefine os pontos para 4 (valor inicial)
        updateScoreDisplay(); // Atualiza o display da pontuação
        
        // Incrementa o índice da pergunta
        this.currentQuestionIndex++;
        
        // Verifica se todas as perguntas foram respondidas
        this.triggeredOnce = this.currentQuestionIndex >= this.questions.length;
        
        // Fecha o modal após 1 segundo
        setTimeout(() => modal.classList.remove('show'), 1000);
      } else {
        // Resposta incorreta: marca como vermelho e subtrai pontos
        btn.classList.add('incorrect');
        pontos -= 1;          // Subtrai um ponto por cada tentativa incorreta
        updateScoreDisplay(); // Atualiza o display da pontuação
      }
    });
    
    // Adiciona o botão ao contentor de respostas
    answersContainer.appendChild(btn);
  });

  // Mostra o modal com o quiz
  modal.classList.add('show');
}
