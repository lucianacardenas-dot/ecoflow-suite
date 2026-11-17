// =============================================================================
// EcoFlow Suite - Middlewares de Autenticación JWT y Autorización RBAC
// =============================================================================
const jwt = require('jsonwebtoken');

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        codigo: 'TOKEN_NO_PROPORCIONADO',
        mensaje: 'Se requiere un token de sesión para acceder a este recurso protegido.',
        detalles: [{ campo: 'authorization', mensaje: 'Cabecera Authorization: Bearer <token> ausente' }],
        timestamp: new Date().toISOString()
      }
    });
  }

  const secret = process.env.JWT_SECRET || 'super-secreto-ecoflow-2026-jwt-key-segura';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: {
          codigo: 'TOKEN_INVALIDO_O_EXPIRADO',
          mensaje: 'El token proporcionado no es válido o ha expirado. Inicie sesión nuevamente.',
          detalles: [{ campo: 'token', mensaje: err.message }],
          timestamp: new Date().toISOString()
        }
      });
    }

    req.usuario = decoded;
    next();
  });
}

function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: {
          codigo: 'ACCESO_DENEGADO_ROL_NO_AUTORIZADO',
          mensaje: `Su rol '${req.usuario ? req.usuario.rol : 'anónimo'}' no tiene privilegios para ejecutar esta acción.`,
          detalles: [{ campo: 'rol', mensaje: `Roles autorizados: ${rolesPermitidos.join(', ')}` }],
          timestamp: new Date().toISOString()
        }
      });
    }
    next();
  };
}

module.exports = {
  autenticarToken,
  autorizarRoles
};
