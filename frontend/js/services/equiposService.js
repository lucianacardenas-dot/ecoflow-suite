// =============================================================================
// EcoFlow Suite - Servicio de Equipamiento y Trazabilidad QR (RF-06, RF-07)
// =============================================================================
import { apiClient } from './apiClient.js';
import { authService } from './authService.js';

class EquiposService {
  async getEquipos() {
    return await apiClient.get('/equipos');
  }

  async getDespachos() {
    return await apiClient.get('/despachos_equipos');
  }

  // SIMULACIÓN: Despacho con validación de estado QR (RF-06, RF-07)
  async despacharEquipo(salidaId, codigoQr) {
    if (!salidaId || !codigoQr) {
      throw {
        error: {
          codigo: 'DATOS_QR_FALTANTES',
          mensaje: 'Debe ingresar o escanear un código QR válido y seleccionar una salida operativa.',
          detalles: [{ campo: 'codigo_qr', mensaje: 'Código QR requerido' }]
        }
      };
    }

    const equipos = await apiClient.get('/equipos', { codigo_qr: codigoQr });
    if (!equipos || equipos.length === 0) {
      throw {
        error: {
          codigo: 'EQUIPO_NO_ENCONTRADO',
          mensaje: `No existe ningún equipo registrado con el código QR "${codigoQr}".`,
          detalles: [{ campo: 'codigo_qr', mensaje: 'No registrado en almacén' }]
        }
      };
    }

    const equipo = equipos[0];

    // SIMULACIÓN: Regla RF-07 (Bloqueo de equipo no disponible o en mantenimiento)
    if (equipo.estado === 'en_mantenimiento') {
      throw {
        error: {
          codigo: 'EQUIPO_EN_MANTENIMIENTO',
          mensaje: `El equipo ${equipo.tipo_equipo} (${codigoQr}) se encuentra en estado "En Mantenimiento" y está bloqueado preventivamente para despacho (RF-07).`,
          detalles: [{ campo: 'estado', mensaje: 'Equipo inhabilitado por seguridad técnica' }]
        }
      };
    }

    if (equipo.estado === 'despachado') {
      throw {
        error: {
          codigo: 'EQUIPO_YA_DESPACHADO',
          mensaje: `El equipo ${codigoQr} ya figura como despachado en otra salida activa.`,
          detalles: [{ campo: 'estado', mensaje: 'Ya en campo' }]
        }
      };
    }

    // Registrar despacho
    const nuevoDespachoId = `des-${Date.now().toString().slice(-4)}`;
    const nuevoDespacho = {
      id: nuevoDespachoId,
      salida_id: salidaId,
      equipo_id: equipo.id,
      codigo_qr: codigoQr,
      fecha_despacho: new Date().toISOString(),
      estado_retorno: null
    };

    await apiClient.post('/despachos_equipos', nuevoDespacho);
    await apiClient.patch(`/equipos/${equipo.id}`, { estado: 'despachado' });

    await authService.registrarAuditoria(
      'EQUIPO_DESPACHADO',
      'despacho_equipo',
      nuevoDespachoId,
      `Despacho de ${equipo.tipo_equipo} (${codigoQr}) para salida ${salidaId}`
    );

    return nuevoDespacho;
  }

  // Registrar retorno físico e inspección técnica (RF-07)
  async registrarRetorno(despachoId, estadoRetorno, observaciones) {
    const despacho = await apiClient.get(`/despachos_equipos/${despachoId}`);
    if (!despacho) {
      throw {
        error: {
          codigo: 'DESPACHO_NO_ENCONTRADO',
          mensaje: 'El registro de despacho especificado no existe.'
        }
      };
    }

    const nuevoEstadoEquipo = estadoRetorno === 'con_danio' ? 'en_mantenimiento' : 'disponible';

    await apiClient.patch(`/despachos_equipos/${despachoId}`, {
      fecha_retorno: new Date().toISOString(),
      estado_retorno: estadoRetorno,
      observaciones: observaciones || 'Sin observaciones'
    });

    await apiClient.patch(`/equipos/${despacho.equipo_id}`, {
      estado: nuevoEstadoEquipo
    });

    await authService.registrarAuditoria(
      estadoRetorno === 'con_danio' ? 'EQUIPO_RETORNADO_DANIO' : 'EQUIPO_RETORNADO_OPTIMO',
      'equipo',
      despacho.equipo_id,
      `Retorno físico registrado. Estado de equipo: ${nuevoEstadoEquipo}. Obs: ${observaciones}`
    );

    return { exito: true, estadoEquipo: nuevoEstadoEquipo };
  }
}

export const equiposService = new EquiposService();
