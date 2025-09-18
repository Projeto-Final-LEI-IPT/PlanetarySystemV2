// ===================
// Global Variables
// ===================
let score = 0;
let pontos = 4;

// ===================
// Main functions
// ===================

function createOrbitRing(userLat, userLon, orbitDistance) {
  const ring = document.createElement("a-ring");
  ring.setAttribute("gps-new-entity-place", {latitude: userLat, longitude: userLon});
  ring.setAttribute("radius-inner", orbitDistance - 1);
  ring.setAttribute("radius-outer", orbitDistance + 1);
  ring.setAttribute("rotation", "-90 0 0");
  ring.setAttribute("material", { color: "#ffffff", shader: "flat", opacity: 0.3, side: "double" });
  document.querySelector("a-scene").appendChild(ring);
}

function createPlanets(userLat, userLon, data) {
  const planetData = data.planets;
  const scene = document.querySelector("a-scene");

  planetData.forEach((planet) => {
    const coords = computeOffset(userLat, userLon, planet.distanciafoco1, 0);
    const entity = document.createElement("a-entity");
    entity.setAttribute("cursor", "rayOrigin:mouse");

    const sphere = document.createElement("a-sphere");
    sphere.setAttribute("name", planet.name);
    sphere.setAttribute("gps-new-entity-place", { latitude: coords.lat, longitude: coords.lon });
    sphere.setAttribute("radius", planet.size);
    sphere.setAttribute("shadow", "");
    const imgSrc = "data:image/jpg;base64," + planet.texture;
    sphere.setAttribute("material", { src: imgSrc, shader: "standard" });
    sphere.setAttribute("show-plane", { name: planet.name, desc: planet.description, image: planet.image });

    if (planet.speed > 0) {
      sphere.setAttribute("dynamic-movement", {
        type: "spin", speed: planet.speed,
        originLat: userLat, originLon: userLon, distance: planet.distanciafoco1
      });
      createOrbitRing(userLat, userLon, planet.distanciafoco1);
    }

    if (planet.questions && planet.questions.length > 0) {
      sphere.setAttribute("proximity-check", {
        range: 5, questions: JSON.stringify(planet.questions), triggered: false
      });
    }

    entity.appendChild(sphere);
    scene.appendChild(entity);
  });
}
