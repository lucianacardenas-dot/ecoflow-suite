// =============================================================================
// EcoFlow Suite - Pruebas Automatizadas de Integración (Jest + Supertest)
// =============================================================================
const request = require('supertest');
const app = require('../src/app');

describe('EcoFlow Suite API - Pruebas del Backend (Lab 14)', () => {
  let tokenAdmin = '';
  let tokenCoordinador = '';
  let tokenGuia = '';

  // 1. Health check
  test('Iteración 0: GET /api/health debe responder 200 y estado de BD', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.conectado).toBe(true);
  });

  // 2. Autenticación y Tokens
  test('Iteración 1: Login de usuarios con roles y generación de JWT', async () => {
    // Coordinador
    const resCoord = await request(app)
      .post('/api/auth/login')
      .send({ email: 'coordinador@ecoflow.pe', password: 'EcoFlow2026!#' });
    expect(resCoord.status).toBe(200);
    expect(resCoord.body.token).toBeDefined();
    expect(resCoord.body.usuario.rol).toBe('coordinador');
    expect(resCoord.body.usuario.password_hash).toBeUndefined(); // Seguridad: nunca exponer hash
    tokenCoordinador = resCoord.body.token;

    // Admin
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ecoflow.pe', password: 'EcoFlow2026!#' });
    expect(resAdmin.status).toBe(200);
    tokenAdmin = resAdmin.body.token;

    // Guía
    const resGuia = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guia.marcos@ecoflow.pe', password: 'EcoFlow2026!#' });
    expect(resGuia.status).toBe(200);
    tokenGuia = resGuia.body.token;
  });

  test('Iteración 1: Login rechaza credenciales inválidas (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ecoflow.pe', password: 'ClaveIncorrecta123!' });
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  // 3. Proceso Principal: Reservas (Iteración 2)
  test('CP-01 (RF-03): Registrar una reserva válida (201 Created)', async () => {
    const payload = {
      cliente: {
        dni_pasaporte: '70852963',
        nombres: 'Mateo',
        apellidos: 'Gómez Rivas',
        email: 'mateo.gomez@gmail.com',
        telefono: '+51955223344'
      },
      tour_id: 1,
      fecha_tour: '2026-12-20',
      cantidad_pasajeros: 2,
      tipo_servicio: 'compartido'
    };

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCoordinador}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.codigo_reserva).toBeDefined();
    expect(res.body.monto_total).toBeGreaterThan(0);
    expect(res.body.pasajeros.length).toBe(2);
  });

  test('CP-02 (RF-03): Rechazar reserva por aforo excedido (409 Conflict)', async () => {
    const payload = {
      cliente: {
        dni_pasaporte: '99887766',
        nombres: 'Grupo',
        apellidos: 'Masivo',
        email: 'grupo@gmail.com',
        telefono: '+51955000000'
      },
      tour_id: 1,
      fecha_tour: '2026-12-20',
      cantidad_pasajeros: 100, // Supera capacidad máxima de 16
      tipo_servicio: 'compartido'
    };

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCoordinador}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('RESERVA_CAPACIDAD_EXCEDIDA');
  });

  test('CP-03 (RF-03): Rechazar reserva con datos incompletos (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${tokenCoordinador}`)
      .send({ tour_id: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_RESERVA_INVALIDOS');
  });

  // 4. Pruebas de Seguridad
  test('Seguridad 1: Petición sin token responde 401 Unauthorized', async () => {
    const res = await request(app).get('/api/reservas');
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_NO_PROPORCIONADO');
  });

  test('Seguridad 2: Rol no autorizado responde 403 Forbidden', async () => {
    // Guía intentando ver auditoría
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenGuia}`);
    expect(res.status).toBe(403);
    expect(res.body.error.codigo).toBe('ACCESO_DENEGADO_ROL_NO_AUTORIZADO');
  });

  test('Seguridad 3: Token alterado responde 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/reservas')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token-manipulado');
    expect(res.status).toBe(401);
  });

  test('Seguridad 7: Operaciones quedan asentadas en la bitácora de auditoría', async () => {
    const res = await request(app)
      .get('/api/auditoria')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
