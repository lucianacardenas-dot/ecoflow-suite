-- =============================================================================
-- EcoFlow Suite - Datos de Prueba Semilla (Seed Data)
-- Base de Datos: PostgreSQL 16
-- Archivo: database/seed.sql
-- Descripción: Carga de 3 roles, usuarios con hashes seguros, y al menos 5
--              registros por cada entidad principal del negocio ecoturístico.
-- =============================================================================

-- 1. ROLES DEL SISTEMA (RBAC)
INSERT INTO rol (nombre, descripcion) VALUES
('administrador', 'Acceso total a parametrización, catálogos, auditoría y personal.'),
('coordinador', 'Gestión de reservas, asignación de salidas, equipos y liquidaciones.'),
('guia', 'Operación en ruta, control de check-in, incidentes y consumos.');

-- 2. USUARIOS INTERNOS (RC-01: Contraseñas almacenadas exclusivamente con Hash Bcrypt/Argon2)
-- Clave demostrativa en claro: "EcoFlow2026!#"
INSERT INTO usuario (rol_id, email, password_hash, nombres, apellidos, telefono, activo) VALUES
(1, 'admin@ecoflow.pe', '$2b$12$e80y9mC4W8nF109vB3w8O.rKzUjP45qG9wV5pT42bC7x1kY9jZ2qS', 'Carlos', 'Valdivia Mendoza', '+51987654321', true),
(2, 'coordinador@ecoflow.pe', '$2b$12$k92p8mC4W8nF109vB3w8O.rKzUjP45qG9wV5pT42bC7x1kY9jZ2aB', 'Luciana', 'Paredes Soto', '+51984123456', true),
(3, 'guia.marcos@ecoflow.pe', '$2b$12$z71a9mC4W8nF109vB3w8O.rKzUjP45qG9wV5pT42bC7x1kY9jZ2cC', 'Marcos', 'Quispe Huamán', '+51951753951', true),
(3, 'guia.diana@ecoflow.pe', '$2b$12$m43x9mC4W8nF109vB3w8O.rKzUjP45qG9wV5pT42bC7x1kY9jZ2dD', 'Diana', 'Flores Cárdenas', '+51952846284', true),
(3, 'guia.rodrigo@ecoflow.pe', '$2b$12$q15b9mC4W8nF109vB3w8O.rKzUjP45qG9wV5pT42bC7x1kY9jZ2eE', 'Rodrigo', 'Chávez Vega', '+51953957395', true);

-- 3. PERSONAL DE GUÍAS TÉCNICOS (RF-04, RF-05)
INSERT INTO guia (usuario_id, codigo_licencia, especialidad, minutos_descanso_min, activo) VALUES
(3, 'LIC-AGMT-2024-001', 'rafting_aguas_bravas', 60, true),
(4, 'LIC-AGMT-2024-002', 'alta_montana', 60, true),
(5, 'LIC-AGMT-2024-003', 'trekking_canotaje', 60, true);

-- 4. CLIENTES COMERCIALES (RF-01, RF-03)
INSERT INTO cliente (dni_pasaporte, nombres, apellidos, email, telefono) VALUES
('45892147', 'Andrea', 'Salas Morales', 'andrea.salas@gmail.com', '+51944112233'),
('70852963', 'Mateo', 'Gómez Rivas', 'mateo.gomez@gmail.com', '+51955223344'),
('P-ESP849201', 'Javier', 'Fernández Gil', 'javier.fernandez@viajes.es', '+34600112233'),
('P-USA992014', 'Sarah', 'Jenkins', 'sjenkins@adventure.com', '+14155552671'),
('10293847', 'Renato', 'Cornejo Paz', 'renato.cornejo@outlook.com', '+51966334455');

-- 5. CATÁLOGO MAESTRO DE TOURS (RF-02, RF-03, RF-05)
INSERT INTO tour (codigo, nombre, descripcion, nivel_dificultad, capacidad_maxima, ratio_guia_turista, precio_base, activo) VALUES
('TR-RAFT-01', 'Rafting Cañón del Río Colca Clase IV', 'Descenso en rápidos bravos clase IV con saltos técnicos y canotaje.', 'extremo', 16, 8, 85.00, true),
('TR-TREK-02', 'Trekking Glaciar Ausangate y Laguna Verde', 'Caminata de altura (4,600 msnm) con campamento base y vistas panorámicas.', 'alto', 12, 6, 120.00, true),
('TR-KAYK-03', 'Kayak Lago Sagrado e Islas Flotantes', 'Travesía remando en kayak de travesía y visita ecológica comunitaria.', 'moderado', 20, 10, 65.00, true),
('TR-CANY-04', 'Canyoning y Rappel Cascadas Doradas', 'Descenso en cuerda de cascadas de 30 metros en bosque de niebla.', 'alto', 14, 7, 95.00, true),
('TR-BICI-05', 'Downhill BTT Valle Sagrado', 'Descenso en bicicleta de montaña con senderos técnicos de tierra.', 'moderado', 18, 9, 70.00, true);

