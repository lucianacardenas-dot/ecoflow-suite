// =============================================================================
// EcoFlow Suite - Consulta de Auditoría (GET /api/auditoria - Solo Administrador)
// =============================================================================
const express = require('express');
const router = express.Router();
const { autenticarToken, autorizarRoles } = require('../middlewares/auth');
const { listarAuditoria } = require('../services/auditService');

// Solo el rol 'administrador' tiene permiso (cumple Prueba de Seguridad Nº 2)
router.get('/', autenticarToken, autorizarRoles('administrador'), async (req, res, next) => {
  try {
    const bitacora = await listarAuditoria();
    res.status(200).json(bitacora);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
