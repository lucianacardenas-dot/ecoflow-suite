// =============================================================================
// EcoFlow Suite - Controlador Principal Frontend (SPA)
// =============================================================================
import { authService } from './services/authService.js';
import { toursService, reservasService } from './services/reservasService.js';
import { guiasService, salidasService } from './services/salidasService.js';
import { equiposService } from './services/equiposService.js';
import { proveedoresService } from './services/proveedoresService.js';
import { asistenciaService } from './services/asistenciaService.js';
import { incidentesService } from './services/incidentesService.js';
import { consumosService } from './services/consumosService.js';
import { auditoriaService } from './services/auditoriaService.js';

class AppController {
  constructor() {
    this.currentUser = null;
    this.currentView = 'dashboard';
    this.init();
  }

  async init() {
    this.bindEvents();
    this.checkSession();
  }

  // ---------------------------------------------------------------------------
  // 1. MANEJO DE SESIÓN Y AUTENTICACIÓN (RC-01, RBAC)
  // ---------------------------------------------------------------------------
  checkSession() {
    const user = authService.getCurrentUser();
    const overlay = document.getElementById('login-overlay');
    
    if (user && authService.isAuthenticated()) {
      this.currentUser = user;
      overlay.style.display = 'none';
      this.applyUserRoleUI();
      this.loadDashboardData();
    } else {
      overlay.style.display = 'flex';
    }
  }

  applyUserRoleUI() {
    if (!this.currentUser) return;

    // Actualizar avatar y nombres en sidebar
    document.getElementById('current-user-avatar').textContent = this.currentUser.nombres.charAt(0);
    document.getElementById('current-user-name').textContent = this.currentUser.nombres;
    document.getElementById('current-user-role').textContent = `Rol: ${this.currentUser.rol}`;

    // Filtrar elementos de navegación según la Matriz RBAC (Escenario 3)
    const userRole = this.currentUser.rol.toLowerCase();
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item, .sidebar-nav .nav-section-title');

    navItems.forEach(el => {
      const allowedRoles = el.getAttribute('data-roles');
      if (allowedRoles) {
        const rolesList = allowedRoles.split(',').map(r => r.trim().toLowerCase());
        if (!rolesList.includes(userRole)) {
          el.style.display = 'none';
        } else {
          el.style.display = 'flex';
        }
      }
    });

    // Si el rol es guía, por defecto llevarlo al módulo de campo
    if (userRole === 'guia') {
      this.switchView('asistencia');
    } else {
      this.switchView('dashboard');
    }
  }

