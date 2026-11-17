// =============================================================================
// EcoFlow Suite - Servicio de Consumos, Liquidación en Counter y Cierre (RF-14, RF-15)
// =============================================================================
import { apiClient } from './apiClient.js';
import { authService } from './authService.js';

class ConsumosService {
  async getConsumos(reservaId) {
    return await apiClient.get('/consumos_adicionales', reservaId ? { reserva_id: reservaId } : {});
  }

  async getPagos(reservaId) {
    return await apiClient.get('/pagos_liquidacion', reservaId ? { reserva_id: reservaId } : {});
  }

  // Registrar consumo adicional en ruta cargado a la reserva (RF-14)
  // Regla de Negocio RN-8.1: Prohibido cobro de dinero en efectivo en campo por guías
  async registrarConsumoRuta(salidaId, reservaId, descripcion, cantidad, precioUnitario) {
    if (!salidaId || !reservaId || !descripcion || !cantidad || !precioUnitario) {
      throw {
        error: {
          codigo: 'DATOS_CONSUMO_FALTANTES',
          mensaje: 'Debe ingresar la salida, reserva, descripción, cantidad y precio unitario.',
          detalles: [{ campo: 'consumo', mensaje: 'Campos requeridos' }]
        }
      };
    }

    const cant = Number(cantidad);
    const precio = Number(precioUnitario);
    const subtotal = cant * precio;

    const nuevoConsumoId = `cns-${Date.now().toString().slice(-4)}`;
    const nuevoConsumo = {
      id: nuevoConsumoId,
      salida_id: salidaId,
      reserva_id: reservaId,
      descripcion,
      cantidad: cant,
      precio_unitario: precio,
      subtotal,
      registrado_en: new Date().toISOString()
    };

    const consumoCreado = await apiClient.post('/consumos_adicionales', nuevoConsumo);

    // Actualizar el saldo pendiente de la reserva
    const reserva = await apiClient.get(`/reservas/${reservaId}`);
    if (reserva) {
      const nuevoSaldo = Number(reserva.saldo_pendiente) + subtotal;
      const nuevoMontoTotal = Number(reserva.monto_total) + subtotal;
      await apiClient.patch(`/reservas/${reservaId}`, {
        saldo_pendiente: nuevoSaldo,
        monto_total: nuevoMontoTotal
      });
    }

    await authService.registrarAuditoria(
      'CONSUMO_RUTA_REGISTRADO',
      'consumo_adicional',
      nuevoConsumoId,
      `Consumo en ruta: ${descripcion} x${cant} ($${subtotal}). Cargado a reserva ${reservaId}`
    );

    return consumoCreado;
  }

  // Liquidación formal y cobro en counter (RF-15)
  async registrarCobroLiquidacion(reservaId, monto, metodoPago, referencia) {
    if (!reservaId || !monto || !metodoPago) {
      throw {
        error: {
          codigo: 'DATOS_PAGO_FALTANTES',
          mensaje: 'Se requiere reserva, monto a cobrar y método de pago formal.',
          detalles: [{ campo: 'pago', mensaje: 'Campos requeridos' }]
        }
      };
    }

    const reserva = await apiClient.get(`/reservas/${reservaId}`);
    if (!reserva) {
      throw {
        error: {
          codigo: 'RESERVA_NO_ENCONTRADA',
          mensaje: 'La reserva a liquidar no existe.'
        }
      };
    }

    const nuevoPagoId = `pag-${Date.now().toString().slice(-4)}`;
    const nuevoPago = {
      id: nuevoPagoId,
      reserva_id: reservaId,
      monto: Number(monto),
      metodo_pago: metodoPago,
      fecha_pago: new Date().toISOString(),
      referencia_transaccion: referencia || 'PAGO-COUNTER-DIR'
    };

    await apiClient.post('/pagos_liquidacion', nuevoPago);

    const saldoActualizado = Math.max(0, Number(reserva.saldo_pendiente) - Number(monto));
    const nuevoEstado = saldoActualizado === 0 ? 'liquidada' : reserva.estado;

    await apiClient.patch(`/reservas/${reservaId}`, {
      saldo_pendiente: saldoActualizado,
      estado: nuevoEstado
    });

    await authService.registrarAuditoria(
      'COBRO_LIQUIDADO',
      'pago_liquidacion',
      nuevoPagoId,
      `Cobro en caja: $${monto} vía ${metodoPago}. Saldo restante: $${saldoActualizado}`
    );

    return {
      pago: nuevoPago,
      saldoRestante: saldoActualizado,
      liquidada: saldoActualizado === 0
    };
  }

  // SIMULACIÓN: Cierre de tour con validación de retorno de equipos (RF-15)
  async cerrarSalidaOperativa(salidaId) {
    // Verificar si hay equipos despachados sin retorno
    const despachos = await apiClient.get('/despachos_equipos', { salida_id: salidaId });
    const equiposPendientes = despachos.filter(d => !d.fecha_retorno);

    if (equiposPendientes.length > 0) {
      throw {
        error: {
          codigo: 'EQUIPOS_PENDIENTES_RETORNO',
          mensaje: `No se puede cerrar la salida operativa (RN-8.2). Existen ${equiposPendientes.length} equipo(s) pendiente(s) de escaneo de retorno físico en bodega.`,
          detalles: equiposPendientes.map(e => ({ campo: 'codigo_qr', mensaje: `Pendiente: ${e.codigo_qr}` }))
        }
      };
    }

    await apiClient.patch(`/salidas/${salidaId}`, { estado: 'cerrada' });

    // Despacho asíncrono simulado de encuesta de satisfacción
    const encuestaId = `enc-${Date.now().toString().slice(-4)}`;
    await apiClient.post('/encuestas_satisfaccion', {
      id: encuestaId,
      salida_id: salidaId,
      enviado_en: new Date().toISOString(),
      respondido_en: null
    });

    await authService.registrarAuditoria(
      'SALIDA_CERRADA_LIQUIDADA',
      'salida',
      salidaId,
      `Salida cerrada operativamente con 100% de equipos retornados. Invitaciones a encuesta despachadas.`
    );

    return {
      exito: true,
      mensaje: '¡Salida declarada como Cerrada y Liquidada! Enlace de encuesta despachado a los pasajeros.'
    };
  }
}

export const consumosService = new ConsumosService();
