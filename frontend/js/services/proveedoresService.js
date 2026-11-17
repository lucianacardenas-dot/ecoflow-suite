// =============================================================================
// EcoFlow Suite - Servicio de Proveedores y Órdenes de Servicio (RF-08, RF-09)
// =============================================================================
import { apiClient } from './apiClient.js';
import { authService } from './authService.js';

class ProveedoresService {
  async getProveedores() {
    return await apiClient.get('/proveedores');
  }

  async getOrdenes() {
    return await apiClient.get('/ordenes_servicio');
  }

  // Emitir orden de servicio estructurada (RF-08)
  async emitirOrden(datos) {
    const { salidaId, proveedorId, totalPax, resumenDietas } = datos;

    if (!salidaId || !proveedorId || !totalPax) {
      throw {
        error: {
          codigo: 'DATOS_ORDEN_FALTANTES',
          mensaje: 'Debe seleccionar una salida, un proveedor y definir el número total de comensales/asientos.',
          detalles: [{ campo: 'formulario', mensaje: 'Campos requeridos' }]
        }
      };
    }

    const proveedor = await apiClient.get(`/proveedores/${proveedorId}`);
    const nuevaOrdenId = `ord-${Date.now().toString().slice(-4)}`;
    const tokenConfirmacion = `tok-prov-${Date.now().toString().slice(-4)}`;

    const nuevaOrden = {
      id: nuevaOrdenId,
      numero_orden: `ORD-2026-${Date.now().toString().slice(-3)}`,
      salida_id: salidaId,
      proveedor_id: proveedorId,
      proveedor_nombre: proveedor ? proveedor.razon_social : 'Proveedor Aliado',
      total_comensales_pax: Number(totalPax),
      resumen_dietas: resumenDietas || 'Menú estándar de montaña',
      token_confirmacion: tokenConfirmacion,
      estado: 'emitida'
    };

    const ordenCreada = await apiClient.post('/ordenes_servicio', nuevaOrden);

    await authService.registrarAuditoria(
      'ORDEN_SERVICIO_EMITIDA',
      'orden_servicio',
      nuevaOrdenId,
      `Orden emitida a ${proveedor.razon_social} para ${totalPax} pax. Token: ${tokenConfirmacion}`
    );

    return ordenCreada;
  }

  // SIMULACIÓN: Confirmación en un clic (RF-09)
  async confirmarOrdenOneClick(ordenId) {
    const orden = await apiClient.patch(`/ordenes_servicio/${ordenId}`, {
      estado: 'confirmada',
      confirmado_en: new Date().toISOString(),
      ip_confirmacion: '190.237.14.88'
    });

    await authService.registrarAuditoria(
      'ORDEN_PROVEEDOR_CONFIRMADA',
      'orden_servicio',
      ordenId,
      `Confirmación One-Click registrada por el proveedor externo.`
    );

    return orden;
  }
}

export const proveedoresService = new ProveedoresService();
