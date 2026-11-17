// =============================================================================
// EcoFlow Suite - Endpoint de Salud y Verificación de Estado (GET /api/health)
// =============================================================================
const express = require('express');
const router = express.Router();
const { checkConnection } = require('../config/db');

router.get('/health', async (req, res) => {
  const dbStatus = await checkConnection();

  res.status(200).json({
    status: 'OK',
    servicio: 'EcoFlow Suite Backend API',
    version: '1.0.0',
    ambiente: process.env.NODE_ENV || 'development',
    database: {
      conectado: dbStatus.ok,
      motor: dbStatus.motor,
      timestamp: dbStatus.timestamp || new Date().toISOString()
    },
    uptime: process.uptime()
  });
});

module.exports = router;
