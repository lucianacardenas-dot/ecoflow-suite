// =============================================================================
// EcoFlow Suite - Servidor HTTP (server.js)
// =============================================================================
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌲 EcoFlow Suite Backend API iniciado exitosamente`);
  console.log(`🚀 Servidor escuchando en: http://localhost:${PORT}`);
  console.log(`🩺 Health check:           http://localhost:${PORT}/api/health`);
  console.log(`🔒 Origen CORS permitido:  ${process.env.CORS_ORIGIN || '*'}`);
  console.log(`====================================================`);
});
