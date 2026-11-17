// =============================================================================
// EcoFlow Suite - Proceso Principal P2: Cotización y Reservas (RF-03, RC-02)
// =============================================================================
const express = require('express');
const router = express.Router();
const { getPool, getMemStore, isFallback } = require('../config/db');
const { autenticarToken, autorizarRoles } = require('../middlewares/auth');
const { registrarAuditoria } = require('../services/auditService');

// GET /api/reservas - Listar reservas (Admin, Coordinador, Guía)
router.get('/', autenticarToken, autorizarRoles('administrador', 'coordinador', 'guia'), async (req, res, next) => {
  try {
    const pool = getPool();
    if (pool && !isFallback()) {
      const query = `
        SELECT r.id, r.codigo_reserva, r.fecha_tour, r.cantidad_pasajeros, r.tipo_servicio,
               r.monto_total, r.saldo_pendiente, r.estado,
               t.nombre AS tour_nombre, t.codigo AS tour_codigo,
               c.nombres AS cliente_nombres, c.apellidos AS cliente_apellidos, c.email AS cliente_email
        FROM reserva r
        JOIN tour t ON r.tour_id = t.id
        JOIN cliente c ON r.cliente_id = c.id
        ORDER BY r.id DESC
      `;
      const result = await pool.query(query);
      return res.status(200).json(result.rows);
    }

    const memStore = getMemStore();
    const listado = memStore.reservas.map((r) => {
      const tour = memStore.tours.find((t) => t.id === r.tour_id) || {};
      const cliente = memStore.clientes.find((c) => c.id === r.cliente_id) || {};
      return {
        ...r,
        tour_nombre: tour.nombre,
        tour_codigo: tour.codigo,
        cliente_nombres: cliente.nombres,
        cliente_apellidos: cliente.apellidos,
        cliente_email: cliente.email
      };
    });
    res.status(200).json(listado);
  } catch (err) {
    next(err);
  }
});

