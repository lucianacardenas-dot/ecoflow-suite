# Contrato de Comunicación Frontend-Backend

**Proyecto:** EcoFlow Suite (Ecotrack Manager)  
**Sistema:** Plataforma Integral de Gestión Logística y Operativa para Ecoturismo y Aventura  
**Versión:** 1.0  
**Fecha:** Noviembre 2026  
**Documentos de referencia:** `REQUISITOS_FUNCIONALES.md`, `REQUISITOS_NO_FUNCIONALES.md`, `MODELO_DATOS.md`

---

## 1. Convenciones generales

1. **Rutas y Recursos:**
   - Todos los recursos se redactan con sustantivos en **plural**, en minúsculas y sin verbos en el path: `/reservas`, `/tours`, `/salidas`, `/asistencias`.
   - Se utiliza notación `kebab-case` para endpoints compuestos y `snake_case` para las claves JSON.
2. **URL Base:**
   - Desarrollo y API Simulada: `http://localhost:3000`
   - Producción (AWS EC2): `https://api.ecoflow.pe/v1`
3. **Formatos Estándar:**
   - Formato de intercambio: `application/json; charset=utf-8`.
   - Formato de fechas: `YYYY-MM-DD` (ej. `2026-11-20`).
   - Formato de horas: `HH:mm` o `HH:mm:ss` (ej. `07:30`).
   - Formato de marcas temporales: ISO 8601 UTC con sufijo Z (ej. `2026-11-20T12:30:00.000Z`).
4. **Autenticación y Seguridad:**
   - El endpoint `/auth/login` valida credenciales y entrega un token de acceso JWT.
   - Toda petición autenticada subsiguiente debe incluir el encabezado:  
     `Authorization: Bearer <token>`
   - Para clientes y proveedores externos, los enlaces tokenizados consumen endpoints públicos específicos mediante token en URL o header (`/fichas-medicas/{token}`, `/ordenes-servicio/confirmar/{token}`).
   - **Prohibición estricta:** Ninguna respuesta de la API incluirá jamás `password_hash`, tokens íntegros en logs ni datos de salud confidenciales en endpoints generales.

---

## 2. Formato único de errores

Todas las respuestas de error (códigos HTTP 400, 401, 403, 404, 409 y 500) devuelven una estructura estandarizada y predecible:

```json
{
  "error": {
    "codigo": "RESERVA_CAPACIDAD_EXCEDIDA",
    "mensaje": "La cantidad de pasajeros solicitada supera el aforo disponible del tour.",
    "detalles": [
      {
        "campo": "cantidad_pasajeros",
        "mensaje": "Cupos disponibles: 4. Cantidad solicitada: 6."
      }
    ],
    "timestamp": "2026-11-20T12:00:00.000Z"
  }
}
```

### Códigos de Estado HTTP Utilizados
- `200 OK`: Consulta o actualización parcial/total exitosa.
- `201 Created`: Creación exitosa de un recurso mediante POST.
- `400 Bad Request`: Datos de entrada inválidos, tipos incorrectos o campos obligatorios faltantes.
- `401 Unauthorized`: Token no provisto, inválido o expirado.
- `403 Forbidden`: El rol del usuario autenticado no tiene permisos para ejecutar la acción.
- `404 Not Found`: El recurso solicitado con ese ID no existe.
- `409 Conflict`: Conflicto de regla de negocio (ej. sobrecupo, solapamiento de guía, horario ocupado).
- `500 Internal Server Error`: Falla no controlada en el servidor.

---

## 3. Tabla resumen de endpoints

