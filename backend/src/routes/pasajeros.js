// =============================================================================
// EcoFlow Suite - Rutas de Pasajeros (/api/pasajeros)
// =============================================================================
const express = require('express');
const router = express.Router();
const { getPool, getMemStore, isFallback, setFallback } = require('../config/db');

// Listar pasajeros
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    if (pool && !isFallback()) {
      try {
        const result = await pool.query('SELECT * FROM pasajero ORDER BY id ASC');
        return res.status(200).json(result.rows);
      } catch (dbErr) {
        console.warn('[PASAJEROS] Falló consulta a PostgreSQL, usando memoria:', dbErr.message);
        setFallback(true);
      }
    }

    const memStore = getMemStore();
    const pasajeros = memStore.pasajeros || [
      { id: 1, nombres: 'Mateo Gómez Rivas', dni_pasaporte: '70852963', token_ficha: 'tok-med-mateo-01', estado_ficha: 'completada' },
      { id: 2, nombres: 'Andrea Salas Rivas', dni_pasaporte: '71963852', token_ficha: 'tok-med-andrea-02', estado_ficha: 'pendiente' },
      { id: 3, nombres: 'Javier Fernández Gil', dni_pasaporte: 'P-ESP849201', token_ficha: 'tok-med-javier-03', estado_ficha: 'bloqueada_riesgo' }
    ];
    res.status(200).json(pasajeros);
  } catch (err) {
    next(err);
  }
});

// Obtener un pasajero por ID
router.get('/:id', async (req, res, next) => {
  const pId = parseInt(req.params.id, 10);
  try {
    const pool = getPool();
    if (pool && !isFallback()) {
      try {
        const result = await pool.query('SELECT * FROM pasajero WHERE id = $1', [pId]);
        if (result.rows.length > 0) return res.status(200).json(result.rows[0]);
      } catch (dbErr) {
        setFallback(true);
      }
    }

    const memStore = getMemStore();
    const list = memStore.pasajeros || [
      { id: 1, nombres: 'Mateo Gómez Rivas', dni_pasaporte: '70852963', token_ficha: 'tok-med-mateo-01', estado_ficha: 'completada' },
      { id: 2, nombres: 'Andrea Salas Rivas', dni_pasaporte: '71963852', token_ficha: 'tok-med-andrea-02', estado_ficha: 'pendiente' },
      { id: 3, nombres: 'Javier Fernández Gil', dni_pasaporte: 'P-ESP849201', token_ficha: 'tok-med-javier-03', estado_ficha: 'bloqueada_riesgo' }
    ];
    const p = list.find((item) => item.id === pId);
    if (!p) {
      return res.status(404).json({ error: { codigo: 'PASAJERO_NO_ENCONTRADO', mensaje: 'Pasajero no existe' } });
    }
    res.status(200).json(p);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
