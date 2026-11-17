# USUARIOS_PRUEBA.md - Credenciales de Demostración y Pruebas

**Proyecto:** EcoFlow Suite (Ecotrack Manager)  
**Entorno:** Desarrollo y Validación (Laboratorio 14)  
**Política de Seguridad:** RC-01 (Mínimo 10 caracteres, mayúsculas, minúsculas, números y símbolos).

---

## 1. Cuentas de Acceso Interno

| Rol | Correo Electrónico | Contraseña en Claro | Uso en el Laboratorio |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@ecoflow.pe` | `EcoFlow2026!#` | Acceso total, consulta de bitácora de auditoría (`GET /api/auditoria`), configuración general. |
| **Coordinador** | `coordinador@ecoflow.pe` | `EcoFlow2026!#` | Proceso principal: Creación de reservas (`POST /api/reservas`), asignación de guías y salidas. |
| **Guía Técnico** | `guia.marcos@ecoflow.pe` | `EcoFlow2026!#` | Check-in en campo móvil (`POST /api/salidas/:id/asistencias`), reporte de incidentes y consumos. |

---

## 2. Reglas de Validación en Pruebas de Seguridad
- **Caso Contraseña Incorrecta:** Intentar login con `ClaveErronea123!#` $\rightarrow$ Respuesta `401 Unauthorized`.
- **Caso Contraseña Corta (< 10 caracteres):** Intentar login con `Admin1!` $\rightarrow$ Respuesta `400 Bad Request`.
- **Caso Inyección SQL:** Ingresar `' OR '1'='1` en el campo `email` $\rightarrow$ Acceso rechazado limpiamente sin error SQL en la respuesta.
- **Caso Acceso sin Token:** Petición a `/api/reservas` sin cabecera `Authorization` $\rightarrow$ Respuesta `401 Unauthorized`.
- **Caso Rol no Autorizado:** Petición a `/api/auditoria` con token de rol `guia` $\rightarrow$ Respuesta `403 Forbidden`.
