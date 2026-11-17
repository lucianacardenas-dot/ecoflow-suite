# Mapa de Navegación del Prototipo

**Proyecto:** EcoFlow Suite (Ecotrack Manager)  
**Sistema:** Plataforma Integral de Gestión Logística y Operativa para Ecoturismo y Aventura  
**Versión:** 1.0  
**Fecha:** Noviembre 2026  

---

## 1. Diagrama de Flujo de Navegación (Mermaid)

El siguiente diagrama modela el flujo de navegación entre pantallas según el rol del usuario autenticado y los enlaces públicos tokenizados:

```mermaid
flowchart LR
    Login["Inicio de Sesión\n(Selección de Rol)"] --> Dashboard["Dashboard Principal\n(KPIs & Métricas en Vivo)"]
    
    Dashboard --> P1["P1: Ficha Médica &\nDeslinde Legal"]
    Dashboard --> P2["P2: Cotización &\nReservas de Tours"]
    Dashboard --> P3["P3: Programación de Salidas\ny Asignación de Guías"]
    Dashboard --> P4["P4: Inventario &\nDespacho QR"]
    Dashboard --> P5["P5: Órdenes de Servicio\na Proveedores"]
    Dashboard --> P6["P6: Check-in y Manifiesto\nOffline en Campo"]
    Dashboard --> P7["P7: Incidentes y\nReprogramación en Ruta"]
    Dashboard --> P8["P8: Cierre, Cobro Counter\ny Encuesta"]

    subgraph Enlaces_Publicos ["Acceso Tokenizado Público (Sin Login)"]
        TokenCliente["Ficha Médica Cliente\n(/fichas-medicas/{token})"]
        TokenProveedor["Confirmación Proveedor\n(/ordenes-servicio/confirmar/{token})"]
    end

    subgraph Modulo_Admin ["Solo Administrador"]
        Auditoria["Consulta de Auditoría\n(Bitácora Inmutable)"]
        Usuarios["Gestión de Usuarios y Roles"]
    end

    Dashboard --> Auditoria
    Dashboard --> Usuarios
    P2 -.->|Genera Enlace| TokenCliente
    P5 -.->|Genera Enlace| TokenProveedor
```

---

## 2. Tabla Detallada por Pantalla

| Pantalla | Archivo / Vista | Se accede desde | Roles Autorizados | Endpoints que Consume |
| :--- | :--- | :--- | :--- | :--- |
| **Inicio de Sesión** | `index.html#login` | Carga inicial | Público | `GET /usuarios`, simulación token |
| **Dashboard** | `index.html#dashboard` | Menú lateral / Login | Administrador, Coordinador, Guía | `GET /salidas`, `GET /reservas`, `GET /equipos` |
| **P1: Ficha Médica & Deslinde** | `index.html#ficha-medica` | Dashboard / Enlace público | Cliente, Coordinador | `GET /pasajeros`, `GET /fichas_medicas`, `POST /fichas_medicas` |
| **P2: Cotización y Reservas** | `index.html#reservas` | Menú lateral / Dashboard | Administrador, Coordinador | `GET /tours`, `GET /reservas`, `POST /reservas` |
| **P3: Salidas y Guías** | `index.html#salidas` | Menú lateral / Dashboard | Administrador, Coordinador | `GET /tours`, `GET /guias`, `GET /salidas`, `POST /salidas` |
| **P4: Inventario QR** | `index.html#equipos` | Menú lateral / Dashboard | Administrador, Coordinador, Guía | `GET /equipos`, `POST /despachos_equipos`, `PATCH /equipos/{id}` |
| **P5: Órdenes a Proveedores** | `index.html#proveedores` | Menú lateral / Dashboard | Administrador, Coordinador | `GET /proveedores`, `GET /ordenes_servicio`, `POST /ordenes_servicio`, `PATCH /ordenes_servicio/{id}` |
| **P6: Check-in y Manifiesto** | `index.html#asistencia` | Menú lateral / Dashboard | Coordinador, Guía | `GET /salidas`, `GET /pasajeros`, `POST /asistencias` |
| **P7: Incidentes y Emergencia SOS** | `index.html#incidentes` | Menú lateral / Dashboard | Coordinador, Guía | `GET /salidas`, `GET /incidentes`, `POST /incidentes`, `PATCH /salidas/{id}` |
| **P8: Cierre, Cobro y Encuesta** | `index.html#cierre` | Menú lateral / Dashboard | Administrador, Coordinador, Guía | `GET /reservas`, `GET /consumos_adicionales`, `POST /consumos_adicionales`, `POST /pagos_liquidacion`, `PATCH /salidas/{id}` |
| **Auditoría del Sistema** | `index.html#auditoria` | Menú lateral | Solo Administrador | `GET /auditoria` |
