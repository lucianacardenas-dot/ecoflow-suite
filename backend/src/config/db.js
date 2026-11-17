// =============================================================================
// EcoFlow Suite - Configuración de Base de Datos (PostgreSQL 16 con Fallback Resiliente)
// =============================================================================
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool = null;
let useFallback = false;

// Estado en memoria para desarrollo si PostgreSQL no está levantado
const memStore = {
  roles: [
    { id: 1, nombre: 'administrador', descripcion: 'Acceso total a parametrización' },
    { id: 2, nombre: 'coordinador', descripcion: 'Gestión de reservas y salidas' },
    { id: 3, nombre: 'guia', descripcion: 'Operación en ruta y check-in' }
  ],
  usuarios: [
    {
      id: 1,
      rol_id: 1,
      rol: 'administrador',
      email: 'admin@ecoflow.pe',
      password_hash: bcrypt.hashSync('EcoFlow2026!#', 10),
      nombres: 'Carlos',
      apellidos: 'Valdivia Mendoza',
      telefono: '+51987654321',
      activo: true
    },
    {
      id: 2,
      rol_id: 2,
      rol: 'coordinador',
      email: 'coordinador@ecoflow.pe',
      password_hash: bcrypt.hashSync('EcoFlow2026!#', 10),
      nombres: 'Luciana',
      apellidos: 'Paredes Soto',
      telefono: '+51984123456',
      activo: true
    },
    {
      id: 3,
      rol_id: 3,
      rol: 'guia',
      email: 'guia.marcos@ecoflow.pe',
      password_hash: bcrypt.hashSync('EcoFlow2026!#', 10),
      nombres: 'Marcos',
      apellidos: 'Quispe Huamán',
      telefono: '+51951753951',
      activo: true
    }
  ],
  tours: [
    {
      id: 1,
      codigo: 'TR-RAFT-01',
      nombre: 'Rafting Cañón del Río Colca Clase IV',
      nivel_dificultad: 'extremo',
      capacidad_maxima: 16,
      ratio_guia_turista: 8,
      precio_base: 85.00,
      activo: true
    },
    {
      id: 2,
      codigo: 'TR-TREK-02',
      nombre: 'Trekking Glaciar Ausangate 5D/4N',
      nivel_dificultad: 'extremo',
      capacidad_maxima: 12,
      ratio_guia_turista: 6,
      precio_base: 250.00,
      activo: true
    },
    {
      id: 3,
      codigo: 'TR-CANO-03',
      nombre: 'Canopy y Puentes Colgantes Tambopata',
      nivel_dificultad: 'moderado',
      capacidad_maxima: 24,
      ratio_guia_turista: 8,
      precio_base: 45.00,
      activo: true
    }
  ],
  clientes: [
    {
      id: 1,
      dni_pasaporte: '70852963',
      nombres: 'Mateo',
      apellidos: 'Gómez Rivas',
      email: 'mateo.gomez@gmail.com',
      telefono: '+51955223344'
    }
  ],
  reservas: [
    {
      id: 1,
      codigo_reserva: 'RES-2026-001',
      cliente_id: 1,
      tour_id: 1,
      fecha_tour: '2026-12-01',
      cantidad_pasajeros: 2,
      tipo_servicio: 'compartido',
      monto_total: 170.00,
      saldo_pendiente: 170.00,
      estado: 'confirmada',
      pasajeros: [
        { id: 1, nombres: 'Mateo Gómez Rivas', token_ficha: 'tok-med-mateo-01', estado_ficha: 'completada' },
        { id: 2, nombres: 'Andrea Salas Rivas', token_ficha: 'tok-med-andrea-02', estado_ficha: 'pendiente' }
      ]
    }
  ],
  auditoria: []
};

async function initDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[DB] No DATABASE_URL configurada. Usando almacén en memoria para desarrollo.');
    useFallback = true;
    return;
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 1500
    });

    pool.on('error', (err) => {
      console.warn('[DB] Error en pool de PostgreSQL:', err.message);
      useFallback = true;
    });

    // Probar conexión de forma no bloqueante
    pool.query('SELECT 1')
      .then(() => {
        console.log('[DB] Conexión establecida exitosamente con PostgreSQL 16.');
        useFallback = false;
      })
      .catch((err) => {
        console.warn(`[DB] PostgreSQL no está disponible (${err.message}). Activando almacén en memoria.`);
        useFallback = true;
      });
  } catch (err) {
    console.warn('[DB] Falló inicialización de PostgreSQL. Usando fallback en memoria.');
    useFallback = true;
  }
}

async function checkConnection() {
  if (useFallback || !pool) return { ok: true, motor: 'In-Memory Development Store (Seed loaded)' };
  try {
    const res = await pool.query('SELECT NOW()');
    return { ok: true, motor: 'PostgreSQL 16', timestamp: res.rows[0].now };
  } catch (err) {
    useFallback = true;
    return { ok: true, motor: 'In-Memory Development Store (PostgreSQL offline)' };
  }
}

module.exports = {
  initDb,
  checkConnection,
  getPool: () => pool,
  getMemStore: () => memStore,
  isFallback: () => useFallback,
  setFallback: (val) => { useFallback = val; }
};