-- 6. REGLAS MÉDICAS EXCLUYENTES (RF-02)
INSERT INTO regla_medica (tour_id, condicion_medica, es_excluyente, descripcion) VALUES
(1, 'cardiopatia', true, 'Incompatible con esfuerzo agudo y cambios de presión en rápidos clase IV.'),
(1, 'epilepsia_no_controlada', true, 'Riesgo vital inminente ante caída al caudal del río.'),
(2, 'hipertension_pulmonar', true, 'Grave riesgo de edema agudo de pulmón sobre los 4,000 msnm.'),
(4, 'vertigo_severo', true, 'Incompatible con descensos en cuerda al vacío y rappel vertical.'),
(1, 'embarazo_avanzado', true, 'Restricción absoluta por impacto físico directo.');

-- 7. EQUIPAMIENTO TÉCNICO Y CÓDIGOS QR (RF-06, RF-07)
INSERT INTO equipo (codigo_qr, tipo_equipo, marca_modelo, estado) VALUES
('QR-ARNES-001', 'arnes_seguridad', 'Petzl Corax Pro', 'disponible'),
('QR-ARNES-002', 'arnes_seguridad', 'Petzl Corax Pro', 'disponible'),
('QR-CASCO-001', 'casco_escalada', 'Black Diamond Half Dome', 'disponible'),
('QR-CASCO-002', 'casco_escalada', 'Black Diamond Half Dome', 'disponible'),
('QR-KAYAK-001', 'kayak_travesia', 'Dagger Stratos 14.5', 'disponible'),
('QR-KAYAK-002', 'kayak_travesia', 'Dagger Stratos 14.5', 'en_mantenimiento'); -- Equipo bloqueado para pruebas RF-07

-- 8. PROVEEDORES ALIADOS (RF-08, RF-09)
INSERT INTO proveedor (ruc, razon_social, tipo_servicio, contacto_nombre, email, telefono, activo) VALUES
('20548963211', 'Transportes Cordillera Andina S.A.C.', 'transporte', 'Manuel Estrada', 'operaciones@cordillera.pe', '+51981122334', true),
('20612345678', 'EcoBus Aventura E.I.R.L.', 'transporte', 'Gloria Cárdenas', 'reservas@ecobus.pe', '+51982233445', true),
('20498765432', 'Restaurante Campestre Los Pinos', 'restaurante', 'Alonso Benavides', 'lospinos@campo.pe', '+51983344556', true),
('20511223344', 'Albergue y Fogón de Altura', 'restaurante', 'Martha Zúñiga', 'fogon@altura.pe', '+51984455667', true),
('20699887766', 'Rutas & Vanes del Sur S.R.L.', 'transporte', 'Felipe Ortiz', 'rutasur@transporte.pe', '+51985566778', true);

-- 9. RESERVAS COMERCIALES (RF-03, RF-15)
INSERT INTO reserva (codigo_reserva, cliente_id, tour_id, fecha_tour, cantidad_pasajeros, tipo_servicio, monto_total, saldo_pendiente, estado) VALUES
('RES-2026-001', 1, 1, '2026-11-20', 2, 'compartido', 170.00, 0.00, 'confirmada'),
('RES-2026-002', 2, 2, '2026-11-20', 2, 'compartido', 240.00, 120.00, 'confirmada'),
('RES-2026-003', 3, 3, '2026-11-21', 4, 'privado', 320.00, 320.00, 'pendiente'),
('RES-2026-004', 4, 1, '2026-11-22', 1, 'compartido', 85.00, 0.00, 'confirmada'),
('RES-2026-005', 5, 4, '2026-11-23', 2, 'compartido', 190.00, 95.00, 'confirmada');

-- 10. PASAJEROS Y FICHAS MÉDICAS (RF-01, RF-02, RF-11)
INSERT INTO pasajero (reserva_id, dni_pasaporte, nombres, apellidos, es_menor, token_ficha, estado_ficha) VALUES
(1, '45892147', 'Andrea', 'Salas Morales', false, 'tok-med-andrea-01', 'completada'),
(1, '71234567', 'Gustavo', 'Salas Morales', false, 'tok-med-gustavo-02', 'completada'),
(2, '70852963', 'Mateo', 'Gómez Rivas', false, 'tok-med-mateo-03', 'bloqueada_riesgo'), -- Caso RF-02: Bloqueado por afección
(2, '72345678', 'Carla', 'Méndez Peña', false, 'tok-med-carla-04', 'completada'),
(4, 'P-USA992014', 'Sarah', 'Jenkins', false, 'tok-med-sarah-05', 'pendiente'); -- Caso RF-11: Ficha pendiente

