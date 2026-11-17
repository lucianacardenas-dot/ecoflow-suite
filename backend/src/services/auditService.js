// =============================================================================
// EcoFlow Suite - Servicio de Auditoría Inmutable (RC-02)
// =============================================================================
const { getPool, getMemStore, isFallback } = require('../config/db');

async function registrarAuditoria({ usuarioId, accion, tablaAfectada, registroId, ipOrigen, resultado, detalles }) {
  const ip = ipOrigen || '127.0.0.1';
  const fecha = new Date().toISOString();

  // Si PostgreSQL está activo
  const pool = getPool();
  if (pool && !isFallback()) {
    try {
      const query = `
        INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, ip_origen, resultado, detalles, creado_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const values = [usuarioId || null, accion, tablaAfectada, registroId || null, ip, resultado, detalles || null, fecha];
      const res = await pool.query(query, values);
      return res.rows[0].id;
    } catch (err) {
      console.warn('[AUDITORIA] Falló inserción en PostgreSQL, guardando en memoria:', err.message);
    }
  }

  // Fallback en memoria
  const memStore = getMemStore();
  const nuevoRegistro = {
    id: memStore.auditoria.length + 1,
    usuario_id: usuarioId || null,
    accion,
    tabla_afectada: tablaAfectada,
    registro_id: registroId || null,
    ip_origen: ip,
    resultado,
    detalles: typeof detalles === 'object' ? JSON.stringify(detalles) : detalles,
    creado_en: fecha
  };
  memStore.auditoria.push(nuevoRegistro);
  return nuevoRegistro.id;
}

async function listarAuditoria() {
  const pool = getPool();
  if (pool && !isFallback()) {
    try {
      const res = await pool.query('SELECT * FROM auditoria ORDER BY creado_en DESC LIMIT 100');
      return res.rows;
    } catch (err) {
      console.warn('[AUDITORIA] Error al consultar en PostgreSQL, usando memoria:', err.message);
    }
  }

  const memStore = getMemStore();
  return [...memStore.auditoria].reverse();
}

module.exports = {
  registrarAuditoria,
  listarAuditoria
};
