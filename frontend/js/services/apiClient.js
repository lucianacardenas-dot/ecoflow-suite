// =============================================================================
// EcoFlow Suite - Capa Central de Cliente API (Fetch Wrapper)
// =============================================================================
import { CONFIG } from '../config.js';

class ApiClient {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
  }

  getHeaders(customHeaders = {}) {
    const token = localStorage.getItem('ecoflow_token');
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers)
    };

    try {
      const response = await fetch(url, config);
      
      // Manejo de errores HTTP
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: {
              codigo: 'HTTP_ERROR',
              mensaje: `Error en la petición: ${response.status} ${response.statusText}`,
              status: response.status
            }
          };
        }
        throw errorData;
      }

      // Si no hay contenido (ej. 204)
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (err) {
      // Error de red / JSON Server apagado (Escenario 5)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        const networkError = {
          error: {
            codigo: 'ERROR_CONEXION_RED',
            mensaje: 'No se pudo conectar con el servidor API (JSON Server en puerto 3000). Verifique que el servicio esté ejecutándose con "npx json-server db.json".',
            detalles: [{ campo: 'red', mensaje: err.message }]
          }
        };
        console.error('Fallo de conexión:', networkError);
        throw networkError;
      }
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const path = query ? `${endpoint}?${query}` : endpoint;
    return this.request(path, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
