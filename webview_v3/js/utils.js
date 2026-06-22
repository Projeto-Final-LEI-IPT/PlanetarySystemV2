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
  const a = Math.sin(dLat / 2)**2  +
           Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2)**2;
  
  // Calcula o ângulo central em radianos
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Retorna a distância em metros
  return R * c;
}
// ================================
// Função: Carregar Dados do Sistema Planetário
// ================================
// Carrega os dados dos planetas, quer do backoffice (se fornecido ID nos parâmetros da URL)
// quer localmente de um ficheiro JSON (caso contrário)
async function loadSystemData(defaultJsonPath) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const systemId = urlParams.get('id') || urlParams.get('systemId');
    const type = urlParams.get('type'); // Ex: 'event' ou 'sistema'
    const customBackendUrl = urlParams.get('backendUrl');

    if (systemId) {
      // Determina o URL do backoffice.
      // Usamos o backendUrl passado por parâmetro ou o padrão localhost
      let baseUrl = customBackendUrl || 'http://localhost/PlanetarySystemTPSI/PlanetarySystemGo-2026/WebServices/';
      if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
      }

      let fetchUrl;
      if (type === 'event') {
        fetchUrl = `${baseUrl}AppServices/getEvent.php?id=${systemId}`;
      } else if (type === 'json') {
        fetchUrl = `${baseUrl}FrontEndServices/getSistemaJSON.php?id=${systemId}`;
      } else {
        // Por padrão usamos getSystem.php
        fetchUrl = `${baseUrl}FrontEndServices/getSystem.php?id=${systemId}`;
      }

      console.log("A carregar dados do sistema do Backoffice:", fetchUrl);
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados do backoffice (Status: ${response.status})`);
      }
      const resData = await response.json();

      // Se vier do getEvent ou getSistemaJSON, pode vir encapsulado no campo SistemaJSON
      if (resData.SistemaJSON) {
        const parsed = typeof resData.SistemaJSON === 'string' ? JSON.parse(resData.SistemaJSON) : resData.SistemaJSON;
        return parsed;
      }
      return resData;
    }
  } catch (err) {
    console.warn("Falha ao carregar do Backoffice, a reverter para dados locais:", err);
  }

  // Fallback: carregar ficheiro JSON local
  console.log("A carregar dados locais do ficheiro:", defaultJsonPath);
  const response = await fetch(defaultJsonPath);
  if (!response.ok) {
    throw new Error(`Erro ao carregar ficheiro local (Status: ${response.status})`);
  }
  return await response.json();
}
