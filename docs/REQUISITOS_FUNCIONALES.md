# Especificación de Requisitos Funcionales: Ecoflow Suite

**Documento de Ingeniería de Requerimientos - Entregable de la Etapa 2**  
**Proyecto:** Ecoflow Suite - Sistema Integral de Gestión Logística y Operativa para Ecoturismo y Aventura  
**Versión:** 2.0 (Consolidada)  
**Estado:** Aprobado para Diseño y Desarrollo

---

## 1. Introducción y Alcance Funcional

El presente documento consolida la especificación formal de los **15 Requisitos Funcionales Críticos (RF-01 al RF-15)** de **Ecoflow Suite**. Estos requisitos representan el núcleo operativo y transaccional del sistema, organizados a través de los ocho procesos del negocio, garantizando la trazabilidad integral desde la captación del cliente hasta la liquidación final y retroalimentación post-servicio.

### Estructura de los Procesos Transaccionales
1. **P1:** Registro del perfil del cliente y restricciones de salud
2. **P2:** Registro y cotización de reservas de tours
3. **P3:** Programación y asignación de itinerarios y guías
4. **P4:** Registro e inventario de equipamiento de campo
5. **P5:** Emisión de órdenes de servicio a proveedores (Transporte / Restaurantes)
6. **P6:** Registro de control de asistencia y check-in en campo
7. **P7:** Registro de incidentes y reprogramación de rutas en tiempo real
8. **P8:** Cierre de tour, cobro de servicios adicionales y encuesta de satisfacción

---

## 2. Especificación Detallada por Proceso Transaccional

### Proceso 1: Registro del perfil del cliente y restricciones de salud

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-01** |
| **Nombre** | Autogestión de ficha médica y deslinde legal |
| **Descripción** | El sistema debe generar y remitir automáticamente un enlace web tokenizado y seguro al cliente titular tras confirmarse una reserva (vía correo electrónico y/o WhatsApp), permitiendo a cada pasajero registrar antecedentes de salud, alergias, requerimientos dietéticos y la firma digital del deslinde legal sin requerir usuario ni contraseña. |
| **Rol / Actor** | Cliente / Turista (interacción directa) - Sistema (generación y despacho) |
| **Regla de Negocio** | *RN-1.1:* Todo pasajero individual debe contar con su ficha médica completada y deslinde firmado antes del inicio del tour; el enlace tokenizado caduca al momento de comenzar la salida programada. |
| **Criterio de Verificación** | Envío comprobable del enlace en menos de 10 segundos tras la confirmación de la reserva. Almacenamiento íntegro de la declaración jurada y estatus del pasajero actualizado a *Ficha Médica Completada*. |

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-02** |
| **Nombre** | Bloqueo automático por incompatibilidad médica y alerta |
| **Descripción** | El sistema debe contrastar de forma automática las afecciones médicas registradas por el turista frente a la matriz de exigencia física del tour reservado, bloqueando la confirmación de pasajeros que presenten condiciones excluyentes (ej. cardiopatías en rafting) y generando una alerta prioritaria en el panel del Coordinador de Operaciones. |
| **Rol / Actor** | Sistema (evaluación algorítmica) - Coordinador de Operaciones (atención de alertas) |
| **Regla de Negocio** | *RN-1.2:* Si un cliente declara una condición catalogada como excluyente en el catálogo maestro del tour, el sistema impide su asignación a la salida e impide la emisión del voucher de abordaje hasta la intervención manual del coordinador. |
| **Criterio de Verificación** | Caso de prueba con turista declarando afección cardíaca para un tour de clase IV: el sistema cambia el estado del pasajero a *Bloqueado por Riesgo* y despliega una notificación de alta prioridad en la bandeja operativa del coordinador. |

---

### Proceso 2: Registro y cotización de reservas de tours

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-03** |
| **Nombre** | Validación de aforos y cotización automatizada |
| **Descripción** | El sistema debe calcular el monto total de la cotización en función de las tarifas base del tour, tipo de servicio (privado/compartido), cantidad desglosada de pasajeros (adultos y niños) y adicionales contratados, verificando en tiempo real la disponibilidad de cupos e impidiendo reservas que superen la capacidad máxima configurada en el catálogo. |
| **Rol / Actor** | Coordinador de Operaciones / Recepción - Sistema |
| **Regla de Negocio** | *RN-2.1:* No se puede confirmar una reserva si la cantidad de pasajeros excede el aforo disponible. Las cotizaciones en borrador cuentan con un plazo de vigencia parametrizado; superado este tiempo sin abono de seña, los cupos retenidos se liberan de forma automática. |
| **Criterio de Verificación** | Intento de reserva para 10 pasajeros en una salida con solo 8 cupos disponibles: el sistema rechaza la confirmación con el mensaje de error *Capacidad máxima excedida* e impide el registro del anticipo. |

