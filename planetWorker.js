self.onmessage = async function(e) {
  const userLat = e.data.lat;
  const userLon = e.data.lon;

  const res = await fetch('system2.json');
  const data = await res.json();
  const planets = data.planets.map(p => {
    const angle = 0;
    const earthRadius = 6378137;
    const deltaLat = (p.distanciafoco1 * Math.cos(angle * Math.PI / 180)) / earthRadius * (180 / Math.PI);
    const deltaLon = (p.distanciafoco1 * Math.sin(angle * Math.PI / 180)) / (earthRadius * Math.cos(userLat * Math.PI / 180)) * (180 / Math.PI);
    const lat = userLat + deltaLat;
    const lon = userLon + deltaLon;

    return {
      name: p.name,
      size: p.size,
      texture: p.texture,
      desc: p.description,
      lat, lon,
      speed: p.speed,
      distance: p.distanciafoco1,
      questions: p.questions || []
    };
  });

  self.postMessage({ lat: userLat, lon: userLon, planets });
};