INSERT INTO ficha_medica (pasajero_id, antecedentes_salud, alergias, requerimiento_dietetico, contacto_emergencia_nombre, contacto_emergencia_telefono, deslinde_firmado, fecha_firma, es_apto) VALUES
(1, 'Ninguno', 'Picadura de avispa leve', 'vegetariano', 'Roberto Salas', '+51944556677', true, CURRENT_TIMESTAMP, true),
(2, 'Miopia', 'Ninguna', 'ninguno', 'Roberto Salas', '+51944556677', true, CURRENT_TIMESTAMP, true),
(3, 'Cardiopatia coronaria tratada', 'Penicilina', 'celiaco', 'Elena Rivas', '+51955667788', true, CURRENT_TIMESTAMP, false), -- No apto RF-02
(4, 'Rinitis alérgica', 'Polen', 'vegano', 'Pedro Méndez', '+51966778899', true, CURRENT_TIMESTAMP, true);

-- 11. SALIDAS PROGRAMADAS (RF-04, RF-05)
INSERT INTO salida (tour_id, fecha, hora_salida, hora_retorno, estado) VALUES
(1, '2026-11-20', '07:30:00', '13:00:00', 'programada'),
(2, '2026-11-20', '06:00:00', '16:00:00', 'programada'),
(3, '2026-11-21', '08:00:00', '14:00:00', 'programada'),
(1, '2026-11-22', '07:30:00', '13:00:00', 'programada'),
(4, '2026-11-23', '08:30:00', '15:30:00', 'programada');

-- 12. VINCULACIÓN SALIDA - RESERVA Y ASIGNACIÓN DE GUÍAS (RF-04, RF-05)
INSERT INTO salida_reserva (salida_id, reserva_id) VALUES
(1, 1),
(2, 2);

INSERT INTO asignacion_guia (salida_id, guia_id, rol_en_tour) VALUES
(1, 1, 'principal'),
(2, 2, 'principal');

-- 13. DESPACHO DE EQUIPOS TÉCNICOS (RF-06)
INSERT INTO despacho_equipo (salida_id, equipo_id, fecha_despacho, fecha_retorno, estado_retorno, observaciones) VALUES
(1, 1, CURRENT_TIMESTAMP, NULL, NULL, 'Entregado en perfecto estado con arnés sellado.'),
(1, 3, CURRENT_TIMESTAMP, NULL, NULL, 'Casco desinfectado.');

-- 14. ÓRDENES DE SERVICIO A PROVEEDORES (RF-08, RF-09)
INSERT INTO orden_servicio (numero_orden, salida_id, proveedor_id, total_comensales_pax, resumen_dietas, token_confirmacion, estado) VALUES
('ORD-2026-001', 1, 1, 3, '2 turistas + 1 guía. Transporte en Minivan van 01.', 'tok-prov-transp-001', 'confirmada'),
('ORD-2026-002', 1, 3, 3, '1 vegetariano, 2 menú regular sin mariscos.', 'tok-prov-rest-002', 'emitida');

-- 15. CHECK-IN Y ASISTENCIA (RF-10, RF-11)
INSERT INTO asistencia (salida_id, pasajero_id, estado_asistencia, hora_marcado, sincronizado) VALUES
(1, 1, 'presente', CURRENT_TIMESTAMP, true),
(1, 2, 'presente', CURRENT_TIMESTAMP, true);

-- 16. CONSUMOS ADICIONALES EN RUTA (RF-14)
INSERT INTO consumo_adicional (salida_id, reserva_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 'Alquiler de traje de neopreno extra térmico', 2, 15.00, 30.00),
(1, 1, 'Pack hidratación electrolitos 750ml', 2, 5.00, 10.00);

-- 17. PAGOS Y LIQUIDACIÓN (RF-15)
INSERT INTO pago_liquidacion (reserva_id, monto, metodo_pago, referencia_transaccion) VALUES
(1, 170.00, 'tarjeta_credito', 'VISA-AUTH-984210'),
(2, 120.00, 'transferencia', 'BCP-TRANSF-102938');

-- 18. BITÁCORA DE AUDITORÍA (RC-02)
INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, ip_origen, resultado, detalles) VALUES
(2, 'RESERVA_CONFIRMADA', 'reserva', 1, '192.168.1.45', 'EXITO', 'Reserva confirmada con anticipo completo.'),
(1, 'BLOQUEO_MEDICO_RIESGO', 'pasajero', 3, '192.168.1.10', 'EXITO', 'Bloqueo automático: Cardiopatía en Rafting Cañón Colca.');