---

### Proceso 3: Programación y asignación de itinerarios y guías

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-04** |
| **Nombre** | Asignación de guías sin solapamiento de horarios |
| **Descripción** | El sistema debe verificar la agenda del personal técnico y bloquear de forma estricta cualquier intento de asignación de un guía si su rango horario de salida y retorno previsto (sumado a un margen de descanso reglamentario de mínimo 60 minutos) colisiona con otra salida ya programada. |
| **Rol / Actor** | Coordinador de Operaciones / Recepción - Sistema |
| **Regla de Negocio** | *RN-3.1:* Bloqueo atómico de concurrencia: ningún guía puede poseer dos salidas simultáneas o consecutivas sin respetar el intervalo mínimo de reposo y traslado operativo. |
| **Criterio de Verificación** | Intento de programar a un guía en una salida de 14:00 a 18:00 teniendo ya asignada una salida que finaliza a las 13:30 del mismo día: el sistema bloquea la asignación y lista únicamente al personal con disponibilidad comprobada. |

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-05** |
| **Nombre** | Control de ratios de seguridad guía/turista |
| **Descripción** | El sistema debe validar que la cantidad de guías asignados a una salida cumpla con la proporción máxima de pasajeros por guía estipulada en la ficha técnica del tour (ej. máximo 8 turistas por guía en actividades de río o kayak). |
| **Rol / Actor** | Sistema - Coordinador de Operaciones |
| **Regla de Negocio** | *RN-3.2:* Toda salida que supere el ratio reglamentario debe exigir la asignación de guías auxiliares antes de autorizar el cambio de estado de la salida a *Lista para Despacho*. |
| **Criterio de Verificación** | Salida con 16 pasajeros confirmados para actividad de río con ratio 1:8: el sistema exige al menos 2 guías asignados; si solo se asigna 1, se genera bloqueo de programación. |

---

### Proceso 4: Registro e inventario de equipamiento de campo

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-06** |
| **Nombre** | Despacho y trazabilidad serializada por código QR |
| **Descripción** | El sistema debe permitir registrar el despacho de equipos de seguridad críticos (arneses, kayaks, cascos, cuerdas) vinculándolos a una salida específica mediante la lectura óptica de su código QR individual desde la cámara de la app móvil o lector web, descontando las unidades del stock disponible. |
| **Rol / Actor** | Coordinador de Operaciones / Encargado de Bodega - Guía Turístico |
| **Regla de Negocio** | *RN-4.1:* Los equipos críticos deben estar serializados individualmente con hoja de vida digital; el despacho reduce inmediatamente el inventario operativo en almacén. |
| **Criterio de Verificación** | Escaneo secuencial de 5 arneses y 5 cascos: el sistema asigna los identificadores unívocos al manifiesto de salida y cambia su estatus de *Disponible* a *Despachado en Tour*. |

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-07** |
| **Nombre** | Bloqueo preventivo e inspección técnica de retorno |
| **Descripción** | El sistema debe rechazar el despacho de cualquier equipo cuyo estado sea *En Mantenimiento*, *Dado de Baja* o que tenga su inspección periódica vencida; asimismo, debe permitir registrar el retorno del material tras el tour mediante lectura QR, derivando automáticamente a mantenimiento preventivo/correctivo aquellos ítems con reportes de daño o desgaste. |
| **Rol / Actor** | Sistema - Coordinador de Operaciones - Guía Turístico |
| **Regla de Negocio** | *RN-4.2:* Todo equipo retornado con daño reportado pasa inmediatamente a estado *En Mantenimiento* con bloqueo informático para nuevas asignaciones hasta su liberación por el administrador. |
| **Criterio de Verificación** | Al escanear un kayak retornado y marcar *Fisura en casco*, el ítem pasa automáticamente a estado *En Mantenimiento* y queda inhabilitado para futuras asignaciones. |

---

