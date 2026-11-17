// =============================================================================
// EcoFlow Suite - Servicio de Autenticación y Sesión (Conectado a Backend Real)
// =============================================================================
import { apiClient } from './apiClient.js';

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw {
        error: {
          codigo: 'DATOS_FALTANTES',
          mensaje: 'El correo electrónico y la contraseña son obligatorios.',
          detalles: [{ campo: 'email_o_password', mensaje: 'Campos requeridos' }]
        }
      };
    }

    if (password.length < 10) {
      throw {
        error: {
          codigo: 'PASSWORD_LONGITUD_INSUFICIENTE',
          mensaje: 'Por política de seguridad RC-01, la contraseña debe tener al menos 10 caracteres.',
          detalles: [{ campo: 'password', mensaje: 'Mínimo 10 caracteres' }]
        }
      };
    }

    // Petición al endpoint real de autenticación (POST /api/auth/login)
    const data = await apiClient.post('/auth/login', { email, password });
    
    if (data && data.token) {
      localStorage.setItem('ecoflow_token', data.token);
      localStorage.setItem('ecoflow_user', JSON.stringify(data.usuario));
    }

    return data;
  }

  getCurrentUser() {
    const raw = localStorage.getItem('ecoflow_user');
    return raw ? JSON.parse(raw) : null;
  }

  logout() {
    localStorage.removeItem('ecoflow_token');
    localStorage.removeItem('ecoflow_user');
  }

  isAuthenticated() {
    return !!localStorage.getItem('ecoflow_token');
  }

  async registrarAuditoria(accion, tabla, registroId, detalles) {
    // La auditoría ahora se registra automáticamente en el backend real (RC-02)
    console.log(`[AUDITORIA CLIENTE] Evento: ${accion} sobre ${tabla}:${registroId}`);
  }
}

export const authService = new AuthService();
