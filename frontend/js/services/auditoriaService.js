// =============================================================================
// EcoFlow Suite - Servicio de Consulta de Auditoría (RC-02, Solo Administrador)
// =============================================================================
import { apiClient } from './apiClient.js';

class AuditoriaService {
  async getLogs() {
    return await apiClient.get('/auditoria');
  }
}

export const auditoriaService = new AuditoriaService();