### Proceso 5: Emisión de órdenes de servicio a proveedores (Transporte / Restaurantes)

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-08** |
| **Nombre** | Emisión con restricciones alimentarias consolidadas |
| **Descripción** | El sistema debe emitir órdenes de servicio estructuradas para transportistas y restaurantes vinculando la salida, incorporando de manera obligatoria y consolidada el desglose estricto de alergias y requerimientos dietéticos (celiacos, veganos, intolerancias) de los comensales confirmados. |
| **Rol / Actor** | Coordinador de Operaciones - Sistema |
| **Regla de Negocio** | *RN-5.1:* Toda orden para restaurantes debe congelar el consolidado de requerimientos médicos/alimentarios vigentes al momento de su generación para evitar omisiones de salud en campo. |
| **Criterio de Verificación** | Consulta de orden emitida para restaurante: se verifica la presencia de una tabla con el recuento total de comensales y el desglose nominal de pasajeros con dietas especiales y alergias severas. |

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-09** |
| **Nombre** | Confirmación de servicio en un clic (*one-click*) |
| **Descripción** | El sistema debe enviar la orden de servicio al proveedor vía correo electrónico con archivo PDF adjunto y un enlace web tokenizado accesible desde navegadores móviles, permitiendo confirmar la aceptación del servicio (*one-click*) registrando timestamp e IP sin requerir inicio de sesión ni contraseñas. |
| **Rol / Actor** | Proveedor Externo (Transportista / Restaurante) - Sistema |
| **Regla de Negocio** | *RN-5.2:* El enlace web tokenizado es de uso exclusivo para la confirmación de la orden correspondiente; su consumo actualiza el estatus de la orden a *Confirmada por Proveedor*. |
| **Criterio de Verificación** | Clic en el botón *Confirmar Servicio* desde un smartphone: la orden cambia inmediatamente de estado a *Confirmada* en el panel web de operaciones sin solicitar credenciales. |

---

### Proceso 6: Registro de control de asistencia y check-in en campo

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-10** |
| **Nombre** | Manifiesto y check-in móvil *Offline-First* |
| **Descripción** | La app móvil debe permitir al guía consultar el manifiesto de pasajeros y registrar el marcado de asistencia individual (*Presente*, *Ausente/No-Show*) en modo 100% desconectado, almacenando los datos en la base local y sincronizándolos automáticamente con el servidor al recuperar señal. |
| **Rol / Actor** | Guía Turístico (app móvil) |
| **Regla de Negocio** | *RN-6.1:* La aplicación móvil debe ser plenamente operativa sin conexión a internet, registrando marcas temporales (*timestamps*) locales inmutables para cada acción de check-in. |
| **Criterio de Verificación** | En modo avión, marcar asistencia a 12 pasajeros; al desactivar el modo avión y detectar conexión Wi-Fi/móvil, los 12 registros se sincronizan con la base central sin intervención del usuario. |

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-11** |
| **Nombre** | Validación restrictiva de ficha médica en embarque |
| **Descripción** | La app móvil debe desplegar una advertencia visual prominente de bloqueo o alerta al momento del check-in presencial si un pasajero marcado como *Presente* no cuenta con su ficha médica completada o su deslinde firmado digitalmente en el sistema. |
| **Rol / Actor** | Guía Turístico - Sistema |
| **Regla de Negocio** | *RN-6.2:* Queda prohibido el inicio de actividades de aventura a pasajeros sin deslinde firmado; la app exige regularización presencial previa al abordaje. |
| **Criterio de Verificación** | Intento de marcado de un pasajero con ficha médica pendiente: la aplicación despliega un modal de alerta en rojo advirtiendo la falta de deslinde legal y requiriendo firma o regularización. |

---

