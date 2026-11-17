// =============================================================================
// EcoFlow Suite - Servicio de Incidentes y Protocolo SOS (RF-12, RF-13)
// =============================================================================
import { apiClient } from './apiClient.js';
import { authService } from './authService.js';

class IncidentesService {
  async getIncidentes() {
    return await apiClient.get('/incidentes');
  }

  // Reportar contingencia en ruta (RF-12)
  async reportarIncidente(salidaId, tipoIncidente, severidad, descripcion, rutaAlterna) {
    if (!salidaId || !tipoIncidente || !descripcion) {
      throw {
        error: {
          codigo: 'DATOS_INCIDENTE_FALTANTES',
          mensaje: 'Debe ingresar salida, tipo de contingencia y la descripción detallada.',
          detalles: [{ campo: 'formulario', mensaje: 'Campos obligatorios' }]
        }
      };
    }

    const nuevoIncidenteId = `inc-${Date.now().toString().slice(-4)}`;
    const nuevoIncidente = {
      id: nuevoIncidenteId,
      salida_id: salidaId,
      tipo_incidente: tipoIncidente,
      severidad: severidad || 'moderada',
      descripcion,
      ruta_alterna_propuesta: rutaAlterna || 'Continuar con precaución',
      estado_aprobacion: 'pendiente',
      reportado_en: new Date().toISOString()
    };

    const incidenteCreado = await apiClient.post('/incidentes', nuevoIncidente);

    await authService.registrarAuditoria(
      'INCIDENTE_REPORTADO',
      'incidente',
      nuevoIncidenteId,
      `Incidente ${tipoIncidente} (${severidad}) en salida ${salidaId}`
    );

    return incidenteCreado;
  }

  // SIMULACIÓN: Protocolo Autónomo de Emergencia Médica Crítica (SOS - RF-13)
  async activarEmergenciaMedicaSOS(salidaId, descripcionEmergencia) {
    if (!salidaId) {
      throw {
        error: {
          codigo: 'SALIDA_REQUERIDA',
          mensaje: 'Debe seleccionar la salida donde ocurre la emergencia médica.'
        }
      };
    }

    // Bypass de aprobaciones y cambio instantáneo de estado de salida
    await apiClient.patch(`/salidas/${salidaId}`, {
      estado: 'en_emergencia'
    });

    const nuevoIncidenteId = `inc-sos-${Date.now().toString().slice(-4)}`;
    const incidenteSOS = {
      id: nuevoIncidenteId,
      salida_id: salidaId,
      tipo_incidente: 'emergencia_medica',
      severidad: 'critica_sos',
      descripcion: `[PROTOCOLO DE EMERGENCIA ACTIVADO POR GUÍA]: ${descripcionEmergencia || 'Evacuación médica inmediata en curso.'}`,
      ruta_alterna_propuesta: 'EVACUACIÓN INMEDIATA A CENTRO MÉDICO MÁS CERCANO',
      estado_aprobacion: 'ejecutada_sos',
      reportado_en: new Date().toISOString()
    };

    await apiClient.post('/incidentes', incidenteSOS);

    await authService.registrarAuditoria(
      'EMERGENCIA_MEDICA_DIRECTA',
      'salida',
      salidaId,
      `ACTIVACIÓN AUTÓNOMA SOS: Salida puesta en estado EN_EMERGENCIA.`
    );

    return {
      alertaActivada: true,
      mensaje: '¡PROTOCOLO DE EMERGENCIA MÉDICA CRÍTICA ACTIVADO! Notificación enviada a rescate y coordinación.'
    };
  }

  async aprobarContingencia(incidenteId) {
    const actualizada = await apiClient.patch(`/incidentes/${incidenteId}`, {
      estado_aprobacion: 'aprobada',
      aprobado_en: new Date().toISOString()
    });

    await authService.registrarAuditoria(
      'REPROGRAMACION_APROBADA',
      'incidente',
      incidenteId,
      'Coordinación aprobó la propuesta de ruta alterna.'
    );

    return actualizada;
  }
}

export const incidentesService = new IncidentesService();
