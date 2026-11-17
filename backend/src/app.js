// =============================================================================
// EcoFlow Suite - Aplicación Principal Express (app.js)
// =============================================================================
const express = require('express');
const cors = require('cors');
const { initDb } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Rutas
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const toursRoutes = require('./routes/tours');
const reservasRoutes = require('./routes/reservas');
const auditoriaRoutes = require('./routes/auditoria');

const app = express();

// 1. Inicialización de base de datos
initDb();

// 2. Middlewares globales
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin,
  credentials: true
}));

app.use(express.json());

// 3. Montaje de rutas según API_CONTRATO.md
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tours', toursRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// 4. Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: {
      codigo: 'RECURSO_NO_ENCONTRADO',
      mensaje: `La ruta '${req.method} ${req.originalUrl}' no existe en la API de EcoFlow Suite.`,
      detalles: [],
      timestamp: new Date().toISOString()
    }
  });
});

// 5. Manejador Central de Errores
app.use(errorHandler);

module.exports = app;