### Proceso 7: Registro de incidentes y reprogramación de rutas en tiempo real

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-12** |
| **Nombre** | Gestión de incidentes y reprogramación con aprobación remota |
| **Descripción** | La app móvil debe permitir al guía registrar contingencias operativas en ruta (factores climáticos, derrumbes, retrasos) y proponer una ruta o actividad alterna dentro del catálogo de contingencias, requiriendo la aprobación rápida del Coordinador de Operaciones en la plataforma web para recalcular el itinerario y notificar a los aliados logísticos. |
| **Rol / Actor** | Guía Turístico (reporte/propuesta) - Coordinador de Operaciones (aprobación) |
| **Regla de Negocio** | *RN-7.1:* Salvo emergencias médicas críticas, toda modificación de itinerario que implique cambios en puntos de encuentro o tiempos de comida debe ser autorizada formalmente por el Coordinador. |
| **Criterio de Verificación** | Registro de contingencia por crecida de río en la app: el Coordinador recibe notificación en tiempo real, presiona *Aprobar Ruta Alterna* y el sistema recalcula los tiempos de recogida de transportistas. |

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-13** |
| **Nombre** | Protocolo autónomo de Emergencia Médica Crítica |
| **Descripción** | La app móvil debe facultar al guía para activar el protocolo de evacuación médica inmediata sin esperar visto bueno previo de coordinación, cambiando el estado del tour a *En Emergencia* de forma instantánea y despachando alertas automáticas prioritarias a coordinación y servicios de rescate. |
| **Rol / Actor** | Guía Turístico |
| **Regla de Negocio** | *RN-7.2:* La seguridad y preservación de la vida humana prevalece sobre los controles administrativos; el guía cuenta con autonomía absoluta ante accidentes graves o emergencias médicas agudas. |
| **Criterio de Verificación** | Activación del botón *Emergencia Médica Crítica* en la app: el sistema bypassa la cola de aprobación, marca la salida como *En Emergencia* y emite alerta sonora y visual en el panel central de control. |

---

### Proceso 8: Cierre de tour, cobro de servicios adicionales y encuesta de satisfacción

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-14** |
| **Nombre** | Registro móvil de consumos adicionales a la reserva |
| **Descripción** | La app móvil debe permitir al guía registrar en ruta los servicios o insumos extraordinarios prestados a los turistas (alquiler de equipo adicional, hidratación extra, traslados privados), vinculándolos a la cuenta de la reserva del cliente y restringiendo estrictamente el cobro de dinero en efectivo por el personal en campo. |
| **Rol / Actor** | Guía Turístico |
| **Regla de Negocio** | *RN-8.1:* Los guías tienen prohibido recibir dinero en efectivo en ruta; todos los servicios consumidos se asocian digitalmente a la cuenta de la reserva para su cobro centralizado. |
| **Criterio de Verificación** | Registro de 2 bebidas energéticas y 1 alquiler de bastón para el pasajero X: la cuenta corriente de la reserva refleja un saldo deudor adicional por el valor exacto de los ítems. |

| Campo | Especificación |
| :--- | :--- |
| **Código** | **RF-15** |
| **Nombre** | Liquidación en counter, cierre y encuesta asíncrona |
| **Descripción** | El sistema debe permitir conciliar consumos en recepción, registrar el cobro final en caja y validar el retorno físico del 100% de los equipos QR para cerrar el tour, disparando de forma automática y desacoplada el envío del enlace web de encuesta de satisfacción al turista vía correo o WhatsApp. |
| **Rol / Actor** | Coordinador de Operaciones / Recepción - Sistema - Cliente |
| **Regla de Negocio** | *RN-8.2:* La salida no puede pasar a estado *Cerrada y Liquidada* si existen equipos técnicos pendientes de escaneo de retorno o si el balance financiero no se encuentra saldado en caja. El envío de la encuesta es asíncrono y su falta de respuesta no bloquea el cierre operativo. |
| **Criterio de Verificación** | Pago de saldo en counter y lectura QR de todos los equipos: la salida pasa a estado *Cerrada* y se remite automáticamente el mensaje con el enlace de encuesta al titular de la reserva. |

---

## 3. Matriz Consolidada de Requisitos Funcionales (RF-01 al RF-15)

