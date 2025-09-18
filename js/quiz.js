let score = 0;
let pontos = 4;

// Handles quiz UI, answer checking, etc.
function showQuiz(questionData, planetName) {
  
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
