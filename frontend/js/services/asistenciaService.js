// =============================================================================
// EcoFlow Suite - Servicio de Check-in y Manifiesto de Pasajeros (RF-10, RF-11)
// =============================================================================
import { apiClient } from './apiClient.js';
import { authService } from './authService.js';

class AsistenciaService {
  async getPasajeros() {
    return await apiClient.get('/pasajeros');
  }

  async getAsistencias(salidaId) {
    return await apiClient.get('/asistencias', salidaId ? { salida_id: salidaId } : {});
  }

  // SIMULACIÓN: Registro de check-in en campo con validación de deslinde (RF-10, RF-11)
  async marcarAsistencia(salidaId, pasajeroId, estadoAsistencia = 'presente', isOffline = false) {
    if (!salidaId || !pasajeroId) {
      throw {
        error: {
          codigo: 'DATOS_CHECKIN_FALTANTES',
          mensaje: 'Se requiere salida y pasajero para registrar check-in.',
          detalles: [{ campo: 'checkin', mensaje: 'Faltan parámetros' }]
        }
      };
    }

    const pasajero = await apiClient.get(`/pasajeros/${pasajeroId}`);
    if (!pasajero) {
      throw {
        error: {
          codigo: 'PASAJERO_NO_ENCONTRADO',
          mensaje: 'El pasajero indicado no existe.'
        }
      };
    }

    // SIMULACIÓN: Regla RF-11 (Bloqueo restrictivo si falta ficha médica o deslinde)
    if (estadoAsistencia === 'presente' && pasajero.estado_ficha !== 'completada') {
      const motivo = pasajero.estado_ficha === 'bloqueada_riesgo' 
        ? 'El pasajero está BLOQUEADO POR RIESGO MÉDICO INCOMPATIBLE (RF-02).'
        : 'El pasajero tiene la FICHA MÉDICA PENDIENTE y no ha firmado el deslinde legal obligatorio (RF-11).';

      throw {
        error: {
          codigo: 'DESLINDE_LEGAL_PENDIENTE',
          mensaje: `ADVERTENCIA RESTRICTIVA: ${motivo} No puede abordar hasta regularizar su situación.`,
          detalles: [{ campo: 'deslinde_firmado', mensaje: 'Firma requerida previa al inicio de actividades' }]
        }
      };
    }

    // Comprobar si ya estaba marcado
    const asistenciasPrevias = await apiClient.get('/asistencias', { salida_id: salidaId, pasajero_id: pasajeroId });
    if (asistenciasPrevias.length > 0) {
      const actualizada = await apiClient.patch(`/asistencias/${asistenciasPrevias[0].id}`, {
        estado_asistencia: estadoAsistencia,
        hora_marcado: new Date().toISOString(),
        sincronizado: !isOffline
      });
      return actualizada;
    }

    const nuevaAsistenciaId = `ast-${Date.now().toString().slice(-4)}`;
    const nuevaAsistencia = {
      id: nuevaAsistenciaId,
      salida_id: salidaId,
      pasajero_id: pasajeroId,
      pasajero_nombre: pasajero.nombres,
      estado_asistencia: estadoAsistencia,
      hora_marcado: new Date().toISOString(),
      sincronizado: !isOffline
    };

    const asistenciaCreada = await apiClient.post('/asistencias', nuevaAsistencia);

    await authService.registrarAuditoria(
      'CHECKIN_PRESENCIAL',
      'asistencia',
      nuevaAsistenciaId,
      `Check-in para ${pasajero.nombres}: ${estadoAsistencia} (${isOffline ? 'Offline' : 'Online'})`
    );

    return asistenciaCreada;
  }
}

export const asistenciaService = new AsistenciaService();
