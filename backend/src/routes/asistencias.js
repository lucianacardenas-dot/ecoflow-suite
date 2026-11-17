// =============================================================================
// EcoFlow Suite - Rutas de Asistencia y Check-in (/api/asistencias)
// =============================================================================
const express = require('express');
const router = express.Router();
const { getMemStore } = require('../config/db');

router.get('/', (req, res) => {
  const memStore = getMemStore();
  const asistencias = memStore.asistencias || [
    { id: 1, salida_id: 1, pasajero_id: 1, estado_asistencia: 'presente', hora_marcado: new Date().toISOString(), sincronizado: true }
  ];
  res.status(200).json(asistencias);
});

router.post('/', (req, res) => {
  const memStore = getMemStore();
  if (!memStore.asistencias) memStore.asistencias = [];
  const nueva = {
    id: memStore.asistencias.length + 1,
    salida_id: req.body.salida_id || 1,
    pasajero_id: req.body.pasajero_id,
    estado_asistencia: req.body.estado_asistencia || 'presente',
    hora_marcado: new Date().toISOString(),
    sincronizado: true
  };
  memStore.asistencias.push(nueva);
  res.status(201).json(nueva);
});

router.patch('/:id', (req, res) => {
  res.status(200).json({ ok: true, mensaje: 'Asistencia actualizada' });
});

module.exports = router;
