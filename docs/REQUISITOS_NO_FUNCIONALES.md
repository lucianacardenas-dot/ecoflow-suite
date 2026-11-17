# Especificación de Requisitos No Funcionales y Ciberseguridad: Ecoflow Suite

**Documento de Ingeniería de Requerimientos - Entregable de la Etapa 2**  
**Proyecto:** Ecoflow Suite - Sistema Integral de Gestión Logística y Operativa para Ecoturismo y Aventura  
**Versión:** 2.0 (Consolidada)  
**Estado:** Aprobado para Diseño y Desarrollo

---

## 1. Introducción y Marco de Calidad

El presente documento establece las características de calidad, rendimiento, confiabilidad, portabilidad y ciberseguridad exigidas para el sistema **Ecoflow Suite**, fundamentadas en el estándar internacional de calidad de software **ISO/IEC 25010** y las directrices de ciberseguridad del marco **OWASP**.

La correcta implementación de estos requisitos garantiza que la plataforma web y la aplicación móvil para guías operen con estabilidad, resiliencia ante pérdida de conectividad, tiempos de respuesta predecibles y un blindaje estricto de los datos personales y médicos sensibles de los pasajeros.

---

## 2. Requisitos No Funcionales de Calidad (RNF-01 al RNF-15)

| Categoría | Código | Requisito No Funcional (Condición comprobable) | Criterio de Aceptación / Medición |
| :--- | :---: | :--- | :--- |
| **Usabilidad** | **RNF-01** | **Accesibilidad y contraste en exteriores:** La interfaz gráfica de la app móvil para guías debe optimizarse para uso en campo bajo luz solar directa, empleando áreas táctiles interactivas con tamaño mínimo de 48 x 48 dp y una relación de contraste visual superior a 4.5:1 (conforme a WCAG 2.1 nivel AA). | El 100% de los botones principales cumple con dimensiones $\ge$ 48x48 dp y relación de contraste $\ge$ 4.5:1 verificado mediante herramientas automatizadas de auditoría de accesibilidad. |
| **Usabilidad** | **RNF-02** | **Eficiencia temporal en el check-in presencial:** El flujo de marcado de asistencia en la app móvil debe permitir registrar el estatus individual de un pasajero mediante un máximo de dos pulsaciones de pantalla o un único escaneo de confirmación. | Tiempo promedio de registro de check-in inferior a 5 segundos por pasajero evaluado en pruebas de usabilidad con guías bajo condiciones de campo simuladas. |
| **Usabilidad** | **RNF-03** | **Simplicidad en portales web sin registro:** Los formularios web tokenizados para clientes (ficha médica) y proveedores (confirmación de órdenes) deben resolverse en una vista responsiva directa sin requerir registro previo de usuario ni ingreso de contraseñas. | Tasa de finalización autónoma superior al 95%, tiempo de llenado médico $\le$ 3 minutos y confirmación de órdenes a proveedores en $\le$ 2 interacciones (clic y confirmación). |
| **Rendimiento** | **RNF-04** | **Tiempo de respuesta en transacciones web críticas:** El servidor central debe procesar y responder a las consultas de aforo, generación de cotizaciones y asignaciones de itinerarios en la plataforma web sin retardos perceptibles para el usuario. | Percentil 95 (P95) del tiempo de respuesta del servidor $\le$ 2.0 segundos bajo una carga sostenida de 50 usuarios concurrentes en pruebas de estrés. |
| **Rendimiento** | **RNF-05** | **Latencia de persistencia local en la app móvil:** El almacenamiento local de marcas de asistencia, reportes de incidentes y consumos de ruta en el dispositivo móvil debe ser asíncrono y no bloqueante. | Tiempo de escritura en la base de datos local SQLite inferior a 300 milisegundos por registro medido en métricas internas del dispositivo móvil. |
| **Rendimiento** | **RNF-06** | **Eficiencia en sincronización diferida (*Sync Queue*):** Al detectar conectividad de red (mínimo 3G de 1 Mbps), la app móvil debe procesar el lote completo de transacciones acumuladas en la base local sin demoras prolongadas. | Sincronización exitosa de un lote de hasta 100 eventos encolados en un tiempo total inferior a 5 segundos sin bloqueo del hilo principal de la aplicación. |
| **Rendimiento** | **RNF-07** | **Velocidad de lectura y decodificación de códigos QR:** El módulo de captura de la app móvil debe decodificar la etiqueta QR serializada de los equipos técnicos y desplegar su hoja de vida de forma casi instantánea. | Tiempo de lectura, decodificación y despliegue del estado del equipo inferior a 1.0 segundo con cámara de 8 MP o superior bajo iluminación diurna. |
| **Integridad** | **RNF-08** | **Atomicidad transaccional y prevención de sobrecupos (ACID):** Todas las transacciones de reserva de cupos, asignación de guías y despacho de equipamiento deben ejecutarse bajo propiedades ACID completas. | Tasa de overbooking (solapamiento de horarios de guías o exceso de aforo sobre la capacidad máxima) igual a 0.0% en pruebas automatizadas de transacciones concurrentes simultáneas. |
| **Integridad** | **RNF-09** | **Resolución determinista de conflictos en sincronización:** El motor de sincronización diferida debe resolver discrepancias entre los datos locales del móvil y la base central aplicando marcas de tiempo inmutables UTC. | Cero pérdida de registros de asistencia o incidentes tras reconexiones de red, manteniendo una bitácora auditada del 100% de los eventos resueltos. |
| **Compatibilidad** | **RNF-10** | **Compatibilidad multiplataforma de la app móvil:** La app móvil para guías turísticos debe ser completamente funcional en las versiones dominantes de los sistemas operativos móviles comerciales. | Funcionamiento certificado en Android versión 10.0 (o superior) e iOS versión 15.0 (o superior), verificada en terminales con pantallas desde 5.5 pulgadas. |
| **Compatibilidad** | **RNF-11** | **Interoperabilidad web y huella reducida de memoria:** La plataforma web administrativa debe operar en los principales navegadores y la app móvil debe optimizar el espacio de memoria en dispositivos de gama media-baja. | Visualización 100% funcional en Chrome, Firefox, Safari y Edge; huella de almacenamiento local de la app móvil (instalador + SQLite + caché semanal) $\le$ 150 MB. |
| **Mantenibilidad** | **RNF-12** | **Arquitectura modular desacoplada:** El software debe estructurarse mediante componentes modulares basados en los procesos transaccionales con contratos de interfaz estandarizados. | Capacidad demostrada de actualizar o desplegar parches en un módulo específico (ej. inventario o encuestas) sin requerir la recompilación o caída de los demás servicios. |
| **Mantenibilidad** | **RNF-13** | **Recuperación operativa ante desastres (RPO / RTO):** El sistema debe implementar mecanismos automatizados de respaldo de bases de datos para garantizar la restauración del servicio ante fallos graves. | Objetivo de Punto de Recuperación (RPO) $\le$ 15 minutos mediante respaldos automáticos incrementales, y Objetivo de Tiempo de Recuperación (RTO) $\le$ 2 horas ante desastre del servidor central. |
| **Seguridad** | **RNF-14** | **Cifrado de datos médicos sensibles en tránsito y reposo:** Toda la información médica, diagnósticos de salud y documentos de identidad de los pasajeros deben resguardarse contra intercepción o fuga de datos. | 100% del tráfico protegido bajo protocolo TLS 1.3 (HTTPS); datos médicos y fichas de salud cifradas en reposo en la base central bajo estándar AES-256. |
| **Seguridad** | **RNF-15** | **Cifrado de base de datos local en la app móvil:** La base de datos local de la app móvil que almacena manifiestos y fichas médicas durante el modo offline debe estar protegida contra extracción indebida. | Base de datos SQLite cifrada en reposo mediante SQLCipher o biblioteca equivalente, impidiendo la lectura del archivo ante robo o pérdida física del smartphone. |

