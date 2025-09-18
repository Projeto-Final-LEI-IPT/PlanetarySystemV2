function updateScoreDisplay() {
  document.getElementById("scoreDisplay").textContent = "Pontuação: " + score;
}

function computeOffset(lat, lon, distance, angle) {
  const earthRadius = 6378137;
  const deltaLat = (distance * Math.cos(angle * Math.PI / 180)) / earthRadius * (180 / Math.PI);
  const deltaLon = (distance * Math.sin(angle * Math.PI / 180)) / (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  return { lat: lat + deltaLat, lon: lon + deltaLon };
}

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6378137;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
