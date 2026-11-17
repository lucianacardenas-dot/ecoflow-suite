-- =============================================================================
-- EcoFlow Suite - Sistema de Gestión Logística y Operativa para Ecoturismo
-- Base de Datos: PostgreSQL 16
-- Archivo: database/schema.sql
-- Descripción: Definición del esquema relacional físico, tablas, restricciones,
--              claves foráneas e índices.
-- =============================================================================

-- Limpieza preventiva de objetos en caso de recreación
DROP TABLE IF EXISTS encuesta_satisfaccion CASCADE;
DROP TABLE IF EXISTS pago_liquidacion CASCADE;
DROP TABLE IF EXISTS consumo_adicional CASCADE;
DROP TABLE IF EXISTS incidente CASCADE;
DROP TABLE IF EXISTS asistencia CASCADE;
DROP TABLE IF EXISTS orden_servicio CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;
DROP TABLE IF EXISTS despacho_equipo CASCADE;
DROP TABLE IF EXISTS equipo CASCADE;
DROP TABLE IF EXISTS asignacion_guia CASCADE;
DROP TABLE IF EXISTS salida_reserva CASCADE;
DROP TABLE IF EXISTS salida CASCADE;
DROP TABLE IF EXISTS guia CASCADE;
DROP TABLE IF EXISTS ficha_medica CASCADE;
DROP TABLE IF EXISTS pasajero CASCADE;
DROP TABLE IF EXISTS reserva CASCADE;
DROP TABLE IF EXISTS regla_medica CASCADE;
DROP TABLE IF EXISTS tour CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

-- -----------------------------------------------------------------------------
-- 1. TABLAS DE SEGURIDAD, ROLES Y AUDITORÍA (RNF, RBAC, RC-01, RC-02)
-- -----------------------------------------------------------------------------

CREATE TABLE rol (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuario (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_id INTEGER NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- RC-01: Hash Argon2id / bcrypt, nunca texto plano
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(30),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) 
        REFERENCES rol(id) ON DELETE RESTRICT
);

