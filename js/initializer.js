async function initPlanets() {
  try {
    const response = await fetch('data/system2.json');
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
    console.error("Erro ao carregar system2.json:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initPlanets();
  updateScoreDisplay();
});
