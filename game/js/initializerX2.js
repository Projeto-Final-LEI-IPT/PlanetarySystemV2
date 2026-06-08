// ===========================================
// INICIALIZADOR DO SISTEMA PLANETÁRIO - VERSÃO X2
// ===========================================
// Este ficheiro inicializa a aplicação de Realidade Aumentada para a versão X2 do sistema

// ================================
// Função: Inicializar Planetas
// ================================
// Função assíncrona que carrega os dados dos planetas do ficheiro JSON
// e cria os planetas na cena
async function initPlanets() {
  try {
    // Carrega o ficheiro JSON com os dados do sistema planetário X2
    const response = await fetch('../data/SystemDataX2.json');
    const data = await response.json();

    // Reduzimos as distâncias em 90% para deixar os planetas mais próximos e alinhados com a escala base
    data.planets.forEach(p => {
      p.distanciafoco1 *= 0.1;
    });

    // Verifica se o navegador suporta Geolocalização
    if (navigator.geolocation) {
      // Obtém a posição GPS do utilizador com alta precisão
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Deslocamos a origem 5 metros para Norte para o utilizador ver o Sol à frente
          const startPos = computeOffset(position.coords.latitude, position.coords.longitude, 5, 0);
          createPlanets(startPos.lat, startPos.lon, data);
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
    console.error("Erro ao carregar system2.json:", error);
  }
}

// ================================
// Inicialização da Página
// ================================
// Aguarda que o DOM esteja completamente carregado antes de executar
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa os planetas e a experiência de RA
  initPlanets();
  
  // Atualiza o display de pontuação na interface
  updateScoreDisplay();
});
