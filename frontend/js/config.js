// =============================================================================
// EcoFlow Suite - Archivo de Configuración Global de la API (Lab 14)
// =============================================================================

// En producción en AWS, la API se consume de forma relativa a través de Nginx (/api)
// En desarrollo local (Live Server), apunta a http://localhost:4000/api
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const CONFIG = {
  API_BASE_URL: isLocal ? 'http://localhost:4000/api' : '/api',
  MOCK_API_URL: 'http://localhost:3000',
  APP_NAME: 'EcoFlow Suite',
  VERSION: '1.0.0',
  ENV: isLocal ? 'development' : 'production'
};