| Formulario / Módulo | Acción | Método | Endpoint | Datos Enviados (Payload / Query) | Resp. HTTP | Posibles Errores | Roles Autorizados |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **Autenticación** | Iniciar sesión | `POST` | `/auth/login` | `{ email, password }` | `200` | 400, 401 | Público |
| **Autenticación** | Usuario actual | `GET` | `/auth/perfil` | *Token en Header* | `200` | 401 | Admin, Coord, Guía |
| **P1: Ficha Médica** | Consultar token | `GET` | `/fichas-medicas/{token}` | — | `200` | 404 | Público (Cliente) |
| **P1: Ficha Médica** | Registrar ficha | `POST` | `/fichas-medicas/{token}` | `{ antecedentes_salud, alergias, requerimiento_dietetico, contacto_emergencia_nombre, contacto_emergencia_telefono, deslinde_firmado }` | `201` | 400, 409 | Público (Cliente) |
| **P2: Reservas** | Listar catálogo tours | `GET` | `/tours` | `?activo=true` | `200` | 401 | Admin, Coordinador |
| **P2: Reservas** | Cotizar y reservar | `POST` | `/reservas` | `{ cliente: { dni_pasaporte, nombres, apellidos, email, telefono }, tour_id, fecha_tour, cantidad_pasajeros, tipo_servicio }` | `201` | 400, 409 | Admin, Coordinador |
| **P2: Reservas** | Listar reservas | `GET` | `/reservas` | `?fecha=&estado=` | `200` | 401 | Admin, Coord, Guía |
| **P3: Salidas y Guías** | Programar salida | `POST` | `/salidas` | `{ tour_id, fecha, hora_salida, hora_retorno, reserva_ids }` | `201` | 400, 409 | Admin, Coordinador |
| **P3: Salidas y Guías** | Asignar guía | `POST` | `/salidas/{id}/guias` | `{ guia_id, rol_en_tour }` | `201` | 400, 409 | Admin, Coordinador |
| **P4: Equipamiento QR** | Consultar equipo QR | `GET` | `/equipos/{codigo_qr}` | — | `200` | 404 | Admin, Coord, Guía |
| **P4: Equipamiento QR** | Despachar equipo | `POST` | `/salidas/{id}/despacho-equipos`| `{ codigo_qr }` | `201` | 400, 409 | Coord, Guía |
| **P4: Equipamiento QR** | Retorno físico | `PATCH`| `/despacho-equipos/{id}` | `{ estado_retorno, observaciones }` | `200` | 400, 404 | Coord, Guía |
| **P5: Proveedores** | Emitir orden | `POST` | `/ordenes-servicio` | `{ salida_id, proveedor_id, total_comensales_pax, resumen_dietas }` | `201` | 400 | Admin, Coordinador |
| **P5: Proveedores** | Confirmar orden one-click | `POST` | `/ordenes-servicio/confirmar/{token}` | `{ confirmar: true }` | `200` | 404, 409 | Público (Proveedor) |
| **P6: Check-in** | Consultar manifiesto | `GET` | `/salidas/{id}/manifiesto` | — | `200` | 404 | Coord, Guía |
| **P6: Check-in** | Marcar asistencia | `POST` | `/salidas/{id}/asistencias` | `{ pasajero_id, estado_asistencia, hora_marcado }` | `201` | 400, 409 | Coord, Guía |
| **P7: Incidentes** | Reportar contingencia | `POST` | `/salidas/{id}/incidentes` | `{ tipo_incidente, severidad, descripcion, ruta_alterna_propuesta }` | `201` | 400 | Guía |
| **P7: Incidentes** | Aprobar contingencia | `PATCH`| `/incidentes/{id}` | `{ estado_aprobacion: "aprobada" }` | `200` | 404 | Admin, Coordinador |
| **P8: Liquidación** | Registrar consumo ruta | `POST` | `/salidas/{id}/consumos` | `{ reserva_id, descripcion, cantidad, precio_unitario }` | `201` | 400 | Guía |
| **P8: Liquidación** | Liquidar en counter | `POST` | `/reservas/{id}/liquidar` | `{ monto, metodo_pago, referencia }` | `200` | 400, 409 | Admin, Coordinador |
| **P8: Cierre Tour** | Cerrar salida operativa| `PATCH`| `/salidas/{id}/cierre` | `{ estado: "cerrada" }` | `200` | 409 | Admin, Coordinador |
| **Auditoría** | Consultar bitácora | `GET` | `/auditoria` | `?accion=&fecha_desde=` | `200` | 401, 403 | Solo Administrador |

---

## 4. Detalle por endpoint representativo

### 4.1 Autenticación (`POST /auth/login`)
- **Petición:**
  ```json
  POST /auth/login
  Content-Type: application/json

  {
    "email": "coordinador@ecoflow.pe",
    "password": "Password123!#"
  }
  ```
