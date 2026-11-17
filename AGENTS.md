# AGENTS.md - Instrucciones y Reglas de Desarrollo para EcoFlow Suite

## 1. Descripción
EcoFlow Suite (Ecotrack Manager) es una plataforma integral de gestión logística y operativa para agencias de ecoturismo y turismo de aventura. Su propósito es optimizar la asignación de salidas y guías técnicos sin colisión de horarios, trazabilidad de equipamiento mediante códigos QR, control de fichas médicas, check-in en campo con tolerancia a fallos offline y liquidación de servicios sin pérdidas de dinero.
- **Usuarios y Roles:** Administrador (control total y auditoría), Coordinador de Operaciones (gestión de salidas, guías y reservas), Guía de Campo (asistencias, incidentes y consumos), Clientes y Proveedores externos.

## 2. Stack Tecnológico
- **Entorno y Lenguaje:** Node.js v20 LTS / v22 LTS (JavaScript ES Modules o CommonJS).
- **Framework Web Backend:** Express.js 4.x.
- **Base de Datos:** PostgreSQL 16 (con soporte relacional ACID estricto y JSONB).
- **Seguridad:** JWT (`jsonwebtoken`), hash de contraseñas (`bcryptjs`), CORS (`cors`), variables de entorno (`dotenv`).
- **Pruebas Automatizadas:** Jest y Supertest.
- **Cliente HTTP de Pruebas:** Extensión REST Client con archivo `backend/tests/api.http`.

## 3. Estructura de Carpetas
```text
ecoflow-suite/
├── AGENTS.md                   # Instrucciones maestras para la IA (este archivo)
├── docs/                       # Documentación formal de etapas anteriores
│   ├── ANALISIS_PROYECTO.md
│   ├── REQUISITOS_FUNCIONALES.md
│   ├── REQUISITOS_NO_FUNCIONALES.md
│   ├── INFRAESTRUCTURA.md
│   ├── DISENO_FRONTEND.md
│   ├── MODELO_DATOS.md
│   ├── API_CONTRATO.md
│   ├── MAPA_NAVEGACION.md
│   └── USUARIOS_PRUEBA.md
├── database/                   # Definición y datos semilla de la BD
│   ├── schema.sql              # DDL de tablas, claves e índices (PostgreSQL 16)
│   └── seed.sql                # Datos iniciales y usuarios de prueba
├── backend/                    # Servidor API REST real
│   ├── .env                    # Secretos y configuración local (no versionar)
│   ├── .env.example            # Plantilla pública de variables de entorno
│   ├── package.json
│   ├── src/
│   │   ├── config/             # Conexión a la base de datos y variables
│   │   ├── middlewares/        # Autenticación JWT, RBAC y manejador de errores
│   │   ├── controllers/        # Controladores de lógica HTTP
│   │   ├── services/           # Lógica de negocio y servicio de auditoría
│   │   ├── routes/             # Endpoints según API_CONTRATO.md
│   │   └── app.js              # Inicialización de Express y middlewares
│   └── tests/                  # Pruebas automatizadas y peticiones HTTP
│       ├── api.http            # Peticiones con REST Client
│       └── backend.test.js     # Pruebas con Jest / Supertest
├── frontend/                   # Prototipo SPA (HTML, CSS y JS modular)
└── mock-api/                   # API simulada de referencia (JSON Server db.json)
```

## 4. Documentos de Referencia
- **`docs/API_CONTRATO.md`**: Fuente de verdad absoluta de rutas, métodos, payloads, códigos HTTP y errores.
- **`docs/MODELO_DATOS.md`**: Fuente de verdad absoluta de entidades, campos, tipos y claves foráneas.
- **`docs/REQUISITOS_NO_FUNCIONALES.md`**: Matriz de autorización por rol (RBAC) y ciberseguridad (RC-01, RC-02).

## 5. Comandos del Proyecto
- **Instalar dependencias del backend:** `cd backend && npm.cmd install`
- **Iniciar backend en modo desarrollo:** `npm.cmd run dev` (Servidor en `http://localhost:4000`)
- **Ejecutar pruebas automatizadas:** `npm.cmd test`
- **Cargar esquema en base de datos:** `psql -U postgres -d ecoflow_db -f ../database/schema.sql`
- **Cargar datos semilla en base de datos:** `psql -U postgres -d ecoflow_db -f ../database/seed.sql`

## 6. Convenciones
- **Rutas de API:** En minúsculas y sustantivos en plural (`/auth/login`, `/tours`, `/reservas`, `/salidas`, `/auditoria`).
- **Nombres en JSON y BD:** `snake_case` (ej. `tour_id`, `fecha_tour`, `cantidad_pasajeros`, `password_hash`).
- **Formato único de errores (según API_CONTRATO.md):**
  ```json
  {
    "error": {
      "codigo": "CODIGO_DEL_ERROR",
      "mensaje": "Descripción clara del error para el usuario",
      "detalles": [
        { "campo": "nombre_campo", "mensaje": "Motivo específico del fallo" }
      ],
      "timestamp": "2026-11-20T12:00:00.000Z"
    }
  }
  ```

## 7. Reglas de Seguridad (RC-01 y RC-02)
- **Contraseñas seguras:** Mínimo 10 caracteres con mayúscula, minúscula y símbolo. Almacenadas exclusivamente con hash `bcrypt` (nunca texto plano).
- **Confidencialidad:** NUNCA devolver `password_hash` en respuestas HTTP. El login responde credenciales inválidas sin revelar si falló el correo o la contraseña.
- **Secretos:** Llaves JWT y contraseñas de BD leídas de variables de entorno (`.env`), nunca cableadas en el código.
- **Consultas parametrizadas:** Toda sentencia SQL debe usar parámetros (`$1, $2, ...` o `?`). Prohibida la concatenación de variables en queries.
- **Validación del servidor:** Validar tipo y presencia de datos en el servidor, retornando `400 Bad Request` si son inválidos.
- **Control de Acceso RBAC:** Middleware que verifique roles autorizados. Responder `401 Unauthorized` si no hay token o expiró, y `403 Forbidden` si el rol no tiene permisos.
- **Auditoría inmutable (RC-02):** Todo intento de login (exitoso o fallido) y toda transacción que cree o modifique datos debe insertarse en la tabla `auditoria`.

## 8. Reglas de Trabajo
- Desarrollar de manera incremental:
  - **Iteración 0:** Base del backend, conexión a BD, manejo centralizado de errores, CORS y `/api/health`.
  - **Iteración 1:** Autenticación JWT, middlewares de rol RBAC, servicio de auditoría y credenciales de prueba.
  - **Iteración 2:** Proceso principal (Cotización y Reservas P2), con validación de negocio y pruebas automatizadas.
- Presentar el plan de archivos antes de implementar cada incremento.
- No modificar el contrato de la API ni el modelo de datos sin autorización previa.

## 9. Definición de Terminado (Definition of Done)
1. El backend inicia limpiamente sin errores ni excepciones.
2. Endpoints implementados responden exactamente según `API_CONTRATO.md`.
3. Códigos de respuesta `200`, `201`, `400`, `401`, `403`, `409` respetan el formato estándar de error.
4. Las acciones críticas quedan registradas en la tabla `auditoria`.
5. Peticiones de prueba documentadas y funcionales en `backend/tests/api.http`.
