// =============================================================================
// EcoFlow Suite - Servicio de Salidas Operativas y Guías (RF-04, RF-05)
// =============================================================================
import { apiClient } from './apiClient.js';
import { authService } from './authService.js';

class GuiasService {
  async getGuias() {
    return await apiClient.get('/guias');
  }
}

class SalidasService {
  async getSalidas() {
    return await apiClient.get('/salidas');
  }

  async getAsignaciones() {
    return await apiClient.get('/asignaciones_guias');
  }

  // SIMULACIÓN: reemplazar en el Laboratorio 5 por validación en servidor
  async crearSalida(datos) {
    const { tourId, fecha, horaSalida, horaRetorno, guiaId } = datos;

    if (!tourId || !fecha || !horaSalida || !horaRetorno || !guiaId) {
      throw {
        error: {
          codigo: 'DATOS_SALIDA_FALTANTES',
          mensaje: 'Todos los campos de la salida operativa y la asignación del guía son obligatorios.',
          detalles: [{ campo: 'formulario', mensaje: 'Campos requeridos' }]
        }
      };
    }

    if (horaSalida >= horaRetorno) {
      throw {
        error: {
          codigo: 'HORARIO_INVALIDO',
          mensaje: 'La hora planificada de retorno debe ser posterior a la hora de salida.',
          detalles: [{ campo: 'hora_retorno', mensaje: 'Retorno debe ser posterior a salida' }]
        }
      };
    }

    // SIMULACIÓN: Regla de Negocio RF-04 (Colisión de Horarios y Descanso de Guías - 409)
    const salidasExistentes = await apiClient.get('/salidas', { fecha });
    const asignaciones = await apiClient.get('/asignaciones_guias', { guia_id: guiaId });
    
    // Verificar si el guía ya está asignado en esta fecha y se solapa
    const salidaSolapada = salidasExistentes.find(s => {
      const estaAsignado = asignaciones.some(a => a.salida_id === s.id);
      if (!estaAsignado) return false;
      // Colisión o conflicto de descanso (< 60 min)
      return (horaSalida <= s.hora_retorno && horaRetorno >= s.hora_salida);
    });

    if (salidaSolapada) {
      throw {
        error: {
          codigo: 'GUIA_COLISION_HORARIO',
          mensaje: `Conflicto de horario: El guía seleccionado ya se encuentra asignado a la salida "${salidaSolapada.tour_nombre}" en el horario de ${salidaSolapada.hora_salida} a ${salidaSolapada.hora_retorno}. No se cumple el descanso reglamentario de 60 minutos (RF-04).`,
          detalles: [{ campo: 'guia_id', mensaje: 'Guía no disponible en este rango horario' }]
        }
      };
    }

    const tour = await apiClient.get(`/tours/${tourId}`);
    const nuevaSalidaId = `sal-${Date.now().toString().slice(-4)}`;

    const nuevaSalida = {
      id: nuevaSalidaId,
      tour_id: tourId,
      tour_nombre: tour ? tour.nombre : 'Tour Ecoturismo',
      fecha,
      hora_salida: horaSalida,
      hora_retorno: horaRetorno,
      estado: 'programada'
    };

    const salidaCreada = await apiClient.post('/salidas', nuevaSalida);

    // Asignar el guía
    await apiClient.post('/asignaciones_guias', {
      id: `asg-${Date.now().toString().slice(-4)}`,
      salida_id: nuevaSalidaId,
      guia_id: guiaId,
      rol_en_tour: 'principal'
    });

    await authService.registrarAuditoria(
      'SALIDA_PROGRAMADA',
      'salida',
      nuevaSalidaId,
      `Salida programada para ${fecha} (${horaSalida} - ${horaRetorno}) con Guía ${guiaId}`
    );

    return salidaCreada;
  }
}

export const guiasService = new GuiasService();
export const salidasService = new SalidasService();
