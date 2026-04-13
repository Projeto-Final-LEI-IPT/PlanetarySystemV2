// ===========================================
// FUNÇÕES UTILITÁRIAS
// ===========================================

// ================================
// Função: Atualizar Display de Pontuação
// ================================
// Atualiza o display de pontuação na interface do utilizador
function updateScoreDisplay() {
  // Procura o elemento com ID "scoreDisplay" e atualiza o seu conteúdo
  document.getElementById("scoreDisplay").textContent = "Pontuação: " + score;
}

// ================================
// Função: Calcular Deslocamento
// ================================
// Calcula as novas coordenadas GPS dado um ponto de origem, distância e ângulo
// Esta função usa a fórmula de Haversine simplificada para movimentos em órbita
// Parâmetros:
//   - lat: Latitude de origem
//   - lon: Longitude de origem
//   - distance: Distância em metros
//   - angle: Ângulo em graus
// Retorna: Objeto com as coordenadas calculadas { lat, lon }
function computeOffset(lat, lon, distance, angle) {
  // Raio da Terra em metros
  const earthRadius = 6378137;
  
  // Calcula a mudança em latitude usando a distância e o ângulo
  const deltaLat = (distance * Math.cos(angle * Math.PI / 180)) / earthRadius * (180 / Math.PI);
  
  // Calcula a mudança em longitude usando a distância, o ângulo e a latitude atual
  const deltaLon = (distance * Math.sin(angle * Math.PI / 180)) / 
                   (earthRadius * Math.cos(lat * Math.PI / 180)) * (180 / Math.PI);
  
  // Retorna as novas coordenadas
  return { 
    lat: lat + deltaLat, 
    lon: lon + deltaLon 
  };
}

// ================================
// Função: Obter Distância em Metros
// ================================
// Calcula a distância em metros entre duas coordenadas GPS usando a fórmula de Haversine
// Parâmetros:
//   - lat1, lon1: Coordenadas do primeiro ponto
//   - lat2, lon2: Coordenadas do segundo ponto
// Retorna: Distância em metros
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  // Raio da Terra em metros
  const R = 6378137;
  
  // Converte as diferenças de latitude e longitude para radianos
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  // Aplica a fórmula de Haversine para calcular a distância
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  
  // Calcula o ângulo central em radianos
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Retorna a distância em metros
  return R * c;
}
