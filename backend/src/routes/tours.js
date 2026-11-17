// =============================================================================
// EcoFlow Suite - Catálogo de Tours (GET /api/tours y GET /api/tours/:id)
// =============================================================================
const express = require('express');
const router = express.Router();
const { getPool, getMemStore, isFallback } = require('../config/db');

// Listar todos los tours activos
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    if (pool && !isFallback()) {
      const result = await pool.query('SELECT * FROM tour WHERE activo = TRUE ORDER BY id ASC');
      return res.status(200).json(result.rows);
    }

    const memStore = getMemStore();
    const toursActivos = memStore.tours.filter((t) => t.activo);
    res.status(200).json(toursActivos);
  } catch (err) {
    next(err);
  }
});

// Obtener detalle de un tour por ID
router.get('/:id', async (req, res, next) => {
  const tourId = parseInt(req.params.id, 10);
  try {
    const pool = getPool();
    if (pool && !isFallback()) {
      const result = await pool.query('SELECT * FROM tour WHERE id = $1', [tourId]);
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: {
            codigo: 'TOUR_NO_ENCONTRADO',
            mensaje: `El tour con ID ${tourId} no existe.`,
            detalles: [],
            timestamp: new Date().toISOString()
          }
        });
      }
      return res.status(200).json(result.rows[0]);
    }

    const memStore = getMemStore();
    const tour = memStore.tours.find((t) => t.id === tourId);
    if (!tour) {
      return res.status(404).json({
        error: {
          codigo: 'TOUR_NO_ENCONTRADO',
          mensaje: `El tour con ID ${tourId} no existe.`,
          detalles: [],
          timestamp: new Date().toISOString()
        }
      });
    }
    res.status(200).json(tour);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
