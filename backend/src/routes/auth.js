// =============================================================================
// EcoFlow Suite - Rutas de Autenticación (POST /api/auth/login, GET /api/auth/perfil)
// =============================================================================
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool, getMemStore, isFallback, setFallback } = require('../config/db');
const { registrarAuditoria } = require('../services/auditService');
const { autenticarToken } = require('../middlewares/auth');

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // 1. Validación de entrada
  if (!email || !password) {
    return res.status(400).json({
      error: {
        codigo: 'DATOS_FALTANTES',
        mensaje: 'Debe ingresar obligatoriamente su correo electrónico y contraseña.',
        detalles: [
          { campo: 'email', mensaje: !email ? 'El email es obligatorio' : 'OK' },
          { campo: 'password', mensaje: !password ? 'La contraseña es obligatoria' : 'OK' }
        ],
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    let usuarioEncontrado = null;
    let rolNombre = 'guia';

    const pool = getPool();
    if (pool && !isFallback()) {
      try {
        const query = `
          SELECT u.id, u.nombres, u.apellidos, u.email, u.password_hash, u.activo, r.nombre AS rol
          FROM usuario u
          JOIN rol r ON u.rol_id = r.id
          WHERE LOWER(u.email) = LOWER($1)
        `;
        const result = await pool.query(query, [email.trim()]);
        if (result.rows.length > 0) {
          usuarioEncontrado = result.rows[0];
          rolNombre = usuarioEncontrado.rol;
        }
      } catch (dbErr) {
        console.warn('[AUTH] Error al consultar PostgreSQL, cambiando a fallback:', dbErr.message);
        setFallback(true);
      }
    }

    // Si PostgreSQL no está disponible o falló la consulta, usar memStore
    if (!usuarioEncontrado && isFallback()) {
      const memStore = getMemStore();
      usuarioEncontrado = memStore.usuarios.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (usuarioEncontrado) {
        rolNombre = usuarioEncontrado.rol;
      }
    }

    // 2. Verificación de credenciales (Regla de seguridad: mensaje no revela si falló email o password)
    const passwordValida = usuarioEncontrado
      ? bcrypt.compareSync(password, usuarioEncontrado.password_hash)
      : false;

    if (!usuarioEncontrado || !passwordValida || !usuarioEncontrado.activo) {
      // Registrar intento fallido en auditoría
      await registrarAuditoria({
        usuarioId: usuarioEncontrado ? usuarioEncontrado.id : null,
        accion: 'AUTH_LOGIN_FALLIDO',
        tablaAfectada: 'usuario',
        registroId: usuarioEncontrado ? usuarioEncontrado.id : null,
        ipOrigen: ip,
        resultado: 'FALLO',
        detalles: `Intento de acceso denegado para el correo: ${email}`
      });

      return res.status(401).json({
        error: {
          codigo: 'CREDENCIALES_INVALIDAS',
          mensaje: 'Correo electrónico o contraseña incorrectos.',
          detalles: [{ campo: 'credenciales', mensaje: 'Credenciales de acceso no válidas' }],
          timestamp: new Date().toISOString()
        }
      });
    }

    // 3. Generación de Token JWT
    const secret = process.env.JWT_SECRET || 'super-secreto-ecoflow-2026-jwt-key-segura';
    const expiresIn = process.env.JWT_EXPIRES_IN || '2h';

    const payload = {
      id: usuarioEncontrado.id,
      email: usuarioEncontrado.email,
      rol: rolNombre,
      nombres: usuarioEncontrado.nombres,
      apellidos: usuarioEncontrado.apellidos
    };

    const token = jwt.sign(payload, secret, { expiresIn });

    // 4. Registro exitoso en auditoría
    await registrarAuditoria({
      usuarioId: usuarioEncontrado.id,
      accion: 'AUTH_LOGIN',
      tablaAfectada: 'usuario',
      registroId: usuarioEncontrado.id,
      ipOrigen: ip,
      resultado: 'EXITO',
      detalles: `Inicio de sesión exitoso con rol: ${rolNombre}`
    });

    // 5. Respuesta (NUNCA incluir password_hash)
    res.status(200).json({
      token,
      usuario: {
        id: usuarioEncontrado.id,
        nombres: usuarioEncontrado.nombres,
        apellidos: usuarioEncontrado.apellidos,
        email: usuarioEncontrado.email,
        rol: rolNombre
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/perfil', autenticarToken, (req, res) => {
  res.status(200).json({
    usuario: req.usuario
  });
});

module.exports = router;
