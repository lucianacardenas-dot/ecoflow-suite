// =============================================================================
// EcoFlow Suite - Manejador Central de Errores (Formato único del Contrato)
// =============================================================================

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const codigo = err.codigo || (status === 500 ? 'ERROR_INTERNO_SERVIDOR' : 'ERROR_SOLICITUD');
  const mensaje = err.mensaje || err.message || 'Ocurrió un error inesperado al procesar la solicitud.';
  const detalles = err.detalles || [];

  const respuesta = {
    error: {
      codigo,
      mensaje,
      detalles,
      timestamp: new Date().toISOString()
    }
  };

  if (status === 500) {
    console.error('[SERVER ERROR 500]:', err);
  }

  res.status(status).json(respuesta);
}

module.exports = errorHandler;