- **Respuesta 200 OK:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sIjoiY29vcmRpbmFkb3IiLCJlbWFpbCI6ImNvb3JkaW5hZG9yQGVjb2Zsb3cucGUifQ...",
    "usuario": {
      "id": 2,
      "nombres": "Luciana",
      "apellidos": "Paredes Soto",
      "email": "coordinador@ecoflow.pe",
      "rol": "coordinador"
    }
  }
  ```

---

### 4.2 Proceso 1: Registro de Ficha Médica (`POST /fichas-medicas/{token}`)
- **Petición:**
  ```json
  POST /fichas-medicas/tok-med-andrea-01
  Content-Type: application/json

  {
    "antecedentes_salud": "Ninguno de relevancia",
    "alergias": "Picadura de avispa leve",
    "requerimiento_dietetico": "vegetariano",
    "contacto_emergencia_nombre": "Roberto Salas",
    "contacto_emergencia_telefono": "+51944556677",
    "deslinde_firmado": true
  }
  ```
- **Respuesta 201 Created:**
  ```json
  {
    "id": 1,
    "pasajero_id": 1,
    "estado_ficha": "completada",
    "es_apto": true,
    "mensaje": "Ficha médica y deslinde legal registrados satisfactoriamente."
  }
  ```
- **Respuesta de Error 409 Conflict (Incompatibilidad Médica RF-02):**
  ```json
  {
    "error": {
      "codigo": "INCOMPATIBILIDAD_MEDICA_EXCLUYENTE",
      "mensaje": "La condición declarada (Cardiopatía) es incompatible con la exigencia del Tour (Rafting Clase IV).",
      "detalles": [
        {
          "campo": "antecedentes_salud",
          "mensaje": "Bloqueo preventivo de seguridad activado. Contacte a Coordinación."
        }
      ]
    }
  }
  ```

---

### 4.3 Proceso 2: Cotización y Reserva (`POST /reservas`)
- **Petición:**
  ```json
  POST /reservas
  Authorization: Bearer <token>
  Content-Type: application/json

  {
    "cliente": {
      "dni_pasaporte": "70852963",
      "nombres": "Mateo",
      "apellidos": "Gómez Rivas",
      "email": "mateo.gomez@gmail.com",
      "telefono": "+51955223344"
    },
    "tour_id": 1,
    "fecha_tour": "2026-11-20",
    "cantidad_pasajeros": 2,
    "tipo_servicio": "compartido"
  }
  ```
- **Respuesta 201 Created:**
  ```json
  {
    "id": 2,
    "codigo_reserva": "RES-2026-002",
    "tour_id": 1,
    "cantidad_pasajeros": 2,
    "monto_total": 170.00,
    "saldo_pendiente": 170.00,
    "estado": "confirmada",
    "pasajeros": [
      { "id": 3, "token_ficha": "tok-med-mateo-03", "estado_ficha": "pendiente" },
      { "id": 4, "token_ficha": "tok-med-carla-04", "estado_ficha": "pendiente" }
    ]
  }
  ```

---

### 4.4 Proceso 3: Asignación de Guías (`POST /salidas/{id}/guias`)
- **Petición:**
  ```json
  POST /salidas/1/guias
  Authorization: Bearer <token>
  Content-Type: application/json

  {
    "guia_id": 1,
    "rol_en_tour": "principal"
  }
  ```
- **Respuesta 201 Created:**
  ```json
  {
    "id": 1,
    "salida_id": 1,
    "guia_id": 1,
    "rol_en_tour": "principal",
    "fecha_asignacion": "2026-11-20T08:00:00.000Z"
  }
  ```
- **Respuesta de Error 409 Conflict (Colisión Horaria RF-04):**
  ```json
  {
    "error": {
      "codigo": "GUIA_COLISION_HORARIO",
      "mensaje": "El guía ya tiene una salida asignada en ese rango horario o no cumple los 60 min de descanso reglamentario.",
      "detalles": [
        {
          "campo": "guia_id",
          "mensaje": "Salida previa ID 5 finaliza a las 13:30. Descanso requerido hasta las 14:30."
        }
      ]
    }
  }
  ```

---

### 4.5 Proceso 4: Despacho de Equipo QR (`POST /salidas/{id}/despacho-equipos`)
- **Petición:**
  ```json
  POST /salidas/1/despacho-equipos
  Authorization: Bearer <token>
  Content-Type: application/json

  {
    "codigo_qr": "QR-ARNES-001"
  }
  ```
- **Respuesta 201 Created:**
  ```json
  {
    "id": 1,
    "salida_id": 1,
    "equipo_id": 1,
    "codigo_qr": "QR-ARNES-001",
    "tipo_equipo": "arnes_seguridad",
    "estado": "despachado",
    "fecha_despacho": "2026-11-20T07:15:00.000Z"
  }
  ```

---

### 4.6 Proceso 6: Check-in Presencial (`POST /salidas/{id}/asistencias`)
- **Petición:**
  ```json
  POST /salidas/1/asistencias
  Authorization: Bearer <token>
  Content-Type: application/json

  {
    "pasajero_id": 1,
    "estado_asistencia": "presente",
    "hora_marcado": "2026-11-20T07:25:00.000Z"
  }
  ```
- **Respuesta 201 Created:**
  ```json
  {
    "id": 1,
    "salida_id": 1,
    "pasajero_id": 1,
    "estado_asistencia": "presente",
    "sincronizado": true
  }
  ```
- **Respuesta de Advertencia/Error 409 Conflict (Ficha Pendiente RF-11):**
  ```json
  {
    "error": {
      "codigo": "DESLINDE_LEGAL_PENDIENTE",
      "mensaje": "El pasajero no ha firmado el deslinde legal ni completado la ficha médica obligatoria.",
      "detalles": [
        {
          "campo": "deslinde_firmado",
          "mensaje": "Debe firmar en counter antes de autorizar el abordaje."
        }
      ]
    }
  }
  ```

---

## 5. Validaciones en frontend y backend

| Regla de Validación | Validación en Frontend (Cliente) | Validación en Backend (Servidor) |
| :--- | :--- | :--- |
| **Campos obligatorios** | Validación HTML5 y JS antes de enviar el formulario. | Restricción `NOT NULL` y esquema Joi/Zod en endpoint. |
| **Formato de email y teléfonos** | Regex en input de correo y máscaras numéricas. | Sanitización y normalización en base de datos. |
| **Contraseña segura (RC-01)** | Indicador visual de 10 caracteres, mayúscula, minúscula y símbolo. | Comprobación estricta antes de aplicar hash bcrypt. |
| **Aforo disponible (RF-03)** | Comparación del aforo contra el contador visible. | **Bloqueo transaccional atómico ACID** con `SELECT FOR UPDATE`. |
| **Horarios de guías (RF-04)** | Filtrado visual en el dropdown de guías ocupados. | Validación rigurosa de solapamiento de intervalos temporales. |
| **Trazabilidad QR (RF-06, RF-07)** | Validación de longitud y formato del código escaneado. | Verificación de estatus `disponible` en la tabla `equipo`. |
| **Deslinde firmado en check-in (RF-11)** | Alerta visual en pantalla móvil al marcar *Presente*. | Verificación del flag `deslinde_firmado = true` en base de datos. |

---

## 6. Acciones registradas en auditoría (RC-02)

Toda modificación de estado o inserción crítica registra de manera obligatoria e inmutable:

1. `AUTH_LOGIN`: Inicio de sesión de usuarios internos (con IP y resultado).
2. `RESERVA_CONFIRMADA`: Alta de reserva con cálculo tarifario.
3. `FICHA_MEDICA_COMPLETADA`: Envío de declaración médica de pasajero.
4. `BLOQUEO_MEDICO_RIESGO`: Detección automática de condición incompatible.
5. `GUIA_ASIGNADO`: Programación de guía a salida técnica.
6. `EQUIPO_DESPACHADO`: Escaneo de salida de almacén por QR.
7. `EQUIPO_RETORNADO_DANIO`: Detección de fallas e ingreso a mantenimiento.
8. `ORDEN_PROVEEDOR_CONFIRMADA`: Aceptación one-click por transportista/restaurante.
9. `CHECKIN_PRESENCIAL`: Marcado de asistencia en punto de partida.
10. `INCIDENTE_REPORTADO` / `EMERGENCIA_SOS`: Contingencia o activación de rescate.
11. `CONSUMO_RUTA_REGISTRADO`: Cargo extraordinario de insumos a la reserva.
12. `LIQUIDACION_COUNTER`: Cobro final y balance saldado en caja.

---

## 7. Diferencias detectadas con MODELO_DATOS.md

Durante el diseño de la API REST se verificó la correspondencia total entre los campos de entrada de los formularios y los atributos del modelo de datos relacional:
- **Campos calculados:** En el frontend se envían parámetros base (`cantidad_pasajeros`, `tipo_servicio`), mientras que el backend calcula `monto_total` aplicando tarifas maestras.
- **Entidades asociativas:** Las relaciones N:M (`salida_reserva`, `asignacion_guia`, `despacho_equipo`) se exponen mediante endpoints anidados e intuitivos (`/salidas/{id}/guias`, `/salidas/{id}/despacho-equipos`), garantizando simplicidad de consumo para el frontend.
- **Tokens de seguridad:** Los tokens de enlace no requieren autenticación Bearer previa, ya que encapsulan la autorización de un solo uso en su firma.
