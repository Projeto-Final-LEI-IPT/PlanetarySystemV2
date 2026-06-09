// ===========================================
// VARIÁVEIS GLOBAIS
// ===========================================
let score = 0;
let pontos = 4;
const DISTANCE_MULTIPLIER = 1.0;
let orbitMap = {};

// ===========================================
// FUNÇÕES PRINCIPAIS
// ===========================================

// ================================
// Função: Criar Planetas (Versão Hierárquica 3D)
// ================================
function createPlanets(userLat, userLon, data) {
  const planetData = data.planets;
  const scene = document.querySelector("a-scene");

  // 1. Criar o Contentor Central do Sistema Solar (O Sol/Origem)
  // Este objeto fica fixo no GPS onde o utilizador abriu o jogo
  const solarSystem = document.createElement("a-entity");
  solarSystem.setAttribute("id", "solar-system-root");
  solarSystem.setAttribute("gps-new-entity-place", { latitude: userLat, longitude: userLon });
  scene.appendChild(solarSystem);

  planetData.forEach((planet) => {
    const orbitDistance = planet.distanciafoco1 * DISTANCE_MULTIPLIER;

    // 2. Criar a Órbita (Anel Branco)
    // Agora o anel é um filho direto do contentor central
    if (planet.speed > 0 || planet.name === "Sol") {
      const ring = document.createElement("a-ring");
      const orbitDistRing = planet.name === "Sol" ? planet.size + 2 : orbitDistance;
      
      ring.setAttribute("radius-inner", orbitDistRing - 0.5);
      ring.setAttribute("radius-outer", orbitDistRing + 0.5);
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("material", { 
        color: "#ffffff", 
        shader: "flat", 
        opacity: 0.3, 
        side: "double" 
      });
      
      solarSystem.appendChild(ring);
      orbitMap[planet.name] = ring;
    }

    // 3. Criar o Pivot de Movimento (O braço invisível que roda)
    const pivot = document.createElement("a-entity");
    pivot.setAttribute("id", `pivot-${planet.name}`);
    solarSystem.appendChild(pivot);

    // 4. Criar o Planeta (A Esfera)
    // O planeta é filho do pivot e está afastado dele pela distância da órbita
    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("name", planet.name);
    // Posicionamos o planeta no eixo Z (para a frente do pivot)
    sphere.setAttribute("position", `0 0 ${-orbitDistance}`);
    sphere.setAttribute("radius", planet.size);
    sphere.setAttribute("shadow", "");
    
    const imgSrc = "data:image/jpg;base64," + planet.texture;
    sphere.setAttribute("material", { src: imgSrc, shader: "standard" });
    
    sphere.setAttribute("show-plane", { 
      name: planet.name, 
      desc: planet.description, 
      image: planet.image 
    });

    // Adiciona movimento ao PIVOT (não ao planeta diretamente)
    if (planet.speed > 0) {
      pivot.setAttribute("dynamic-movement", {
        speed: planet.speed
      });
    }

    if (planet.questions && planet.questions.length > 0) {
      sphere.setAttribute("proximity-check", {
        range: 5, 
        questions: JSON.stringify(planet.questions)
      });
    }

    pivot.appendChild(sphere);
  });
}

// ================================
// Funções de UI (Mantidas iguais)
// ================================
function showCompletionMark(planetEl, planetName){
  const mark = document.createElement("a-plane");
  mark.setAttribute("geometry", {width: 5, height: 3 });
  mark.setAttribute("material", {color: "green", opacity: 0.9, side: "double" });
  mark.setAttribute("text", { value: "Conquistado", align: "center", color: "#fff", width: 10 });
  mark.setAttribute("position", "0 7 0");
  planetEl.appendChild(mark);
  
  if (planetName && orbitMap[planetName]) {
    orbitMap[planetName].setAttribute("material", "color", "#00ff00");
    orbitMap[planetName].setAttribute("material", "opacity", 0.5);
  }
}

function updateOrbitColor(planetName, color, opacity) {
  if (planetName && orbitMap[planetName]) {
    orbitMap[planetName].setAttribute("material", "color", color);
    orbitMap[planetName].setAttribute("material", "opacity", opacity);
  }
}
