# ANALISIS_PROYECTO.md - Análisis de Problemática y Solución

**Proyecto:** EcoFlow Suite (Ecotrack Manager)  
**Integrantes:**
- Ayala días Fabricio Hernan
- Cardenas Velasquez Luciana Thilma
- Casanova Mamani Javier Alonso

**Herramienta de IA Utilizada:** GEMINI  
**Sector Socioproductivo:** Ecoturismo y Turismo de Aventura

---

## 1. Problemática Operativa Seleccionada
**Caos operativo en la personalización, reserva y ejecución de itinerarios dinámicos para agencias de ecoturismo.**

El problema central es la ineficiencia operativa y la falta de sincronización en tiempo real en la gestión de itinerarios turísticos dinámicos y de aventura. Debido a que el ecoturismo depende de variables altamente cambiantes e incontrolables (factores climáticos, condiciones físicas de los clientes, retrasos en transporte y variaciones de última hora), las agencias carecen de un mecanismo ágil y centralizado para adaptar los itinerarios de forma inmediata, lo que provoca desorganización logística, errores de comunicación y pérdidas económicas.

---

## 2. Actores Afectados
- **Clientes / Turistas:** Sufren retrasos, desinformación sobre exigencias físicas y malas experiencias o riesgos de salud.
- **Personal Interno (Coordinadores y Guías):** Coordinadores estresados por llamadas de emergencia y guías con agendas duplicadas (*overbooking*), sobrecarga y falta de información médica oportuna.
- **Proveedores Externos (Transportistas y Restaurantes):** Reciben datos erróneos, cambios no notificados o cancelaciones fuera de tiempo.

---

## 3. Estado Actual del Proceso
Se ejecuta de forma manual y descentralizada:
- Los datos del cliente llegan por correo electrónico o mensajería informal.
- La planificación y tarifas se calculan en hojas de cálculo (Excel).
- La disponibilidad de guías y equipamiento técnico se anota en pizarras físicas.
- La coordinación en ruta se gestiona improvisando mediante grupos de WhatsApp.

---

## 4. Principales Dificultades Detectadas
- **Efecto dominó:** Si cambia una actividad por factores climáticos, no se liberan automáticamente los equipos ni se avisa a tiempo al transporte ni al restaurante.
- **Riesgos de salud y legales:** Los guías no se enteran a tiempo de alergias médicas críticas ni cuentan con los deslindes legales firmados antes del embarque.
- **Fugas de dinero:** Los servicios e insumos adicionales pedidos en ruta por los turistas no se registran formalmente ni se cobran al finalizar el tour.
- **Sobrecupo y solapamiento (*overbooking*):** Colisión en agendas de guías sin respetar intervalos de descanso reglamentarios.

---

## 5. Solución de Software Propuesta
Desarrollo de **EcoFlow Suite (Ecotrack Manager)**, una aplicación web y móvil transaccional organizada en **8 procesos interconectados**:
1. **P1:** Registro del perfil del cliente y restricciones de salud (Ficha médica autogestionada y evaluación de compatibilidad).
2. **P2:** Registro y cotización de reservas de tours (Control estricto de aforos y tarifas dinámicas).
3. **P3:** Programación y asignación de itinerarios y guías (Prevención de colisión horaria y control de ratio 1:8).
4. **P4:** Registro e inventario de equipamiento de campo (Trazabilidad unitaria con código QR individual).
5. **P5:** Emisión de órdenes de servicio a proveedores (Consolidado de alergias y confirmación *one-click*).
6. **P6:** Registro de control de asistencia y check-in en campo (Modo *Offline-First* y advertencia de deslinde).
7. **P7:** Registro de incidentes y reprogramación de rutas (Aprobación remota y botón SOS de emergencia médica).
8. **P8:** Cierre de tour, cobro de adicionales y encuesta de satisfacción (Liquidación en counter y encuesta desacoplada).