CREATE TABLE auditoria (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER, -- Puede ser NULL en operaciones públicas con token
    accion VARCHAR(80) NOT NULL,
    tabla_afectada VARCHAR(60) NOT NULL,
    registro_id INTEGER,
    ip_origen VARCHAR(45) NOT NULL,
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('EXITO', 'FALLO')),
    detalles TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuario(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 2. TABLAS DE PERSONAL DE GUÍAS (RF-04, RF-05)
-- -----------------------------------------------------------------------------

CREATE TABLE guia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE,
    codigo_licencia VARCHAR(50) NOT NULL UNIQUE,
    especialidad VARCHAR(80) NOT NULL,
    minutos_descanso_min INTEGER NOT NULL DEFAULT 60 CHECK (minutos_descanso_min >= 30),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_guia_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuario(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 3. TABLAS DE CATÁLOGO Y CLIENTES (RF-01, RF-02, RF-03)
-- -----------------------------------------------------------------------------

CREATE TABLE cliente (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dni_pasaporte VARCHAR(30) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    telefono VARCHAR(30) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tour (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    nivel_dificultad VARCHAR(30) NOT NULL CHECK (nivel_dificultad IN ('bajo', 'moderado', 'alto', 'extremo')),
    capacidad_maxima INTEGER NOT NULL CHECK (capacidad_maxima > 0),
    ratio_guia_turista INTEGER NOT NULL DEFAULT 8 CHECK (ratio_guia_turista > 0),
    precio_base NUMERIC(10,2) NOT NULL CHECK (precio_base > 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE regla_medica (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tour_id INTEGER NOT NULL,
    condicion_medica VARCHAR(100) NOT NULL,
    es_excluyente BOOLEAN NOT NULL DEFAULT FALSE,
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_regla_tour FOREIGN KEY (tour_id) 
        REFERENCES tour(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 4. TABLAS DE RESERVAS Y PASAJEROS (RF-01, RF-02, RF-03)
-- -----------------------------------------------------------------------------

CREATE TABLE reserva (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_reserva VARCHAR(40) NOT NULL UNIQUE,
    cliente_id INTEGER NOT NULL,
    tour_id INTEGER NOT NULL,
    fecha_tour DATE NOT NULL,
    cantidad_pasajeros INTEGER NOT NULL CHECK (cantidad_pasajeros > 0),
    tipo_servicio VARCHAR(30) NOT NULL DEFAULT 'compartido' CHECK (tipo_servicio IN ('compartido', 'privado')),
    monto_total NUMERIC(10,2) NOT NULL CHECK (monto_total >= 0),
    saldo_pendiente NUMERIC(10,2) NOT NULL CHECK (saldo_pendiente >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'confirmada', 'en_curso', 'liquidada', 'cancelada')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_cliente FOREIGN KEY (cliente_id) 
        REFERENCES cliente(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reserva_tour FOREIGN KEY (tour_id) 
        REFERENCES tour(id) ON DELETE RESTRICT
);

CREATE TABLE pasajero (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id INTEGER NOT NULL,
    dni_pasaporte VARCHAR(30),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    es_menor BOOLEAN NOT NULL DEFAULT FALSE,
    token_ficha VARCHAR(80) NOT NULL UNIQUE, -- Token seguro para autogestión médica web
    estado_ficha VARCHAR(30) NOT NULL DEFAULT 'pendiente' 
        CHECK (estado_ficha IN ('pendiente', 'completada', 'bloqueada_riesgo')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pasajero_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reserva(id) ON DELETE CASCADE
);

CREATE TABLE ficha_medica (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pasajero_id INTEGER NOT NULL UNIQUE, -- Relación 1:1 estricta
    antecedentes_salud TEXT,
    alergias TEXT,
    requerimiento_dietetico VARCHAR(50) DEFAULT 'ninguno',
    contacto_emergencia_nombre VARCHAR(120) NOT NULL,
    contacto_emergencia_telefono VARCHAR(30) NOT NULL,
    deslinde_firmado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_firma TIMESTAMP WITH TIME ZONE,
    es_apto BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ficha_pasajero FOREIGN KEY (pasajero_id) 
        REFERENCES pasajero(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 5. TABLAS DE SALIDAS OPERATIVAS E ITINERARIOS (RF-04, RF-05)
-- -----------------------------------------------------------------------------

CREATE TABLE salida (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tour_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora_salida TIME NOT NULL,
    hora_retorno TIME NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'programada' 
        CHECK (estado IN ('programada', 'en_ruta', 'en_emergencia', 'cerrada')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_salida_tour FOREIGN KEY (tour_id) 
        REFERENCES tour(id) ON DELETE RESTRICT,
    CONSTRAINT chk_salida_horario CHECK (hora_retorno > hora_salida)
);

-- Entidad intermedia: Salida - Reserva (N:M)
CREATE TABLE salida_reserva (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    salida_id INTEGER NOT NULL,
    reserva_id INTEGER NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sr_salida FOREIGN KEY (salida_id) 
        REFERENCES salida(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reserva(id) ON DELETE RESTRICT,
    CONSTRAINT uq_salida_reserva UNIQUE (salida_id, reserva_id)
);

-- Entidad intermedia: Salida - Guía (N:M con rol)
CREATE TABLE asignacion_guia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    salida_id INTEGER NOT NULL,
    guia_id INTEGER NOT NULL,
    rol_en_tour VARCHAR(30) NOT NULL DEFAULT 'principal' 
        CHECK (rol_en_tour IN ('principal', 'auxiliar')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ag_salida FOREIGN KEY (salida_id) 
        REFERENCES salida(id) ON DELETE CASCADE,
    CONSTRAINT fk_ag_guia FOREIGN KEY (guia_id) 
        REFERENCES guia(id) ON DELETE RESTRICT,
    CONSTRAINT uq_salida_guia UNIQUE (salida_id, guia_id)
);

-- -----------------------------------------------------------------------------
-- 6. TABLAS DE EQUIPAMIENTO Y TRAZABILIDAD QR (RF-06, RF-07)
-- -----------------------------------------------------------------------------

CREATE TABLE equipo (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_qr VARCHAR(50) NOT NULL UNIQUE,
    tipo_equipo VARCHAR(60) NOT NULL,
    marca_modelo VARCHAR(100) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'disponible' 
        CHECK (estado IN ('disponible', 'despachado', 'en_mantenimiento', 'baja')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE despacho_equipo (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    salida_id INTEGER NOT NULL,
    equipo_id INTEGER NOT NULL,
    fecha_despacho TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_retorno TIMESTAMP WITH TIME ZONE,
    estado_retorno VARCHAR(30) CHECK (estado_retorno IN ('optimo', 'con_danio', 'requiere_inspeccion')),
    observaciones TEXT,
    CONSTRAINT fk_de_salida FOREIGN KEY (salida_id) 
        REFERENCES salida(id) ON DELETE CASCADE,
    CONSTRAINT fk_de_equipo FOREIGN KEY (equipo_id) 
        REFERENCES equipo(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 7. TABLAS DE PROVEEDORES Y ÓRDENES LOGÍSTICAS (RF-08, RF-09)
-- -----------------------------------------------------------------------------

CREATE TABLE proveedor (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ruc VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    tipo_servicio VARCHAR(30) NOT NULL CHECK (tipo_servicio IN ('transporte', 'restaurante')),
    contacto_nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orden_servicio (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_orden VARCHAR(40) NOT NULL UNIQUE,
    salida_id INTEGER NOT NULL,
    proveedor_id INTEGER NOT NULL,
    total_comensales_pax INTEGER NOT NULL CHECK (total_comensales_pax > 0),
    resumen_dietas TEXT,
    token_confirmacion VARCHAR(80) NOT NULL UNIQUE,
    estado VARCHAR(30) NOT NULL DEFAULT 'emitida' 
        CHECK (estado IN ('emitida', 'confirmada', 'cancelada')),
    confirmado_en TIMESTAMP WITH TIME ZONE,
    ip_confirmacion VARCHAR(45),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_os_salida FOREIGN KEY (salida_id) 
        REFERENCES salida(id) ON DELETE CASCADE,
    CONSTRAINT fk_os_proveedor FOREIGN KEY (proveedor_id) 
        REFERENCES proveedor(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 8. TABLAS DE CAMPO: CHECK-IN, INCIDENTES Y CONSUMOS (RF-10, 11, 12, 13, 14)
-- -----------------------------------------------------------------------------

CREATE TABLE asistencia (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    salida_id INTEGER NOT NULL,
    pasajero_id INTEGER NOT NULL,
    estado_asistencia VARCHAR(30) NOT NULL DEFAULT 'presente' 
        CHECK (estado_asistencia IN ('presente', 'ausente_no_show')),
    hora_marcado TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sincronizado BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_ast_salida FOREIGN KEY (salida_id) 
        REFERENCES salida(id) ON DELETE CASCADE,
    CONSTRAINT fk_ast_pasajero FOREIGN KEY (pasajero_id) 
        REFERENCES pasajero(id) ON DELETE RESTRICT,
    CONSTRAINT uq_salida_pasajero UNIQUE (salida_id, pasajero_id)
);

CREATE TABLE incidente (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    salida_id INTEGER NOT NULL,
    tipo_incidente VARCHAR(50) NOT NULL 
        CHECK (tipo_incidente IN ('clima_adverso', 'bloqueo_ruta', 'emergencia_medica', 'falla_mecanica')),
    severidad VARCHAR(30) NOT NULL 
        CHECK (severidad IN ('leve', 'moderada', 'critica_sos')),
    descripcion TEXT NOT NULL,
    ruta_alterna_propuesta TEXT,
    estado_aprobacion VARCHAR(30) NOT NULL DEFAULT 'pendiente' 
        CHECK (estado_aprobacion IN ('pendiente', 'aprobada', 'ejecutada_sos')),
    reportado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    aprobado_en TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_inc_salida FOREIGN KEY (salida_id) 
        REFERENCES salida(id) ON DELETE CASCADE
);

CREATE TABLE consumo_adicional (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    salida_id INTEGER NOT NULL,
    reserva_id INTEGER NOT NULL,
    descripcion VARCHAR(120) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal > 0),
    registrado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ca_salida FOREIGN KEY (salida_id) 
        REFERENCES salida(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reserva(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 9. TABLAS DE LIQUIDACIÓN Y SATISFACCIÓN (RF-15)
-- -----------------------------------------------------------------------------

CREATE TABLE pago_liquidacion (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id INTEGER NOT NULL,
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    metodo_pago VARCHAR(40) NOT NULL 
        CHECK (metodo_pago IN ('tarjeta_credito', 'transferencia', 'efectivo_counter')),
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    referencia_transaccion VARCHAR(80),
    CONSTRAINT fk_pago_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reserva(id) ON DELETE RESTRICT
);

CREATE TABLE encuesta_satisfaccion (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reserva_id INTEGER NOT NULL UNIQUE,
    puntuacion_general INTEGER CHECK (puntuacion_general BETWEEN 1 AND 5),
    comentarios TEXT,
    enviado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    respondido_en TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_enc_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reserva(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 10. ÍNDICES ESTRATÉGICOS PARA CONSULTAS FRECUENTES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_reserva_fecha ON reserva(fecha_tour, estado);
CREATE INDEX idx_pasajero_token ON pasajero(token_ficha);
CREATE INDEX idx_salida_fecha ON salida(fecha, estado);
CREATE INDEX idx_equipo_qr ON equipo(codigo_qr);
CREATE INDEX idx_orden_token ON orden_servicio(token_confirmacion);
CREATE INDEX idx_asistencia_salida ON asistencia(salida_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(creado_en);