// POST /api/reservas - Cotizar y registrar reserva (Admin, Coordinador)
router.post('/', autenticarToken, autorizarRoles('administrador', 'coordinador'), async (req, res, next) => {
  const { cliente, tour_id, fecha_tour, cantidad_pasajeros, tipo_servicio } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // 1. Validaciones en Servidor (400 Bad Request)
  const detallesError = [];
  if (!cliente) {
    detallesError.push({ campo: 'cliente', mensaje: 'Los datos del cliente titular son obligatorios' });
  } else {
    if (!cliente.dni_pasaporte) detallesError.push({ campo: 'cliente.dni_pasaporte', mensaje: 'DNI o pasaporte es requerido' });
    if (!cliente.nombres) detallesError.push({ campo: 'cliente.nombres', mensaje: 'Nombres son requeridos' });
    if (!cliente.apellidos) detallesError.push({ campo: 'cliente.apellidos', mensaje: 'Apellidos son requeridos' });
    if (!cliente.email) detallesError.push({ campo: 'cliente.email', mensaje: 'Email de contacto es requerido' });
  }

  if (!tour_id) detallesError.push({ campo: 'tour_id', mensaje: 'El ID del tour es obligatorio' });
  if (!fecha_tour) detallesError.push({ campo: 'fecha_tour', mensaje: 'La fecha del tour es obligatoria' });
  if (!cantidad_pasajeros || parseInt(cantidad_pasajeros, 10) <= 0) {
    detallesError.push({ campo: 'cantidad_pasajeros', mensaje: 'La cantidad de pasajeros debe ser mayor a 0' });
  }

  if (detallesError.length > 0) {
    return res.status(400).json({
      error: {
        codigo: 'DATOS_RESERVA_INVALIDOS',
        mensaje: 'La solicitud contiene campos obligatorios incompletos o con formato incorrecto.',
        detalles: detallesError,
        timestamp: new Date().toISOString()
      }
    });
  }

  const pax = parseInt(cantidad_pasajeros, 10);
  const servicio = tipo_servicio || 'compartido';

  try {
    const pool = getPool();
    if (pool && !isFallback()) {
      // 2. Consulta y Bloqueo de Capacidad en PostgreSQL
      const tourRes = await pool.query('SELECT * FROM tour WHERE id = $1 AND activo = TRUE', [tour_id]);
      if (tourRes.rows.length === 0) {
        return res.status(404).json({
          error: {
            codigo: 'TOUR_NO_ENCONTRADO',
            mensaje: `El tour con ID ${tour_id} no existe o no está activo.`,
            detalles: [{ campo: 'tour_id', mensaje: 'ID no válido' }],
            timestamp: new Date().toISOString()
          }
        });
      }

      const tour = tourRes.rows[0];

      // Sumar cupos ya reservados en esa fecha
      const cuposRes = await pool.query(
        `SELECT COALESCE(SUM(cantidad_pasajeros), 0) AS ocupados
         FROM reserva
         WHERE tour_id = $1 AND fecha_tour = $2 AND estado != 'cancelada'`,
        [tour_id, fecha_tour]
      );
      const ocupados = parseInt(cuposRes.rows[0].ocupados, 10);
      const disponibles = tour.capacidad_maxima - ocupados;

      if (pax > disponibles) {
        return res.status(409).json({
          error: {
            codigo: 'RESERVA_CAPACIDAD_EXCEDIDA',
            mensaje: 'La cantidad de pasajeros solicitada supera el aforo disponible del tour.',
            detalles: [
              {
                campo: 'cantidad_pasajeros',
                mensaje: `Cupos disponibles: ${Math.max(0, disponibles)}. Cantidad solicitada: ${pax}. Aforo total: ${tour.capacidad_maxima}.`
              }
            ],
            timestamp: new Date().toISOString()
          }
        });
      }

      // Crear o buscar cliente
      let clienteId;
      const clienteExistente = await pool.query('SELECT id FROM cliente WHERE dni_pasaporte = $1', [cliente.dni_pasaporte]);
      if (clienteExistente.rows.length > 0) {
        clienteId = clienteExistente.rows[0].id;
      } else {
        const nuevoCli = await pool.query(
          `INSERT INTO cliente (dni_pasaporte, nombres, apellidos, email, telefono)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [cliente.dni_pasaporte, cliente.nombres, cliente.apellidos, cliente.email, cliente.telefono || '+51900000000']
        );
        clienteId = nuevoCli.rows[0].id;
      }

      // Cálculo tarifario
      const multiplicador = servicio === 'privado' ? 1.4 : 1.0;
      const precioBase = parseFloat(tour.precio_base);
      const montoTotal = Number((precioBase * pax * multiplicador).toFixed(2));
      const codigoReserva = `RES-${Date.now().toString().slice(-6)}`;

      // Insertar reserva
      const insertRes = await pool.query(
        `INSERT INTO reserva (codigo_reserva, cliente_id, tour_id, fecha_tour, cantidad_pasajeros, tipo_servicio, monto_total, saldo_pendiente, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmada') RETURNING id`,
        [codigoReserva, clienteId, tour_id, fecha_tour, pax, servicio, montoTotal, montoTotal]
      );
      const reservaId = insertRes.rows[0].id;

      // Crear tokens de pasajeros
      const pasajerosResp = [];
      for (let i = 1; i <= pax; i++) {
        const tokenFicha = `tok-med-${reservaId}-${i}-${Math.random().toString(36).substring(2, 8)}`;
        const pNombres = i === 1 ? cliente.nombres : `Acompañante ${i}`;
        const pApellidos = i === 1 ? cliente.apellidos : cliente.apellidos;

        const pasInsert = await pool.query(
          `INSERT INTO pasajero (reserva_id, dni_pasaporte, nombres, apellidos, es_menor, token_ficha, estado_ficha)
           VALUES ($1, $2, $3, $4, FALSE, $5, 'pendiente') RETURNING id`,
          [reservaId, i === 1 ? cliente.dni_pasaporte : null, pNombres, pApellidos, tokenFicha]
        );

        pasajerosResp.push({
          id: pasInsert.rows[0].id,
          nombres: `${pNombres} ${pApellidos}`,
          token_ficha: tokenFicha,
          estado_ficha: 'pendiente'
        });
      }

      // Auditoría inmutable
      await registrarAuditoria({
        usuarioId: req.usuario ? req.usuario.id : null,
        accion: 'RESERVA_CONFIRMADA',
        tablaAfectada: 'reserva',
        registroId: reservaId,
        ipOrigen: ip,
        resultado: 'EXITO',
        detalles: `Reserva ${codigoReserva} creada para ${pax} pasajeros. Tour ID: ${tour_id}. Total: USD ${montoTotal}`
      });

      return res.status(201).json({
        id: reservaId,
        codigo_reserva: codigoReserva,
        tour_id: parseInt(tour_id, 10),
        tour_nombre: tour.nombre,
        fecha_tour,
        cantidad_pasajeros: pax,
        tipo_servicio: servicio,
        monto_total: montoTotal,
        saldo_pendiente: montoTotal,
        estado: 'confirmada',
        pasajeros: pasajerosResp
      });
    }

    // LÓGICA DE FALLBACK EN MEMORIA (SI POSTGRESQL ESTÁ OFFLINE)
    const memStore = getMemStore();
    const tour = memStore.tours.find((t) => t.id === parseInt(tour_id, 10) && t.activo);
    if (!tour) {
      return res.status(404).json({
        error: {
          codigo: 'TOUR_NO_ENCONTRADO',
          mensaje: `El tour con ID ${tour_id} no existe o no está activo.`,
          detalles: [{ campo: 'tour_id', mensaje: 'ID no válido' }],
          timestamp: new Date().toISOString()
        }
      });
    }

    // Capacidad en memoria
    const reservasFecha = memStore.reservas.filter(
      (r) => r.tour_id === tour.id && r.fecha_tour === fecha_tour && r.estado !== 'cancelada'
    );
    const ocupados = reservasFecha.reduce((acc, r) => acc + r.cantidad_pasajeros, 0);
    const disponibles = tour.capacidad_maxima - ocupados;

    if (pax > disponibles) {
      return res.status(409).json({
        error: {
          codigo: 'RESERVA_CAPACIDAD_EXCEDIDA',
          mensaje: 'La cantidad de pasajeros solicitada supera el aforo disponible del tour.',
          detalles: [
            {
              campo: 'cantidad_pasajeros',
              mensaje: `Cupos disponibles: ${Math.max(0, disponibles)}. Cantidad solicitada: ${pax}. Aforo total: ${tour.capacidad_maxima}.`
            }
          ],
          timestamp: new Date().toISOString()
        }
      });
    }

    let clienteExistente = memStore.clientes.find((c) => c.dni_pasaporte === cliente.dni_pasaporte);
    if (!clienteExistente) {
      clienteExistente = {
        id: memStore.clientes.length + 1,
        dni_pasaporte: cliente.dni_pasaporte,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        email: cliente.email,
        telefono: cliente.telefono || '+51900000000'
      };
      memStore.clientes.push(clienteExistente);
    }

    const multiplicador = servicio === 'privado' ? 1.4 : 1.0;
    const precioBase = parseFloat(tour.precio_base);
    const montoTotal = Number((precioBase * pax * multiplicador).toFixed(2));
    const reservaId = memStore.reservas.length + 1;
    const codigoReserva = `RES-${Date.now().toString().slice(-6)}`;

    const pasajerosResp = [];
    for (let i = 1; i <= pax; i++) {
      const pNombres = i === 1 ? cliente.nombres : `Acompañante ${i}`;
      const pApellidos = cliente.apellidos;
      pasajerosResp.push({
        id: i,
        nombres: `${pNombres} ${pApellidos}`,
        token_ficha: `tok-med-${reservaId}-${i}-${Math.random().toString(36).substring(2, 8)}`,
        estado_ficha: 'pendiente'
      });
    }

    const nuevaReserva = {
      id: reservaId,
      codigo_reserva: codigoReserva,
      cliente_id: clienteExistente.id,
      tour_id: tour.id,
      tour_nombre: tour.nombre,
      fecha_tour,
      cantidad_pasajeros: pax,
      tipo_servicio: servicio,
      monto_total: montoTotal,
      saldo_pendiente: montoTotal,
      estado: 'confirmada',
      pasajeros: pasajerosResp
    };

    memStore.reservas.push(nuevaReserva);

    // Auditoría inmutable
    await registrarAuditoria({
      usuarioId: req.usuario ? req.usuario.id : null,
      accion: 'RESERVA_CONFIRMADA',
      tablaAfectada: 'reserva',
      registroId: reservaId,
      ipOrigen: ip,
      resultado: 'EXITO',
      detalles: `Reserva ${codigoReserva} creada para ${pax} pasajeros. Tour: ${tour.nombre}. Total: USD ${montoTotal}`
    });

    res.status(201).json(nuevaReserva);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
