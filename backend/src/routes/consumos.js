// =============================================================================
// EcoFlow Suite - Rutas de Consumos y Liquidación (P8: RF-14, RF-15)
// =============================================================================
const express = require('express');
const router = express.Router();
const { getMemStore } = require('../config/db');
const { registrarAuditoria } = require('../services/auditService');

router.get('/consumos_adicionales', (req, res) => {
  const memStore = getMemStore();
  const consumos = memStore.consumos || [
    {
      id: 'cns-001',
      salida_id: 1,
      reserva_id: 1,
      descripcion: 'Hidratación isotónica extra',
      cantidad: 2,
      precio_unitario: 5.00,
      subtotal: 10.00,
      registrado_en: new Date().toISOString()
    }
  ];
  res.status(200).json(consumos);
});

router.post('/consumos_adicionales', async (req, res) => {
  const memStore = getMemStore();
  if (!memStore.consumos) memStore.consumos = [];

  const nuevo = {
    id: req.body.id || `cns-${Date.now().toString().slice(-4)}`,
    salida_id: req.body.salida_id || 1,
    reserva_id: req.body.reserva_id || 1,
    descripcion: req.body.descripcion,
    cantidad: Number(req.body.cantidad) || 1,
    precio_unitario: Number(req.body.precio_unitario) || 0,
    subtotal: (Number(req.body.cantidad) || 1) * (Number(req.body.precio_unitario) || 0),
    registrado_en: new Date().toISOString()
  };

  memStore.consumos.unshift(nuevo);

  // Actualizar saldo de la reserva si existe
  const reserva = memStore.reservas.find((r) => r.id === parseInt(nuevo.reserva_id, 10));
  if (reserva) {
    reserva.saldo_pendiente = Number((Number(reserva.saldo_pendiente) + nuevo.subtotal).toFixed(2));
  }

  await registrarAuditoria({
    usuarioId: req.usuario ? req.usuario.id : null,
    accion: 'CONSUMO_RUTA_REGISTRADO',
    tablaAfectada: 'consumo_adicional',
    registroId: 1,
    ipOrigen: req.ip,
    resultado: 'EXITO',
    detalles: `Consumo cargado a reserva ${nuevo.reserva_id}: ${nuevo.descripcion} ($${nuevo.subtotal})`
  });

  res.status(201).json(nuevo);
});

router.get('/pagos_liquidacion', (req, res) => {
  const memStore = getMemStore();
  res.status(200).json(memStore.pagos || []);
});

router.post('/pagos_liquidacion', (req, res) => {
  res.status(201).json({ id: 1, ok: true, mensaje: 'Pago liquidado en counter' });
});

module.exports = router;
