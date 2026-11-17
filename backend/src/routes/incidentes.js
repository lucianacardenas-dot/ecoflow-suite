// =============================================================================
// EcoFlow Suite - Rutas de Incidentes y Protocolo SOS (P7: RF-12, RF-13)
// =============================================================================
const express = require('express');
const router = express.Router();
const { getMemStore } = require('../config/db');
const { registrarAuditoria } = require('../services/auditService');

router.get('/', (req, res) => {
  const memStore = getMemStore();
  const incidentes = memStore.incidentes || [
    {
      id: 'inc-001',
      salida_id: 1,
      tipo_incidente: 'bloqueo_ruta',
      severidad: 'moderada',
      descripcion: 'Derrumbe leve en el km 42 del sendero. Ruta alterna tomada.',
      ruta_alterna_propuesta: 'Sendero bajo del río',
      estado_aprobacion: 'aprobada',
      reportado_en: new Date().toISOString()
    }
  ];
  res.status(200).json(incidentes);
});

router.post('/', async (req, res) => {
  const memStore = getMemStore();
  if (!memStore.incidentes) memStore.incidentes = [];

  const nuevo = {
    id: req.body.id || `inc-${Date.now().toString().slice(-4)}`,
    salida_id: req.body.salida_id || 1,
    tipo_incidente: req.body.tipo_incidente || 'contingencia',
    severidad: req.body.severidad || 'moderada',
    descripcion: req.body.descripcion,
    ruta_alterna_propuesta: req.body.ruta_alterna_propuesta || 'N/A',
    estado_aprobacion: req.body.estado_aprobacion || 'pendiente',
    reportado_en: new Date().toISOString()
  };

  memStore.incidentes.unshift(nuevo);

  await registrarAuditoria({
    usuarioId: req.usuario ? req.usuario.id : null,
    accion: nuevo.severidad === 'critica_sos' ? 'EMERGENCIA_SOS' : 'INCIDENTE_REPORTADO',
    tablaAfectada: 'incidente',
    registroId: 1,
    ipOrigen: req.ip,
    resultado: 'EXITO',
    detalles: `Incidente registrado: ${nuevo.tipo_incidente} (${nuevo.severidad})`
  });

  res.status(201).json(nuevo);
});

router.patch('/:id', (req, res) => {
  res.status(200).json({ ok: true, mensaje: 'Incidente actualizado' });
});

module.exports = router;