  // ---------------------------------------------------------------------------
  // 2. ENLACE DE EVENTOS DE INTERFAZ
  // ---------------------------------------------------------------------------
  bindEvents() {
    // Selector de roles en modal de login
    const rolePills = document.querySelectorAll('.role-pill');
    rolePills.forEach(pill => {
      pill.addEventListener('click', () => {
        rolePills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        document.getElementById('login-email').value = pill.getAttribute('data-email');
      });
    });

    // Formulario de login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const alertBox = document.getElementById('login-alert');

      try {
        const res = await authService.login(email, pass);
        alertBox.style.display = 'none';
        this.currentUser = res.usuario;
        document.getElementById('login-overlay').style.display = 'none';
        this.applyUserRoleUI();
        this.loadDashboardData();
      } catch (err) {
        this.displayAlert(
          'login-alert',
          'login-alert-title',
          'login-alert-msg',
          err,
          'danger'
        );
      }
    });

    // Cerrar sesión
    document.getElementById('btn-logout').addEventListener('click', () => {
      authService.logout();
      window.location.reload();
    });

    // Navegación Sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        if (targetView) {
          this.switchView(targetView);
        }
      });
    });

    // P1: Ficha Médica
    document.getElementById('form-ficha-medica').addEventListener('submit', (e) => this.handleFichaSubmit(e));

    // P2: Cotización y Reservas
    document.getElementById('res-tour-select').addEventListener('change', () => this.updateCotizacionPreview());
    document.getElementById('res-cantidad').addEventListener('input', () => this.updateCotizacionPreview());
    document.getElementById('res-tipo-servicio').addEventListener('change', () => this.updateCotizacionPreview());
    document.getElementById('form-nueva-reserva').addEventListener('submit', (e) => this.handleReservaSubmit(e));

    // P3: Salidas y Guías
    document.getElementById('form-nueva-salida').addEventListener('submit', (e) => this.handleSalidaSubmit(e));

    // P4: Equipos QR
    document.getElementById('btn-despachar-equipo').addEventListener('click', () => this.handleDespachoEquipo());

    // P5: Órdenes Proveedores
    document.getElementById('form-nueva-orden').addEventListener('submit', (e) => this.handleOrdenSubmit(e));

    // P7: Incidentes y Botón SOS
    document.getElementById('form-nuevo-incidente').addEventListener('submit', (e) => this.handleIncidenteSubmit(e));
    document.getElementById('btn-activar-sos').addEventListener('click', () => this.handleSOSClick());

    // P8: Consumos y Liquidación
    document.getElementById('form-nuevo-consumo').addEventListener('submit', (e) => this.handleConsumoSubmit(e));
    document.getElementById('btn-liquidar-pago').addEventListener('click', () => this.handleLiquidarPago());
    document.getElementById('btn-cerrar-tour').addEventListener('click', () => this.handleCerrarSalida());
  }

  // ---------------------------------------------------------------------------
  // 3. CAMBIO DE VISTAS Y CARGA REACTIVA DE DATOS
  // ---------------------------------------------------------------------------
  switchView(viewName) {
    this.currentView = viewName;

    // Actualizar clases activas en sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Actualizar secciones de vista
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Actualizar título en topbar
    const titles = {
      dashboard: 'Dashboard General & Métricas Operativas',
      'ficha-medica': 'P1: Autogestión de Ficha Médica y Salud (RF-01, RF-02)',
      reservas: 'P2: Cotización y Registro de Reservas (RF-03)',
      salidas: 'P3: Programación de Salidas y Asignación de Guías (RF-04, RF-05)',
      equipos: 'P4: Inventario Serializado y Despacho QR (RF-06, RF-07)',
      proveedores: 'P5: Órdenes de Servicio a Proveedores (RF-08, RF-09)',
      asistencia: 'P6: Check-in y Manifiesto Móvil en Campo (RF-10, RF-11)',
      incidentes: 'P7: Contingencias Operativas y Protocolo SOS (RF-12, RF-13)',
      cierre: 'P8: Consumos en Ruta, Cobro en Counter y Cierre (RF-14, RF-15)',
      auditoria: 'Auditoría del Sistema - Bitácora Inmutable (RC-02)'
    };
    document.getElementById('page-current-title').textContent = titles[viewName] || 'EcoFlow Suite';

    // Cargar datos correspondientes a la vista
    switch (viewName) {
      case 'dashboard': this.loadDashboardData(); break;
      case 'ficha-medica': this.loadFichaMedicaView(); break;
      case 'reservas': this.loadReservasView(); break;
      case 'salidas': this.loadSalidasView(); break;
      case 'equipos': this.loadEquiposView(); break;
      case 'proveedores': this.loadProveedoresView(); break;
      case 'asistencia': this.loadAsistenciaView(); break;
      case 'incidentes': this.loadIncidentesView(); break;
      case 'cierre': this.loadCierreView(); break;
      case 'auditoria': this.loadAuditoriaView(); break;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. FUNCIONES DE CARGA Y LOGICA POR VISTA
  // ---------------------------------------------------------------------------

  // DASHBOARD
  async loadDashboardData() {
    try {
      const [salidas, reservas, equipos] = await Promise.all([
        salidasService.getSalidas(),
        reservasService.getReservas(),
        equiposService.getEquipos()
      ]);

      document.getElementById('kpi-salidas-count').textContent = salidas.length;
      document.getElementById('kpi-reservas-count').textContent = reservas.length;
      document.getElementById('kpi-equipos-count').textContent = equipos.length;

      const tbody = document.getElementById('dashboard-salidas-tbody');
      tbody.innerHTML = '';

      if (salidas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay salidas registradas.</td></tr>`;
        return;
      }

      salidas.forEach(s => {
        const tr = document.createElement('tr');
        const badgeClass = s.estado === 'en_emergencia' ? 'badge-danger' : (s.estado === 'cerrada' ? 'badge-info' : 'badge-success');
        tr.innerHTML = `
          <td><strong>${s.id}</strong></td>
          <td>${s.tour_nombre || 'Excursión'}</td>
          <td>${s.fecha}</td>
          <td>${s.hora_salida} - ${s.hora_retorno}</td>
          <td><span class="badge ${badgeClass}">${s.estado.toUpperCase()}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.app.switchView('asistencia')">Ver Manifiesto</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error cargando Dashboard:', err);
    }
  }

  // P1: FICHA MÉDICA
  async loadFichaMedicaView() {
    try {
      const paxs = await asistenciaService.getPasajeros();
      const select = document.getElementById('ficha-pax-select');
      select.innerHTML = '';
      paxs.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.token_ficha;
        opt.textContent = `${p.nombres} (${p.dni_pasaporte || 'Sin DNI'}) - Estado: ${p.estado_ficha}`;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async handleFichaSubmit(e) {
    e.preventDefault();
    const token = document.getElementById('ficha-pax-select').value;
    const datos = {
      antecedentes_salud: document.getElementById('ficha-antecedentes').value,
      alergias: document.getElementById('ficha-alergias').value,
      requerimiento_dietetico: document.getElementById('ficha-dieta').value,
      contacto_emergencia_nombre: document.getElementById('ficha-contacto-nom').value,
      contacto_emergencia_telefono: document.getElementById('ficha-contacto-tel').value,
      deslinde_firmado: document.getElementById('ficha-deslinde-chk').checked
    };

    try {
      await reservasService.guardarFichaMedica(token, datos);
      this.displayAlert('ficha-alert', 'ficha-alert-title', 'ficha-alert-msg', {
        mensaje: 'Ficha médica y deslinde legal registrados satisfactoriamente. Pasajero marcado como APTO.'
      }, 'success');
      this.loadFichaMedicaView();
    } catch (err) {
      this.displayAlert('ficha-alert', 'ficha-alert-title', 'ficha-alert-msg', err, 'danger');
    }
  }

  // P2: COTIZACIÓN Y RESERVAS
  async loadReservasView() {
    try {
      const tours = await toursService.getTours();
      const select = document.getElementById('res-tour-select');
      select.innerHTML = '';
      tours.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.nombre} ($${t.precio_base} USD - Máx: ${t.capacidad_maxima} pax)`;
        opt.setAttribute('data-precio', t.precio_base);
        opt.setAttribute('data-max', t.capacidad_maxima);
        select.appendChild(opt);
      });

      this.updateCotizacionPreview();

      const reservas = await reservasService.getReservas();
      const tbody = document.getElementById('reservas-tbody');
      tbody.innerHTML = '';
      if (reservas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No hay reservas registradas.</td></tr>`;
        return;
      }

      reservas.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.codigo_reserva}</strong></td>
          <td>${r.tour_nombre || r.tour_id}</td>
          <td>${r.fecha_tour}</td>
          <td>${r.cantidad_pasajeros}</td>
          <td>$${r.monto_total}</td>
          <td><strong style="color: ${r.saldo_pendiente > 0 ? '#DC2626' : '#166534'}">$${r.saldo_pendiente}</strong></td>
          <td><span class="badge ${r.estado === 'confirmada' ? 'badge-success' : 'badge-warning'}">${r.estado}</span></td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.displayAlert('reserva-alert', 'reserva-alert-title', 'reserva-alert-msg', err, 'danger');
    }
  }

  updateCotizacionPreview() {
    const select = document.getElementById('res-tour-select');
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption) return;

    const precioBase = Number(selectedOption.getAttribute('data-precio') || 0);
    const cantidad = Number(document.getElementById('res-cantidad').value || 1);
    const tipo = document.getElementById('res-tipo-servicio').value;
    const factor = tipo === 'privado' ? 1.25 : 1.0;
    const total = cantidad * (precioBase * factor);

    document.getElementById('cotizacion-total-preview').textContent = `$${total.toFixed(2)} USD`;
  }

  async handleReservaSubmit(e) {
    e.preventDefault();

    // Validación de formulario en cliente (Escenario 4)
    const dni = document.getElementById('res-dni').value.trim();
    const nombres = document.getElementById('res-nombres').value.trim();
    const email = document.getElementById('res-email').value.trim();
    const cantidad = document.getElementById('res-cantidad').value;

    if (!dni || !nombres || !email || !cantidad) {
      this.displayAlert('reserva-alert', 'reserva-alert-title', 'reserva-alert-msg', {
        error: {
          codigo: 'VALIDACION_CLIENTE_VACIO',
          mensaje: 'Por favor complete todos los campos obligatorios del formulario antes de enviar.',
          detalles: [{ campo: 'todos', mensaje: 'Campos requeridos' }]
        }
      }, 'danger');
      return;
    }

    const payload = {
      clienteData: {
        dni_pasaporte: dni,
        nombres: nombres,
        apellidos: '',
        email: email,
        telefono: document.getElementById('res-telefono').value
      },
      tourId: document.getElementById('res-tour-select').value,
      fechaTour: document.getElementById('res-fecha').value,
      cantidadPasajeros: cantidad,
      tipoServicio: document.getElementById('res-tipo-servicio').value
    };

    try {
      const res = await reservasService.crearReserva(payload);
      this.displayAlert('reserva-alert', 'reserva-alert-title', 'reserva-alert-msg', {
        mensaje: `¡Reserva ${res.reserva.codigo_reserva} creada y confirmada exitosamente! Total: $${res.reserva.monto_total}`
      }, 'success');
      this.loadReservasView();
    } catch (err) {
      // Manejo y despliegue del error 409 de sobrecupo (Escenario 2)
      this.displayAlert('reserva-alert', 'reserva-alert-title', 'reserva-alert-msg', err, 'danger');
    }
  }

  // P3: SALIDAS Y GUÍAS
  async loadSalidasView() {
    try {
      const [tours, guias, salidas] = await Promise.all([
        toursService.getTours(),
        guiasService.getGuias(),
        salidasService.getSalidas()
      ]);

      const tourSelect = document.getElementById('salida-tour-select');
      tourSelect.innerHTML = '';
      tours.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.nombre;
        tourSelect.appendChild(opt);
      });

      const guiaSelect = document.getElementById('salida-guia-select');
      guiaSelect.innerHTML = '';
      guias.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `${g.nombres} - Licencia: ${g.codigo_licencia} (${g.especialidad})`;
        guiaSelect.appendChild(opt);
      });

      const tbody = document.getElementById('salidas-tbody');
      tbody.innerHTML = '';
      salidas.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${s.id}</strong></td>
          <td>${s.tour_nombre || s.tour_id}</td>
          <td>${s.fecha}</td>
          <td>${s.hora_salida} - ${s.hora_retorno}</td>
          <td><span class="badge ${s.estado === 'cerrada' ? 'badge-info' : 'badge-success'}">${s.estado}</span></td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.displayAlert('salida-alert', 'salida-alert-title', 'salida-alert-msg', err, 'danger');
    }
  }

  async handleSalidaSubmit(e) {
    e.preventDefault();
    const datos = {
      tourId: document.getElementById('salida-tour-select').value,
      fecha: document.getElementById('salida-fecha').value,
      horaSalida: document.getElementById('salida-hora-inicio').value,
      horaRetorno: document.getElementById('salida-hora-fin').value,
      guiaId: document.getElementById('salida-guia-select').value
    };

    try {
      await salidasService.crearSalida(datos);
      this.displayAlert('salida-alert', 'salida-alert-title', 'salida-alert-msg', {
        mensaje: 'Salida operativa programada y guía técnico asignado exitosamente.'
      }, 'success');
      this.loadSalidasView();
    } catch (err) {
      // Manejo de colisión horaria (Error 409)
      this.displayAlert('salida-alert', 'salida-alert-title', 'salida-alert-msg', err, 'danger');
    }
  }

  // P4: EQUIPOS QR
  async loadEquiposView() {
    try {
      const [salidas, equipos] = await Promise.all([
        salidasService.getSalidas(),
        equiposService.getEquipos()
      ]);

      const select = document.getElementById('despacho-salida-select');
      select.innerHTML = '';
      salidas.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.id}: ${s.tour_nombre || 'Tour'} (${s.fecha})`;
        select.appendChild(opt);
      });

      const tbody = document.getElementById('equipos-tbody');
      tbody.innerHTML = '';
      equipos.forEach(eq => {
        const tr = document.createElement('tr');
        const badge = eq.estado === 'disponible' ? 'badge-success' : (eq.estado === 'en_mantenimiento' ? 'badge-danger' : 'badge-warning');
        tr.innerHTML = `
          <td><strong>${eq.codigo_qr}</strong></td>
          <td>${eq.tipo_equipo}</td>
          <td>${eq.marca_modelo}</td>
          <td><span class="badge ${badge}">${eq.estado.toUpperCase()}</span></td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.displayAlert('equipo-alert', 'equipo-alert-title', 'equipo-alert-msg', err, 'danger');
    }
  }

  async handleDespachoEquipo() {
    const salidaId = document.getElementById('despacho-salida-select').value;
    const qr = document.getElementById('despacho-qr-input').value.trim();

    try {
      await equiposService.despacharEquipo(salidaId, qr);
      this.displayAlert('equipo-alert', 'equipo-alert-title', 'equipo-alert-msg', {
        mensaje: `¡Equipo ${qr} despachado exitosamente a la salida ${salidaId}!`
      }, 'success');
      this.loadEquiposView();
    } catch (err) {
      this.displayAlert('equipo-alert', 'equipo-alert-title', 'equipo-alert-msg', err, 'danger');
    }
  }

  // P5: ÓRDENES A PROVEEDORES
  async loadProveedoresView() {
    try {
      const [salidas, proveedores, ordenes] = await Promise.all([
        salidasService.getSalidas(),
        proveedoresService.getProveedores(),
        proveedoresService.getOrdenes()
      ]);

      const salidaSelect = document.getElementById('orden-salida-select');
      salidaSelect.innerHTML = '';
      salidas.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.id}: ${s.tour_nombre || 'Salida'}`;
        salidaSelect.appendChild(opt);
      });

      const provSelect = document.getElementById('orden-proveedor-select');
      provSelect.innerHTML = '';
      proveedores.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.razon_social} (${p.tipo_servicio.toUpperCase()})`;
        provSelect.appendChild(opt);
      });

      const tbody = document.getElementById('ordenes-tbody');
      tbody.innerHTML = '';
      ordenes.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${o.numero_orden}</strong></td>
          <td>${o.proveedor_nombre || o.proveedor_id}</td>
          <td>${o.total_comensales_pax} pax</td>
          <td><small>${o.resumen_dietas}</small></td>
          <td><span class="badge ${o.estado === 'confirmada' ? 'badge-success' : 'badge-warning'}">${o.estado.toUpperCase()}</span></td>
          <td>
            ${o.estado === 'emitida' ? `<button class="btn btn-secondary btn-sm" onclick="window.app.confirmarOrdenOneClick('${o.id}')">Simular One-Click</button>` : 'Confirmada ✓'}
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.displayAlert('proveedor-alert', 'proveedor-alert-title', 'proveedor-alert-msg', err, 'danger');
    }
  }

  async handleOrdenSubmit(e) {
    e.preventDefault();
    const datos = {
      salidaId: document.getElementById('orden-salida-select').value,
      proveedorId: document.getElementById('orden-proveedor-select').value,
      totalPax: document.getElementById('orden-pax').value,
      resumenDietas: document.getElementById('orden-dietas').value
    };

    try {
      await proveedoresService.emitirOrden(datos);
      this.displayAlert('proveedor-alert', 'proveedor-alert-title', 'proveedor-alert-msg', {
        mensaje: 'Orden emitida exitosamente y enlace web tokenizado enviado al proveedor aliado.'
      }, 'success');
      this.loadProveedoresView();
    } catch (err) {
      this.displayAlert('proveedor-alert', 'proveedor-alert-title', 'proveedor-alert-msg', err, 'danger');
    }
  }

  async confirmarOrdenOneClick(ordenId) {
    try {
      await proveedoresService.confirmarOrdenOneClick(ordenId);
      this.displayAlert('proveedor-alert', 'proveedor-alert-title', 'proveedor-alert-msg', {
        mensaje: '¡Orden de servicio confirmada por el proveedor mediante enlace tokenizado One-Click!'
      }, 'success');
      this.loadProveedoresView();
    } catch (err) {
      this.displayAlert('proveedor-alert', 'proveedor-alert-title', 'proveedor-alert-msg', err, 'danger');
    }
  }

  // P6: CHECK-IN Y ASISTENCIA (RF-10, RF-11)
  async loadAsistenciaView() {
    try {
      const paxs = await asistenciaService.getPasajeros();
      const asistencias = await asistenciaService.getAsistencias('sal-1');

      const tbody = document.getElementById('manifiesto-tbody');
      tbody.innerHTML = '';

      paxs.forEach(p => {
        const asist = asistencias.find(a => a.pasajero_id === p.id);
        const tr = document.createElement('tr');
        
        const badgeFicha = p.estado_ficha === 'completada' ? 'badge-success' : (p.estado_ficha === 'bloqueada_riesgo' ? 'badge-danger' : 'badge-warning');
        const badgeAsist = asist ? (asist.estado_asistencia === 'presente' ? 'badge-success' : 'badge-danger') : 'badge-info';

        tr.innerHTML = `
          <td><strong>${p.nombres}</strong></td>
          <td>${p.dni_pasaporte || 'N/A'}</td>
          <td><span class="badge ${badgeFicha}">${p.estado_ficha.toUpperCase()}</span></td>
          <td><span class="badge ${badgeAsist}">${asist ? asist.estado_asistencia.toUpperCase() : 'PENDIENTE'}</span></td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="window.app.marcarCheckin('${p.id}')">Marcar Presente</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.displayAlert('asistencia-alert', 'asistencia-alert-title', 'asistencia-alert-msg', err, 'danger');
    }
  }

  async marcarCheckin(pasajeroId) {
    const isOffline = document.getElementById('chk-offline-mode').checked;
    try {
      await asistenciaService.marcarAsistencia('sal-1', pasajeroId, 'presente', isOffline);
      this.displayAlert('asistencia-alert', 'asistencia-alert-title', 'asistencia-alert-msg', {
        mensaje: `Check-in confirmado para el pasajero (${isOffline ? 'Modo Offline: Almacenado localmente' : 'Sincronizado'}).`
      }, 'success');
      this.loadAsistenciaView();
    } catch (err) {
      // Advertencia restrictiva por falta de ficha médica / deslinde (RF-11)
      this.displayAlert('asistencia-alert', 'asistencia-alert-title', 'asistencia-alert-msg', err, 'danger');
    }
  }

  // P7: INCIDENTES Y SOS (RF-12, RF-13)
  async loadIncidentesView() {
    try {
      const [salidas, incidentes] = await Promise.all([
        salidasService.getSalidas(),
        incidentesService.getIncidentes()
      ]);

      const select = document.getElementById('inc-salida-select');
      select.innerHTML = '';
      salidas.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.id}: ${s.tour_nombre || 'Tour'}`;
        select.appendChild(opt);
      });

      const tbody = document.getElementById('incidentes-tbody');
      tbody.innerHTML = '';
      incidentes.forEach(inc => {
        const tr = document.createElement('tr');
        const badgeSev = inc.severidad === 'critica_sos' ? 'badge-danger' : 'badge-warning';
        tr.innerHTML = `
          <td><small>${new Date(inc.reportado_en).toLocaleTimeString()}</small></td>
          <td>${inc.salida_id}</td>
          <td>${inc.tipo_incidente}</td>
          <td><span class="badge ${badgeSev}">${inc.severidad.toUpperCase()}</span></td>
          <td>${inc.descripcion}</td>
          <td><span class="badge ${inc.estado_aprobacion === 'aprobada' ? 'badge-success' : 'badge-warning'}">${inc.estado_aprobacion}</span></td>
          <td>
            ${inc.estado_aprobacion === 'pendiente' ? `<button class="btn btn-secondary btn-sm" onclick="window.app.aprobarIncidente('${inc.id}')">Aprobar Ruta Alterna</button>` : 'Atendido ✓'}
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      this.displayAlert('incidente-alert', 'incidente-alert-title', 'incidente-alert-msg', err, 'danger');
    }
  }

  async handleIncidenteSubmit(e) {
    e.preventDefault();
    const salidaId = document.getElementById('inc-salida-select').value;
    const tipo = document.getElementById('inc-tipo-select').value;
    const desc = document.getElementById('inc-descripcion').value;
    const ruta = document.getElementById('inc-ruta-alterna').value;

    try {
      await incidentesService.reportarIncidente(salidaId, tipo, 'moderada', desc, ruta);
      this.displayAlert('incidente-alert', 'incidente-alert-title', 'incidente-alert-msg', {
        mensaje: 'Contingencia en ruta registrada. Notificación enviada a Coordinación para aprobación remota.'
      }, 'success');
      this.loadIncidentesView();
    } catch (err) {
      this.displayAlert('incidente-alert', 'incidente-alert-title', 'incidente-alert-msg', err, 'danger');
    }
  }

  async handleSOSClick() {
    if (!confirm('¿CONFIRMA ACTIVAR EL PROTOCOLO DE EMERGENCIA MÉDICA CRÍTICA (SOS)? Esta acción bypassa autorizaciones y cambia el tour a EN_EMERGENCIA.')) {
      return;
    }
    try {
      const res = await incidentesService.activarEmergenciaMedicaSOS('sal-1', 'Turista con traumatismo severo en rápidos. Despacho de helicóptero y ambulancia solicitado.');
      this.displayAlert('incidente-alert', 'incidente-alert-title', 'incidente-alert-msg', res, 'danger');
      this.loadIncidentesView();
      this.loadDashboardData();
    } catch (err) {
      this.displayAlert('incidente-alert', 'incidente-alert-title', 'incidente-alert-msg', err, 'danger');
    }
  }

  async aprobarIncidente(incId) {
    try {
      await incidentesService.aprobarContingencia(incId);
      this.displayAlert('incidente-alert', 'incidente-alert-title', 'incidente-alert-msg', {
        mensaje: 'Propuesta de ruta alterna aprobada por Coordinación. Órdenes recalculadas.'
      }, 'success');
      this.loadIncidentesView();
    } catch (err) {
      this.displayAlert('incidente-alert', 'incidente-alert-title', 'incidente-alert-msg', err, 'danger');
    }
  }

  // P8: CIERRE, CONSUMOS Y LIQUIDACIÓN
  async loadCierreView() {
    try {
      const reservas = await reservasService.getReservas();
      const selConsumo = document.getElementById('consumo-reserva-select');
      const selLiquidar = document.getElementById('liquidar-reserva-select');

      selConsumo.innerHTML = '';
      selLiquidar.innerHTML = '';

      reservas.forEach(r => {
        const opt1 = document.createElement('option');
        opt1.value = r.id;
        opt1.textContent = `${r.codigo_reserva} (Saldo: $${r.saldo_pendiente})`;
        selConsumo.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = r.id;
        opt2.textContent = `${r.codigo_reserva} - Saldo deudor: $${r.saldo_pendiente} USD`;
        selLiquidar.appendChild(opt2);
      });
    } catch (err) {
      this.displayAlert('cierre-alert', 'cierre-alert-title', 'cierre-alert-msg', err, 'danger');
    }
  }

  async handleConsumoSubmit(e) {
    e.preventDefault();
    const reservaId = document.getElementById('consumo-reserva-select').value;
    const desc = document.getElementById('consumo-desc').value;
    const cant = document.getElementById('consumo-cantidad').value;
    const precio = document.getElementById('consumo-precio').value;

    try {
      await consumosService.registrarConsumoRuta('sal-1', reservaId, desc, cant, precio);
      this.displayAlert('cierre-alert', 'cierre-alert-title', 'cierre-alert-msg', {
        mensaje: `Consumo extraordinario ($${cant * precio}) cargado a la reserva. Cobro en efectivo prohibido en campo (RN-8.1).`
      }, 'success');
      this.loadCierreView();
      this.loadReservasView();
    } catch (err) {
      this.displayAlert('cierre-alert', 'cierre-alert-title', 'cierre-alert-msg', err, 'danger');
    }
  }

  async handleLiquidarPago() {
    const reservaId = document.getElementById('liquidar-reserva-select').value;
    const monto = document.getElementById('liquidar-monto').value;
    const metodo = document.getElementById('liquidar-metodo').value;

    try {
      const res = await consumosService.registrarCobroLiquidacion(reservaId, monto, metodo, 'COUNTER-LIQ-001');
      this.displayAlert('cierre-alert', 'cierre-alert-title', 'cierre-alert-msg', {
        mensaje: `¡Pago de $${monto} registrado exitosamente! Saldo restante: $${res.saldoRestante}`
      }, 'success');
      this.loadCierreView();
    } catch (err) {
      this.displayAlert('cierre-alert', 'cierre-alert-title', 'cierre-alert-msg', err, 'danger');
    }
  }

  async handleCerrarSalida() {
    try {
      const res = await consumosService.cerrarSalidaOperativa('sal-1');
      this.displayAlert('cierre-alert', 'cierre-alert-title', 'cierre-alert-msg', res, 'success');
      this.loadDashboardData();
    } catch (err) {
      // Bloqueo si hay equipos pendientes de retorno (RN-8.2)
      this.displayAlert('cierre-alert', 'cierre-alert-title', 'cierre-alert-msg', err, 'danger');
    }
  }

  // AUDITORÍA
  async loadAuditoriaView() {
    try {
      const logs = await auditoriaService.getLogs();
      const tbody = document.getElementById('auditoria-tbody');
      tbody.innerHTML = '';
      logs.reverse().forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><small>${new Date(log.creado_en).toLocaleString()}</small></td>
          <td><strong>${log.usuario_nombre || 'Sistema'}</strong></td>
          <td><code>${log.accion}</code></td>
          <td>${log.tabla_afectada}</td>
          <td><small>${log.ip_origen}</small></td>
          <td><span class="badge ${log.resultado === 'EXITO' ? 'badge-success' : 'badge-danger'}">${log.resultado}</span></td>
          <td><small>${log.detalles}</small></td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. HELPER PARA MOSTRAR MENSAJES DE ERROR / ÉXITO (API_CONTRATO.md)
  // ---------------------------------------------------------------------------
  displayAlert(containerId, titleId, msgId, errorObj, type = 'danger') {
    const container = document.getElementById(containerId);
    const titleEl = document.getElementById(titleId);
    const msgEl = document.getElementById(msgId);

    if (!container) return;

    container.className = `alert-box alert-${type}`;
    container.style.display = 'flex';

    if (type === 'success') {
      titleEl.textContent = 'Operación Exitosa';
      msgEl.textContent = errorObj.mensaje || 'Datos procesados correctamente.';
      return;
    }

    // Formato estructurado API_CONTRATO.md
    if (errorObj.error) {
      titleEl.textContent = `[${errorObj.error.codigo || 'ERROR'}]: ${errorObj.error.mensaje || 'Error en la petición'}`;
      let detalles = '';
      if (errorObj.error.detalles && Array.isArray(errorObj.error.detalles)) {
        detalles = errorObj.error.detalles.map(d => `• ${d.campo}: ${d.mensaje}`).join('<br>');
      }
      msgEl.innerHTML = detalles || errorObj.error.mensaje;
    } else {
      titleEl.textContent = 'Aviso del Sistema';
      msgEl.textContent = errorObj.mensaje || JSON.stringify(errorObj);
    }
  }
}

// Inicializar la aplicación y exponer en window para botones onclick
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
