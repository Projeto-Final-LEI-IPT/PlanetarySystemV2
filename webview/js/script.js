// ===========================================
// VARIÁVEIS GLOBAIS
// ===========================================
// Pontuação total do utilizador no jogo
let score = 0;

// Pontos atribuídos por resposta correta (pode variar conforme o número de tentativas)
let pontos = 4;

// ===========================================
// FUNÇÕES PRINCIPAIS
// ===========================================

// ================================
// Função: Criar Anel de Órbita
// ================================
// Cria um anel visual que representa a órbita de um planeta
// Parâmetros:
//   - userLat: Latitude do utilizador
//   - userLon: Longitude do utilizador
//   - orbitDistance: Distância da órbita em metros
function createOrbitRing(userLat, userLon, orbitDistance) {
  // Cria um elemento 'a-ring' (anel) do A-Frame
  const ring = document.createElement("a-ring");
  
  // Define a posição do anel usando as coordenadas GPS do utilizador
  ring.setAttribute("gps-new-entity-place", {latitude: userLat, longitude: userLon});
  
  // Define o raio interior e exterior do anel
  ring.setAttribute("radius-inner", orbitDistance - 1);
  ring.setAttribute("radius-outer", orbitDistance + 1);
  
  // Rotaciona o anel 90 graus para ser visualizado corretamente
  ring.setAttribute("rotation", "-90 0 0");
  
  // Define a aparência do anel (cor branca, semi-transparente)
  ring.setAttribute("material", { 
    color: "#ffffff", 
    shader: "flat", 
    opacity: 0.3, 
    side: "double" 
  });
  
  // Adiciona o anel à cena
  document.querySelector("a-scene").appendChild(ring);
}

// ================================
// Função: Criar Planetas
// ================================
// Cria os planetas na cena com base nos dados fornecidos
// Parâmetros:
//   - userLat: Latitude do utilizador
//   - userLon: Longitude do utilizador
//   - data: Objeto com informações dos planetas
function createPlanets(userLat, userLon, data) {
  // Extrai o array de planetas dos dados
  const planetData = data.planets;
  
  // Obtém a cena A-Frame
  const scene = document.querySelector("a-scene");

  // Itera sobre cada planeta para o criar e adicionar à cena
  planetData.forEach((planet) => {
    // Calcula as coordenadas do planeta usando o ponto de origem
    const coords = computeOffset(userLat, userLon, planet.distanciafoco1, 0);
    
    // Cria um elemento entidade A-Frame para conter o planeta
    const entity = document.createElement("a-entity");
    entity.setAttribute("cursor", "rayOrigin:mouse");

    // Cria a esfera que representa o planeta
    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("name", planet.name);
    sphere.setAttribute("gps-new-entity-place", { 
      latitude: coords.lat, 
      longitude: coords.lon 
    });
    sphere.setAttribute("radius", planet.size);
    sphere.setAttribute("shadow", "");
    
    // Adiciona a textura da imagem do planeta em base64
    const imgSrc = "data:image/jpg;base64," + planet.texture;
    sphere.setAttribute("material", { 
      src: imgSrc, 
      shader: "standard" 
    });
    
    // Adiciona componentes customizados para mostrar informações ao clicar
    sphere.setAttribute("show-plane", { 
      name: planet.name, 
      desc: planet.description, 
      image: planet.image 
    });

    // Se o planeta tem velocidade, adiciona movimento orbital
    if (planet.speed > 0) {
      // Adiciona o componente de movimento dinâmico
      sphere.setAttribute("dynamic-movement", {
        type: "spin", 
        speed: planet.speed,
        originLat: userLat, 
        originLon: userLon, 
        distance: planet.distanciafoco1
      });
      
      // Cria o anel visual da órbita
      createOrbitRing(userLat, userLon, planet.distanciafoco1);
    }

    // Se o planeta tem perguntas associadas, adiciona o componente de proximidade
    if (planet.questions && planet.questions.length > 0) {
      sphere.setAttribute("proximity-check", {
        range: 5, 
        questions: JSON.stringify(planet.questions), 
        triggered: false
      });
    }

    // Adiciona a esfera à entidade e a entidade à cena
    entity.appendChild(sphere);
    scene.appendChild(entity);
  });
}

// ================================
// Função: Mostrar Marca de Conclusão
// ================================
// Mostra uma marca visual (plano verde) indicando que o utilizador respondeu corretamente
// Parâmetros:
//   - planetEl: Elemento do planeta ao qual adicionar a marca
function showCompletionMark(planetEl){
  // Cria um plano que servirá como marca visível
  const mark = document.createElement("a-plane");

  // Define as dimensões do plano
  mark.setAttribute("geometry", {width: 5, height: 3 });
  
  // Define a aparência (cor verde, semi-transparente)
  mark.setAttribute("material", {color: "green", opacity: 0.9, side: "double" });
  
  // Adiciona texto ao plano indicando "Conquistado"
  mark.setAttribute("text", {
    value: "Conquistado", 
    align: "center", 
    color: "#fff", 
    width: 10 
  });
  
  // Define a posição da marca acima do planeta
  mark.setAttribute("position", "0 7 0");
  
  // Adiciona a marca ao elemento do planeta
  planetEl.appendChild(mark);
}