| Código | Proceso Transaccional | Requisito Funcional (Descripción) | Rol / Usuario | Resultado Esperado |
| :---: | :--- | :--- | :--- | :--- |
| **RF-01** | P1: Registro del perfil del cliente y restricciones de salud | Generación y envío automático de enlace web tokenizado al cliente titular tras confirmar la reserva, para el llenado autogestionado de la ficha médica y firma del deslinde de responsabilidad. | Cliente / Sistema | Ficha médica y deslinde legal registrados en la base central sin requerir credenciales de usuario. |
| **RF-02** | P1: Registro del perfil del cliente y restricciones de salud | Evaluación automatizada de condiciones médicas declaradas contra la matriz de exigencia del tour, bloqueando a pasajeros con afecciones incompatibles y alertando a coordinación. | Sistema | Reserva bloqueada automáticamente ante condiciones excluyentes (ej. cardiopatía en rafting) y alerta prioritaria emitida al Coordinador. |
| **RF-03** | P2: Registro y cotización de reservas de tours | Cálculo automatizado de tarifas según pasajeros y servicios solicitados, con validación en tiempo real de aforos máximos para impedir sobrecupos. | Coordinador / Sistema | Cotización calculada con precisión y bloqueo inmediato de reservas que superen la capacidad máxima disponible. |
| **RF-04** | P3: Programación y asignación de itinerarios y guías | Asignación de guías a salidas operativas con validación estricta de no colisión de horarios y margen de descanso obligatorio. | Coordinador / Sistema | Guía agendado con itinerario congelado y bloqueo de asignaciones solapadas en el mismo rango de tiempo. |
| **RF-05** | P3: Programación y asignación de itinerarios y guías | Validación automática de cumplimiento del ratio de seguridad normativo de pasajeros por guía configurado en la ficha técnica del tour. | Sistema / Coordinador | Garantía de proporción segura (ej. 1 guía cada 8 turistas en actividades acuáticas) previa a la confirmación de la salida. |
| **RF-06** | P4: Registro e inventario de equipamiento de campo | Despacho de equipamiento técnico crítico (arneses, kayaks, cascos) mediante escaneo de códigos QR individuales con cámara móvil o lector web. | Coordinador / Guía | Unidades individualizadas y vinculadas a la salida, descontándose del stock operativo disponible en almacén. |
| **RF-07** | P4: Registro e inventario de equipamiento de campo | Bloqueo preventivo de equipos inhabilitados y registro de inspección técnica al retorno mediante lectura QR. | Sistema / Coordinador | Equipos en mantenimiento bloqueados para despacho; ítems retornados con daños derivados automáticamente a servicio técnico. |
| **RF-08** | P5: Emisión de órdenes de servicio a proveedores | Emisión automatizada de órdenes de servicio para transportistas y restaurantes con consolidado obligatorio de restricciones alimentarias y alergias. | Coordinador / Sistema | Documento estructurado emitido al aliado logístico conteniendo el desglose íntegro de requerimientos médicos y dietéticos. |
| **RF-09** | P5: Emisión de órdenes de servicio a proveedores | Remisión de órdenes mediante correo con PDF y enlace web tokenizado responsive que permita confirmación en un solo clic (*one-click*). | Proveedor Externo | Servicio confirmado por el proveedor registrando marca de tiempo e IP sin requerir inicio de sesión ni contraseñas. |
| **RF-10** | P6: Registro de control de asistencia y check-in en campo | Consulta de manifiesto de pasajeros y marcado de asistencia presencial (*Presente*, *Ausente/No-Show*) en la app móvil en modo 100% desconectado (*Offline-First*). | Guía Turístico | Asistencia registrada localmente en el dispositivo y sincronizada de forma automática con el servidor al recuperar señal. |
| **RF-11** | P6: Registro de control de asistencia y check-in en campo | Despliegue de advertencia visual restrictiva en la app móvil si se intenta marcar *Presente* a un turista que no completó o firmó su ficha médica. | Guía Turístico | Alerta visual inmediata en pantalla impidiendo el abordaje inadvertido de turistas sin deslinde legal registrado. |
| **RF-12** | P7: Registro de incidentes y reprogramación de rutas en tiempo real | Registro de contingencias en ruta (clima, bloqueos) y propuesta de desvío/ruta alterna en la app móvil, requiriendo autorización de Coordinación. | Guía / Coordinador | Notificación inmediata al panel web del Coordinador para su aprobación rápida y recálculo automático de órdenes a proveedores. |
| **RF-13** | P7: Registro de incidentes y reprogramación de rutas en tiempo real | Activación directa y autónoma del Protocolo de Emergencia Médica Crítica en la app móvil sin requerir aprobación remota previa. | Guía Turístico | Salida puesta en estado *En Emergencia* de forma instantánea, notificando en paralelo a coordinación y servicios de rescate. |
| **RF-14** | P8: Cierre de tour, cobro de servicios adicionales y encuesta de satisfacción | Registro en ruta de consumos extraordinarios (equipo extra, traslados) en la app móvil cargados a la cuenta de la reserva, prohibiendo cobro en efectivo. | Guía Turístico | Saldos adicionales vinculados con precisión a la cuenta del pasajero para su cobro formal posterior. |
| **RF-15** | P8: Cierre de tour, cobro de servicios adicionales y encuesta de satisfacción | Liquidación financiera de adicionales en caja de recepción, validación de retorno de equipos QR para cierre de tour y despacho asíncrono de encuesta de satisfacción. | Coordinador / Sistema | Cuenta saldada en recepción, tour cerrado operativamente e invitación a encuesta web enviada por correo/WhatsApp al turista. |
