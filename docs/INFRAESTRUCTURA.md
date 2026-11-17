# INFRAESTRUCTURA.md - Propuesta de Arquitectura Tecnológica y Base de Datos

**Proyecto:** EcoFlow Suite (Ecotrack Manager)  
**Sistema:** Plataforma Integral de Gestión Logística y Operativa para Ecoturismo y Aventura  
**Rol:** Arquitecto de Soluciones TI y Especialista en Bases de Datos  
**Fecha:** Noviembre 2026  

---

## 1. Identificación de Necesidades y Requisitos Tecnológicos

### 1.1 Requisitos de Hardware del Servidor Central
- **Cómputo (CPU):** Mínimo 2 vCPU dedicadas (arquitectura x86_64 o ARM64 Graviton) para transacciones concurrentes, generación de vouchers PDF y evaluación algorítmica de matrices médicas.
- **Memoria RAM:** Mínimo 4 GB RAM. Distribución: 1.5 GB Backend API, 1.5 GB PostgreSQL Buffer Pool, 512 MB Redis y 500 MB SO.
- **Almacenamiento:** Mínimo 40 a 50 GB SSD NVMe de alta velocidad (3,000 IOPS).
- **Rendimiento de Red:** Latencia regional < 70 ms.

### 1.2 Requisitos de Software y Entorno de Ejecución
- **Sistema Operativo:** Linux Ubuntu Server 24.04 LTS.
- **Entorno de Ejecución:** Node.js v22 LTS / Python 3.12, containerizado con Docker Compose.
- **Servidor Web y Proxy Inverso:** Nginx con terminación TLS 1.3 y rate-limiting.
- **Motor de Base de Datos Central:** **PostgreSQL 16** con soporte ACID estricto, extensiones JSONB para historiales médicos variables y tipos de datos numéricos y temporales con restricciones.
- **Caché en Memoria:** Redis 7.2 para sesiones y colas de sincronización diferida.

---

## 2. Motor de Base de Datos Seleccionado
Se selecciona **PostgreSQL 16**.
- **Justificación:** Soporte nativo para integridad referencial estricta, restricciones `CHECK`, índices únicos parciales (para prevención de overbooking y colisión de agendas), tipos de datos financieros de precisión fija (`NUMERIC(10,2)`), soporte de columnas semiestructuradas `JSONB` y alto cumplimiento del estándar ACID (RNF-08).
