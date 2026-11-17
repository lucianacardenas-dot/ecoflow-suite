// =============================================================================
// EcoFlow Suite - Servicio de Tours y Reservas (RF-01, RF-02, RF-03)
// Conectado al Backend Real (Laboratorio 14)
// =============================================================================
import { apiClient } from './apiClient.js';
import { authService } from './authService.js';

class ToursService {
  async getTours() {
    return await apiClient.get('/tours');
  }

  async getTourById(id) {
    return await apiClient.get(`/tours/${id}`);
  }
}

class ReservasService {
  async getReservas() {
    return await apiClient.get('/reservas');
  }

  async getClientes() {
    return await apiClient.get('/clientes');
  }

  // Proceso Principal P2 conectado al Backend Real con Bloqueo ACID y Auditoría
  async crearReserva(datos) {
    const { clienteData, tourId, fechaTour, cantidadPasajeros, tipoServicio, condicionMedica } = datos;

    // Validación de campos obligatorios en frontend
    if (!clienteData?.nombres || !clienteData?.dni_pasaporte || !clienteData?.email || !tourId || !cantidadPasajeros) {
      throw {
        error: {
          codigo: 'DATOS_REQUERIDOS_FALTANTES',
          mensaje: 'Todos los campos obligatorios del titular y la reserva deben ser completados.',
          detalles: [{ campo: 'formulario', mensaje: 'Faltan datos obligatorios' }]
        }
      };
    }

    // Petición al endpoint real de reservas (POST /api/reservas)
    const payload = {
      cliente: {
        dni_pasaporte: clienteData.dni_pasaporte,
        nombres: clienteData.nombres,
        apellidos: clienteData.apellidos || '',
        email: clienteData.email,
        telefono: clienteData.telefono || ''
      },
      tour_id: Number(tourId),
      fecha_tour: fechaTour,
      cantidad_pasajeros: Number(cantidadPasajeros),
      tipo_servicio: tipoServicio || 'compartido'
    };

    const reservaCreada = await apiClient.post('/reservas', payload);

    return {
      reserva: reservaCreada,
      pasajero: (reservaCreada.pasajeros && reservaCreada.pasajeros[0]) || { nombres: clienteData.nombres },
      alertaRiesgo: false
    };
  }

  async getFichaByToken(token) {
    const paxs = await apiClient.get('/pasajeros', { token_ficha: token });
    if (!paxs || paxs.length === 0) {
      throw {
        error: {
          codigo: 'TOKEN_INVALIDO_O_EXPIRADO',
          mensaje: 'El enlace de la ficha médica es inválido o ya ha expirado.',
          detalles: [{ campo: 'token', mensaje: 'Token no encontrado' }]
        }
      };
    }
    const pax = paxs[0];
    const fichas = await apiClient.get('/fichas_medicas', { pasajero_id: pax.id });
    return {
      pasajero: pax,
      ficha: fichas.length > 0 ? fichas[0] : null
    };
  }

  async guardarFichaMedica(token, datosFicha) {
    const { pasajero } = await this.getFichaByToken(token);
    
    let esApto = true;
    if (datosFicha.antecedentes_salud && datosFicha.antecedentes_salud.toLowerCase().includes('cardio')) {
      esApto = false;
    }

    const estadoFicha = esApto ? 'completada' : 'bloqueada_riesgo';

    await apiClient.patch(`/pasajeros/${pasajero.id}`, { estado_ficha: estadoFicha });

    const fichas = await apiClient.get('/fichas_medicas', { pasajero_id: pasajero.id });
    if (fichas.length > 0) {
      await apiClient.patch(`/fichas_medicas/${fichas[0].id}`, {
        ...datosFicha,
        es_apto: esApto
      });
    } else {
      await apiClient.post('/fichas_medicas', {
        id: `fch-${Date.now().toString().slice(-4)}`,
        pasajero_id: pasajero.id,
        ...datosFicha,
        es_apto: esApto
      });
    }

    if (!esApto) {
      throw {
        error: {
          codigo: 'INCOMPATIBILIDAD_MEDICA_EXCLUYENTE',
          mensaje: 'La condición de salud declarada presenta alto riesgo para la exigencia física del tour. Se ha activado el bloqueo preventivo según regla RF-02.',
          detalles: [{ campo: 'antecedentes_salud', mensaje: 'Condición cardíaca incompatible' }]
        }
      };
    }

    return { exito: true, mensaje: 'Ficha médica y deslinde legal registrados satisfactoriamente.' };
  }
}

export const toursService = new ToursService();
export const reservasService = new ReservasService();