---

## 3. Especificación de Requisitos de Ciberseguridad

### 3.1 Autenticación (Código RC-01)
- Longitud mínima de contraseña: 10 caracteres alfanuméricos con mayúscula, minúscula, número y símbolo especial.
- Bloqueo preventivo tras 5 intentos fallidos consecutivos durante 15 minutos.
- Almacenamiento con hash seguro (`bcrypt` coste $\ge$ 12 o `Argon2id`), nunca en texto plano.
- Tokens JWT (vigencia 15 min), con Refresh Tokens en cookies `HttpOnly`, `Secure` y `SameSite=Strict`.
- Acceso tokenizado (*One-Time Tokens*) para clientes (ficha médica) y proveedores (confirmación de órdenes).

### 3.2 Autorización - Matriz de Autorización (RBAC)

| Operación del Sistema | Administrador | Coordinador | Guía Turístico | Cliente |
| :--- | :---: | :---: | :---: | :---: |
| **Administrar catálogo maestro de tours, tarifas y reglas médicas excluyentes** | Sí | No | No | No |
| **Gestionar usuarios, roles y credenciales del personal** | Sí | No | No | No |
| **Registrar cotizaciones y confirmar reservas de tours** | Sí | Sí | No | No |
| **Programar salidas y asignar guías e itinerarios** | Sí | Sí | No | No |
| **Registrar alta, baja y mantenimiento de equipos QR** | Sí | No | No | No |
| **Despachar y registrar retorno físico de equipos técnicos QR** | Sí | Sí | Sí | No |
| **Emitir y reenviar órdenes de servicio a proveedores externos** | Sí | Sí | No | No |
| **Completar ficha médica autogestionada y firmar deslinde legal** | No | Sí (asistencia) | No | Sí |
| **Consultar fichas médicas y alertas de salud de los pasajeros del tour** | Sí | Sí | Sí | No |
| **Registrar control de asistencia presencial y check-in en campo** | No | Sí | Sí | No |
| **Registrar reportes de incidentes en ruta y proponer rutas alternas** | No | Sí | Sí | No |
| **Aprobar reprogramación de rutas y reemisión de órdenes logísticas** | Sí | Sí | No | No |
| **Activar Protocolo de Emergencia Médica Crítica inmediata en ruta** | No | No | Sí | No |
| **Registrar consumos y servicios adicionales prestados en ruta** | No | No | Sí | No |
| **Cobrar adicionales y liquidar financieramente la reserva en caja** | Sí | Sí | No | No |
| **Declarar salida de tour como *Cerrada y Liquidada*** | Sí | Sí | No | No |
| **Responder encuesta de satisfacción post-servicio** | No | No | No | Sí |
| **Consultar bitácoras de auditoría y reportes consolidados de rentabilidad** | Sí | No | No | No |

### 3.3 Registro de Eventos y Auditoría (Código RC-02)
- Formato de eventos: Fecha/Hora ISO 8601 UTC, Usuario/Actor, Dirección IP, Operación (`AUTH_LOGIN`, `RESERVA_CONFIRMADA`, etc.), Identificador del Recurso, Resultado (`EXITO` / `FALLO` + HTTP Status).
- Sanitización: Sin contraseñas, hashes ni datos sensibles en los logs.
- Persistencia *Append-Only* con retención mínima de 12 meses.
