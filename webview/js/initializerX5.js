<<<<<<< HEAD
async function initPlanets() {
  try {
    const response = await fetch('../data/SystemDataX5.json');
    const data = await response.json();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          createPlanets(position.coords.latitude, position.coords.longitude, data);
        },
        (error) => console.error("Erro ao obter localização:", error),
        { enableHighAccuracy: true }
      );
    }
  } catch (error) {
=======
// ===========================================
// INICIALIZADOR DO SISTEMA PLANETÁRIO - VERSÃO X5
// ===========================================
// Este ficheiro inicializa a aplicação de Realidade Aumentada para a versão X5 do sistema

// ================================
// Função: Inicializar Planetas
// ================================
// Função assíncrona que carrega os dados dos planetas do ficheiro JSON
// e cria os planetas na cena
async function initPlanets() {
  try {
    // Carrega o ficheiro JSON com os dados do sistema planetário X5
    const response = await fetch('../data/SystemDataX5.json');
    const data = await response.json();

    // Verifica se o navegador suporta Geolocalização
    if (navigator.geolocation) {
      // Obtém a posição GPS do utilizador com alta precisão
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Sucesso: Utiliza as coordenadas obtidas para criar os planetas
          createPlanets(position.coords.latitude, position.coords.longitude, data);
        },
        (error) => {
          // Erro: Regista o erro na consola
          console.error("Erro ao obter localização:", error);
        },
        { enableHighAccuracy: true }  // Opções: pedidos de alta precisão
      );
    }
  } catch (error) {
    // Trata erros ao carregar o ficheiro JSON
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
    console.error("Erro ao carregar system2.json:", error);
  }
}

<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {
  initPlanets();
=======
// ================================
// Inicialização da Página
// ================================
// Aguarda que o DOM esteja completamente carregado antes de executar
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa os planetas e a experiência de RA
  initPlanets();
  
  // Atualiza o display de pontuação na interface
>>>>>>> 130c560d65fbab67b3406a96b0b4f21ea3f0636d
  updateScoreDisplay();
});
