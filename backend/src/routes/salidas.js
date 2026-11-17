// =============================================================================
// EcoFlow Suite - Rutas Operativas Generales (Salidas, Guías, Equipos, Proveedores)
// =============================================================================
const express = require('express');
const router = express.Router();
const { getMemStore } = require('../config/db');

// Salidas
router.get('/salidas', (req, res) => {
  const memStore = getMemStore();
  const salidas = memStore.salidas || [
    {
      id: 1,
      tour_id: 1,
      tour_nombre: 'Rafting Cañón del Río Colca Clase IV',
      fecha: '2026-12-01',
      hora_salida: '07:30',
      hora_retorno: '15:30',
      estado: 'en_ruta',
      guia_nombre: 'Marcos Quispe Huamán'
    }
  ];
  res.status(200).json(salidas);
});

router.post('/salidas', (req, res) => {
  res.status(201).json({ id: 2, ok: true, mensaje: 'Salida programada' });
});

router.patch('/salidas/:id', (req, res) => {
  res.status(200).json({ ok: true, mensaje: 'Salida actualizada' });
});

// Guías
router.get('/guias', (req, res) => {
  res.status(200).json([
    { id: 1, nombres: 'Marcos Quispe Huamán', codigo_licencia: 'LIC-AGMT-2024-001', especialidad: 'rafting_aguas_bravas' },
    { id: 2, nombres: 'Diana Flores Cárdenas', codigo_licencia: 'LIC-AGMT-2024-002', especialidad: 'alta_montana' }
  ]);
});

router.get('/asignaciones_guias', (req, res) => {
  res.status(200).json([
    { id: 1, salida_id: 1, guia_id: 1, rol_en_tour: 'principal' }
  ]);
});

router.post('/asignaciones_guias', (req, res) => {
  res.status(201).json({ id: 2, ok: true });
});

// Equipos QR
router.get('/equipos', (req, res) => {
  res.status(200).json([
    { id: 1, codigo_qr: 'QR-ARNES-001', tipo_equipo: 'arnes_seguridad', marca_modelo: 'Petzl Canyon', estado: 'disponible' },
    { id: 2, codigo_qr: 'QR-CASCO-001', tipo_equipo: 'casco_escalada', marca_modelo: 'Black Diamond', estado: 'disponible' }
  ]);
});

router.get('/equipos/:qr', (req, res) => {
  res.status(200).json({ id: 1, codigo_qr: req.params.qr, tipo_equipo: 'arnes_seguridad', estado: 'disponible' });
});

// Proveedores
router.get('/proveedores', (req, res) => {
  res.status(200).json([
    { id: 1, razon_social: 'Transportes Andinos del Sur S.A.C.', tipo_servicio: 'transporte' },
    { id: 2, razon_social: 'Restaurante Turístico El Mirador', tipo_servicio: 'restaurante' }
  ]);
});

router.get('/ordenes_servicio', (req, res) => {
  res.status(200).json([]);
});

// Fichas médicas
router.get('/fichas_medicas', (req, res) => {
  res.status(200).json([]);
});

router.post('/fichas_medicas', (req, res) => {
  res.status(201).json({ id: 1, ok: true });
});

router.patch('/fichas_medicas/:id', (req, res) => {
  res.status(200).json({ ok: true });
});

module.exports = router;
