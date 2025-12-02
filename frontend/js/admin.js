// Admin page interactions with API integration
document.addEventListener("DOMContentLoaded", async () => {
  // Verificar si el usuario es admin antes de cargar la página
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Debes iniciar sesión para acceder al panel de administración');
    window.location.href = '../index.html';
    return;
  }

  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    if (tokenPayload.rol !== 'admin') {
      alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
      window.location.href = '../index.html';
      return;
    }
  } catch (error) {
    console.error('Error al verificar el rol:', error);
    alert('Error de autenticación. Por favor, inicie sesión nuevamente.');
    window.location.href = '../index.html';
    return;
  }

  // Actualizar el email del admin
  const adminMailElement = document.querySelector('.admin-mail');
  if (adminMailElement) {
    adminMailElement.textContent = JSON.parse(atob(token.split('.')[1])).email;
  }

  // Configurar logout
  const logoutButton = document.querySelector('.admin-logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      apiClient.logout();
      window.location.href = '../index.html';
    });
  }

  // Tabs switching
  const panels = document.querySelectorAll(".section-panel");
  const segs = document.querySelectorAll("#adminTabs .seg");
  segs.forEach((btn)=>{
    btn.addEventListener("click", ()=>{
      segs.forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const target = btn.getAttribute("data-target");
      panels.forEach(p=>{
        const on = p.getAttribute("data-panel")===target;
        p.classList.toggle("is-hidden", !on);
      });

      // Cargar datos según la pestaña activa
      switch(target) {
        case 'reservas':
          cargarReservas();
          break;
        case 'boletas':
          cargarBoletas();
          break;
        case 'servicios':
          cargarServicios();
          break;
        case 'productos':
          cargarProductos();
          break;
      }
    });
  });

  // Variables para almacenar los datos originales y los filtros
  let reservasOriginales = [];

  // Cargar datos en cada sección
  function cargarReservas() {
    adminApiClient.getAllReservas()
      .then(data => {
        // Almacenar las reservas originales para usar en filtrado
        reservasOriginales = data.reservas;

        // Inicializar años disponibles en el filtro
        inicializarAnios(reservasOriginales);

        // Aplicar filtros y mostrar resultados
        aplicarFiltros();
      })
      .catch(error => {
        console.error('Error al cargar reservas:', error);
        // Cargar datos alternativos para pruebas si la API falla
        const tableBody = document.querySelector('#resTable tbody');
        tableBody.innerHTML = '<tr><td colspan="7">Error al cargar las reservas. Verifique la conexión con el servidor.</td></tr>';
      });
  }

  // Función para inicializar los años disponibles en el filtro
  function inicializarAnios(reservas) {
    const aniosSelect = document.getElementById('filterAnio');
    if (!aniosSelect) return;

    // Limpiar opciones existentes (excepto la primera)
    aniosSelect.innerHTML = '<option value="">Todos</option>';

    // Obtener años únicos de las reservas
    const anios = [...new Set(reservas.map(reserva => {
      const fecha = new Date(reserva.fecha);
      return fecha.getFullYear();
    }))].sort((a, b) => b - a);

    // Agregar opciones al select
    anios.forEach(anio => {
      const option = document.createElement('option');
      option.value = anio;
      option.textContent = anio;
      aniosSelect.appendChild(option);
    });
  }

  // Función para aplicar los filtros
  function aplicarFiltros() {
    const fechaFiltro = document.getElementById('filterFecha').value;
    const mesFiltro = document.getElementById('filterMes').value;
    const anioFiltro = document.getElementById('filterAnio').value;
    const estadoFiltro = document.getElementById('filterEstado').value;

    // Filtrar las reservas originales
    let reservasFiltradas = reservasOriginales.filter(reserva => {
      // Filtrar por fecha exacta
      if (fechaFiltro) {
        const fechaReserva = formatDateForDisplay(reserva.fecha).split('T')[0]; // Formato YYYY-MM-DD
        if (fechaReserva !== fechaFiltro) {
          return false;
        }
      }

      // Filtrar por mes
      if (mesFiltro) {
        const fecha = new Date(reserva.fecha);
        const mesReserva = String(fecha.getMonth() + 1).padStart(2, '0');
        if (mesReserva !== mesFiltro) {
          return false;
        }
      }

      // Filtrar por año
      if (anioFiltro) {
        const fecha = new Date(reserva.fecha);
        const anioReserva = fecha.getFullYear();
        if (anioReserva != anioFiltro) {
          return false;
        }
      }

      // Filtrar por estado
      if (estadoFiltro) {
        if (reserva.estado.toLowerCase() !== estadoFiltro.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    // Mostrar las reservas filtradas
    mostrarReservas(reservasFiltradas);
  }

  // Función para mostrar las reservas en la tabla
  function mostrarReservas(reservas) {
    const tableBody = document.querySelector('#resTable tbody');
    tableBody.innerHTML = '';

    if (reservas.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7">No se encontraron reservas con los filtros aplicados.</td></tr>';
      return;
    }

    // Ordenar las reservas filtradas por fecha y hora (como en la ordenación previa)
    reservas.sort((a, b) => {
      // Primero por fecha
      if (a.fecha < b.fecha) return -1;
      if (a.fecha > b.fecha) return 1;
      // Luego por hora
      if (a.hora < b.hora) return -1;
      if (a.hora > b.hora) return 1;
      return 0;
    });

    reservas.forEach(reserva => {
      // Formatear el teléfono
      let telefonoFormateado = '<span class="no-phone">No registrado</span>';
      if (reserva.telefono && reserva.telefono.trim() !== '' && reserva.telefono !== 'N/A') {
        // Extraer solo dígitos del teléfono
        const cleanPhone = reserva.telefono.replace(/\D/g, '');
        if (cleanPhone.length >= 9) {
          // Tomar los últimos 9 dígitos y formatear como XXX XXX XXX
          const phone9Digits = cleanPhone.slice(-9);
          telefonoFormateado = `${phone9Digits.slice(0, 3)} ${phone9Digits.slice(3, 6)} ${phone9Digits.slice(6, 9)}`;
        } else {
          // Si no tiene suficientes dígitos, mostrar como está
          telefonoFormateado = reserva.telefono;
        }
      }

      const row = document.createElement('tr');
      // Format date to display without timezone conversion
      const formattedDate = formatDateForDisplay(reserva.fecha);
      row.innerHTML = `
        <td>${reserva.cliente_nombre || reserva.cliente_id}</td>
        <td>${telefonoFormateado}</td>
        <td>${reserva.servicio_nombre || reserva.servicio_id}</td>
        <td>${formattedDate}</td>
        <td>${reserva.hora}</td>
        <td class="status"><span class="chip ${getEstadoClass(reserva.estado)}">${reserva.estado}</span></td>
        <td class="actions">
          <button class="ab ab-blue" data-status="en proceso" data-reserva-id="${reserva.id}" title="En proceso">⏱</button>
          <button class="ab ab-green" data-status="completada" data-reserva-id="${reserva.id}" title="Finalizada">✔</button>
          <button class="ab ab-red" data-status="cancelada" data-reserva-id="${reserva.id}" title="Cancelado">✖</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  function cargarServicios() {
    adminApiClient.getAllServicios()
      .then(data => {
        const grid = document.getElementById('svcGrid');
        grid.innerHTML = '';
        data.servicios.forEach(servicio => {
          const card = document.createElement('article');
          card.className = 'svc-card';
          card.innerHTML = `
            <div class="svc-actions">
              <button class="ab ab-amber" data-edit-service data-servicio-id="${servicio.id}" title="Editar">✎</button>
              <button class="ab ab-red" data-del-service data-servicio-id="${servicio.id}" title="Eliminar">🗑</button>
            </div>
            <h4>${servicio.nombre}</h4>
            <p>Precio: <span class="price">S/ ${servicio.precio.toLocaleString('es-PE')}</span></p>
            <p>Duración: ${servicio.duracion} min</p>
          `;
          grid.appendChild(card);
        });
      })
      .catch(error => {
        console.error('Error al cargar servicios:', error);
      });
  }

  function cargarBoletas() {
    adminApiClient.getAllBoletas()
      .then(data => {
        const tableBody = document.querySelector('#ticketTable tbody');
        tableBody.innerHTML = '';

        if (!data || !data.boletas || data.boletas.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7">No hay boletas registradas aún</td></tr>';
          return;
        }

        data.boletas.forEach(boleta => {
          // Format date to display without timezone conversion
          const formattedDate = formatDateForDisplay(boleta.fecha);
          const dateOnly = formattedDate.split('T')[0];

          // Mostrar ítems detallados o genérico
          let itemsDisplay = 'Producto/Servicio';
          if (boleta.items_detalle && boleta.items_detalle.trim() !== '' && boleta.items_detalle !== 'Sin items') {
            itemsDisplay = boleta.items_detalle;
          } else if (boleta.items_count > 0) {
            itemsDisplay = `${boleta.items_count} item(s)`;
          }

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${boleta.id}</td>
            <td>${boleta.cliente_nombre || boleta.cliente_id}</td>
            <td>${dateOnly}</td>
            <td>${itemsDisplay}</td>
            <td>S/ ${boleta.total.toLocaleString('es-PE')}</td>
            <td class="status"><span class="chip chip-clickable ${getEstadoPagoClass(boleta.estado_pago)}" data-ticket-id="${boleta.id}" data-current-status="${boleta.estado_pago}">${boleta.estado_pago}</span></td>
            <td class="actions">
              <button class="ab ab-blue" title="Descargar">⬇</button>
              <button class="ab ab-amber" data-edit-ticket data-ticket-id="${boleta.id}" title="Editar">✎</button>
              <button class="ab ab-red" data-del-ticket data-ticket-id="${boleta.id}" title="Eliminar">🗑</button>
            </td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Error al cargar boletas:', error);
        const tableBody = document.querySelector('#ticketTable tbody');
        tableBody.innerHTML = '<tr><td colspan="7">Error al cargar las boletas. Verifique la conexión con el servidor.</td></tr>';
      });
  }

  function cargarProductos() {
    adminApiClient.getAllProductos()
      .then(data => {
        const tableBody = document.querySelector('#prodTable tbody');
        tableBody.innerHTML = '';
        data.productos.forEach(producto => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.categoria}</td>
            <td>S/ ${producto.precio.toLocaleString('es-PE')}</td>
            <td><span class="chip chip-green">${producto.stock} unidades</span></td>
            <td class="actions">
              <button class="ab ab-amber" data-edit-product data-producto-id="${producto.id}" title="Editar">✎</button>
              <button class="ab ab-red" data-del-product data-producto-id="${producto.id}" title="Eliminar">🗑</button>
            </td>
          `;
          tableBody.appendChild(row);
        });
      })
      .catch(error => {
        console.error('Error al cargar productos:', error);
      });
  }

  function getEstadoClass(estado) {
    switch(estado) {
      case 'completada': return 'chip-green';
      case 'en proceso': return 'chip-blue';
      case 'cancelada': return 'chip-red';
      default: return 'chip-yellow';
    }
  }

  function getEstadoPagoClass(estado_pago) {
    switch(estado_pago) {
      case 'pagado': return 'chip-green';
      case 'pendiente': return 'chip-yellow';
      case 'rechazado': return 'chip-red';
      default: return 'chip-yellow';
    }
  }

  // Function to format date correctly for display
  function formatDateForDisplay(dateString) {
    // If the dateString is already in YYYY-MM-DD format, return as is
    if (dateString && dateString.includes('-') && !dateString.includes('T')) {
      return dateString;
    }
    // If it's in ISO format (with time), convert to local date string
    if (dateString && dateString.includes('T')) {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if date parsing fails
      }
      // Format as YYYY-MM-DD to match the original format in the database
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Return original if no formatting is needed
    return dateString || '';
  }

  // Eventos para los filtros de reservas
  document.getElementById('applyFilters')?.addEventListener('click', aplicarFiltros);

  document.getElementById('clearFechaFilter')?.addEventListener('click', () => {
    document.getElementById('filterFecha').value = '';
    aplicarFiltros();
  });

  document.getElementById('clearAllFilters')?.addEventListener('click', () => {
    document.getElementById('filterFecha').value = '';
    document.getElementById('filterMes').value = '';
    document.getElementById('filterAnio').value = '';
    document.getElementById('filterEstado').value = '';
    aplicarFiltros();
  });

  // También aplicar filtro cuando se cambia cualquiera de los selects
  document.getElementById('filterMes')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterAnio')?.addEventListener('change', aplicarFiltros);
  document.getElementById('filterEstado')?.addEventListener('change', aplicarFiltros);

  // Eventos para actualizar estados de reservas
  document.getElementById('resTable')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-status][data-reserva-id]');
    if (btn) {
      const estado = btn.getAttribute('data-status');
      const reservaId = btn.getAttribute('data-reserva-id');

      try {
        await adminApiClient.updateReservaEstado(reservaId, estado);
        cargarReservas(); // Recargar la tabla
      } catch (error) {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar el estado de la reserva');
      }
    }
  });

  // Eventos para servicios
  document.getElementById('btnAddService')?.addEventListener('click', () => {
    document.getElementById('csName').value = '';
    document.getElementById('csPrice').value = '';
    document.getElementById('csDur').value = '';
    document.getElementById('csDescripcion').value = '';
    document.querySelector('#createServiceModal').classList.add('open');
    document.querySelector('#createServiceModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  // Formulario para crear servicio
  document.getElementById('createServiceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('csName').value.trim();
    const precio = parseFloat(document.getElementById('csPrice').value);
    const duracion = parseInt(document.getElementById('csDur').value);
    const descripcion = document.getElementById('csDescripcion').value.trim();

    if (!nombre || !precio || !duracion) {
      alert('Completa todos los campos requeridos (nombre, precio y duración)');
      return;
    }

    try {
      const servicioData = { nombre, precio, duracion };
      if (descripcion) servicioData.descripcion = descripcion;

      await adminApiClient.createServicio(servicioData);

      // Cerrar modal
      document.querySelector('#createServiceModal').classList.remove('open');
      document.querySelector('#createServiceModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Limpiar formulario
      document.getElementById('csName').value = '';
      document.getElementById('csPrice').value = '';
      document.getElementById('csDur').value = '';
      document.getElementById('csDescripcion').value = '';

      cargarServicios(); // Recargar la lista
      alert('Servicio creado exitosamente');
    } catch (error) {
      console.error('Error al crear servicio:', error);
      alert('Error al crear el servicio: ' + (error.message || 'Error desconocido'));
    }
  });

  // Formulario para editar servicio
  document.getElementById('editServiceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editingId = document.getElementById('editServiceForm').dataset.editingId;
    if (!editingId) {
      alert('Error: No se encontró el ID del servicio para editar');
      return;
    }

    const nombre = document.getElementById('esName').value.trim();
    const precio = parseFloat(document.getElementById('esPrice').value);
    const duracion = parseInt(document.getElementById('esDur').value);
    const descripcion = document.getElementById('esDescripcion').value.trim();
    const activo = parseInt(document.getElementById('esActivo').value);

    if (!nombre || !precio || !duracion) {
      alert('Completa todos los campos requeridos (nombre, precio y duración)');
      return;
    }

    try {
      const servicioData = {
        nombre,
        precio,
        duracion,
        activo
      };
      if (descripcion) servicioData.descripcion = descripcion;

      await adminApiClient.updateServicio(editingId, servicioData);

      // Cerrar modal
      document.querySelector('#editServiceModal').classList.remove('open');
      document.querySelector('#editServiceModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Limpiar dataset
      delete document.getElementById('editServiceForm').dataset.editingId;

      cargarServicios(); // Recargar la lista
      alert('Servicio actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      alert('Error al actualizar el servicio: ' + (error.message || 'Error desconocido'));
    }
  });

  document.getElementById('svcGrid')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit-service]');
    if (editBtn) {
      const servicioId = editBtn.getAttribute('data-servicio-id');

      try {
        // Obtener los datos actuales del servicio
        const response = await fetch(`${adminApiClient.baseURL}/servicios/${servicioId}`, {
          method: 'GET',
          headers: adminApiClient.getHeaders()
        });

        if (response.ok) {
          const servicioData = await response.json();
          const servicio = servicioData.servicio;

          // Llenar el formulario de edición con los datos actuales
          document.getElementById('esName').value = servicio.nombre;
          document.getElementById('esPrice').value = servicio.precio;
          document.getElementById('esDur').value = servicio.duracion;
          document.getElementById('esDescripcion').value = servicio.descripcion || '';
          document.getElementById('esActivo').value = servicio.activo ? '1' : '0';

          // Guardar el ID del servicio que se está editando en el formulario
          document.getElementById('editServiceForm').dataset.editingId = servicioId;

          // Abrir el modal de edición
          document.querySelector('#editServiceModal').classList.add('open');
          document.querySelector('#editServiceModal').setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        } else {
          alert('Error al cargar los datos del servicio para editar');
        }
      } catch (error) {
        console.error('Error al editar servicio:', error);
        alert('Error al editar el servicio: ' + (error.message || 'Error desconocido'));
      }
    }

    const delBtn = e.target.closest('[data-del-service]');
    if (delBtn) {
      const servicioId = delBtn.getAttribute('data-servicio-id');
      if (confirm(`¿Eliminar permanentemente servicio #${servicioId}? Esta acción no se puede deshacer.`)) {
        try {
          console.log(`Intentando eliminar permanentemente servicio con ID: ${servicioId}`);
          const result = await adminApiClient.deleteServicio(servicioId);
          console.log('Resultado de eliminación:', result);

          // Recargar la lista para reflejar el cambio
          await cargarServicios();
          alert(`Servicio #${servicioId} eliminado permanentemente`);
        } catch (error) {
          console.error('Error al eliminar servicio:', error);
          let errorMessage = error.message || 'Error desconocido';
          if (error.error) {
            errorMessage += ` - Detalles: ${error.error}`;
          }
          alert(`Error al eliminar el servicio #${servicioId}: ${errorMessage}`);
        }
      }
    }
  });

  // CREAR BOLETA: Variables y funciones para el formulario de creación
  let createTicketItems = [];

  function updateCreateTicketItemList() {
    const list = document.getElementById('ctItemList');
    list.innerHTML = '';

    let total = 0;
    createTicketItems.forEach(item => {
      total += item.precio;

      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <span>${item.descripcion}</span>
        <span class="list-price">S/ ${item.precio.toLocaleString('es-PE')}</span>
        <button class="ab ab-red ab-sm" type="button" data-remove-create-item="${item.id}" title="Eliminar">✖</button>
      `;
      list.appendChild(li);
    });

    // Actualizar total
    const totalInput = document.getElementById('ctTotal');
    if (totalInput && (totalInput.value === '' || totalInput.value.startsWith('S/'))) {
      totalInput.value = `S/ ${total.toLocaleString('es-PE')}`;
    }
  }

  // EDITAR BOLETA: Variables y funciones para el formulario de edición
  let editTicketItems = [];

  function updateEditTicketItemList() {
    const list = document.getElementById('etItemList');
    list.innerHTML = '';

    let total = 0;
    editTicketItems.forEach(item => {
      total += item.precio || (item.precio_unitario * item.cantidad) || 0;

      const li = document.createElement('li');
      li.className = 'list-item';
      const precio = item.precio || (item.precio_unitario && item.cantidad ? item.precio_unitario * item.cantidad : item.subtotal) || 0;
      li.innerHTML = `
        <span>${item.descripcion}</span>
        <span class="list-price">S/ ${precio.toLocaleString('es-PE')}</span>
        <button class="ab ab-red ab-sm" type="button" data-remove-edit-item="${item.id}" title="Eliminar">✖</button>
      `;
      list.appendChild(li);
    });

    // Actualizar total automáticamente (siempre que no esté bloqueado por input)
    const totalInput = document.getElementById('etTotal');
    if (totalInput) {
      // Solo actualizar si no está siendo editado manualmente (no tiene focus)
      if (document.activeElement !== totalInput) {
        totalInput.value = total;
      }
      // Actualizar el dataset para indicar que el total está basado en items
      totalInput.dataset.calculatedFromItems = total;
    }
  }

  // Evento para agregar items en el formulario de edición
  document.getElementById('btnAddEditItem')?.addEventListener('click', () => {
    const desc = document.getElementById('etItemDesc').value.trim();
    const price = parseFloat(document.getElementById('etItemPrice').value);

    if (!desc || !price) {
      alert('Completa la descripción y el precio del item');
      return;
    }

    const item = {
      id: Date.now(), // ID temporal para el formulario
      descripcion: desc,
      precio: price
    };

    editTicketItems.push(item);
    updateEditTicketItemList();

    // Limpiar campos
    document.getElementById('etItemDesc').value = '';
    document.getElementById('etItemPrice').value = '';
  });

  // Evento para eliminar items en el formulario de edición
  document.getElementById('etItemList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-edit-item]');
    if (btn) {
      const itemId = parseInt(btn.getAttribute('data-remove-edit-item'));
      editTicketItems = editTicketItems.filter(item => item.id !== itemId);
      updateEditTicketItemList();
    }
  });

  // Evento para detectar cuándo el usuario edita manualmente el total
  document.getElementById('etTotal')?.addEventListener('focus', (e) => {
    e.target.dataset.manualInput = 'true';
  });

  document.getElementById('etTotal')?.addEventListener('blur', (e) => {
    // Al salir del campo, calcular el total basado en items si se desea
    // O dejar que el usuario mantenga su valor editado
    e.target.dataset.manualInput = 'false';
  });

  // Evento para el botón "Añadir Boleta" - abre modal de creación
  document.getElementById('btnAddTicket')?.addEventListener('click', () => {
    // Limpiar el formulario de creación
    document.getElementById('ctClient').value = '';
    document.getElementById('ctItemDesc').value = '';
    document.getElementById('ctItemPrice').value = '';
    document.getElementById('ctTotal').value = '';

    // Limpiar items
    createTicketItems = [];
    updateCreateTicketItemList();

    document.querySelector('#createTicketModal').classList.add('open');
    document.querySelector('#createTicketModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  // Evento para agregar items en el formulario de creación
  document.getElementById('btnAddCreateItem')?.addEventListener('click', () => {
    const desc = document.getElementById('ctItemDesc').value.trim();
    const price = parseFloat(document.getElementById('ctItemPrice').value);

    if (!desc || !price) {
      alert('Completa la descripción y el precio del item');
      return;
    }

    const item = {
      id: Date.now(), // ID temporal para el formulario
      descripcion: desc,
      precio: price
    };

    createTicketItems.push(item);
    updateCreateTicketItemList();

    // Limpiar campos
    document.getElementById('ctItemDesc').value = '';
    document.getElementById('ctItemPrice').value = '';
  });

  // Evento para eliminar items en el formulario de creación
  document.getElementById('ctItemList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-create-item]');
    if (btn) {
      const itemId = parseInt(btn.getAttribute('data-remove-create-item'));
      createTicketItems = createTicketItems.filter(item => item.id !== itemId);
      updateCreateTicketItemList();
    }
  });

  // Formulario de creación de boleta
  document.getElementById('createTicketForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clienteNombre = document.getElementById('ctClient').value.trim();
    let totalInput = document.getElementById('ctTotal').value;
    // Convertir el formato monetario a número
    const total = parseFloat(totalInput.replace(/[^\d.-]/g, ''));

    if (!clienteNombre || !total || isNaN(total)) {
      alert('Completa todos los campos obligatorios y asegúrate que el total sea un número válido');
      return;
    }

    try {
      // Obtener ID del cliente
      let clienteId = 1; // ID predeterminado

      try {
        const usuariosResponse = await fetch(`${adminApiClient.baseURL}/auth/usuarios`, {
          method: 'GET',
          headers: adminApiClient.getHeaders()
        });

        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          const clienteEncontrado = usuariosData.usuarios.find(u =>
            u.nombre.toLowerCase() === clienteNombre.toLowerCase()
          );

          if (clienteEncontrado) {
            clienteId = clienteEncontrado.id;
          } else {
            // Si no se encuentra, usar el primer cliente que no sea admin
            const clienteDefault = usuariosData.usuarios.find(u => u.rol === 'cliente');
            if (clienteDefault) {
              clienteId = clienteDefault.id;
            }
          }
        }
      } catch (error) {
        console.log('No se pudo acceder a la lista de usuarios:', error.message);
      }

      const ticketData = {
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        total: total,
        estado_pago: 'pendiente',
        items: [...createTicketItems] // Enviar los items también si se implementa
      };

      // Crear boleta
      const result = await adminApiClient.createBoleta(ticketData);
      console.log('Resultado de creación:', result);

      // Cerrar modal
      document.querySelector('#createTicketModal').classList.remove('open');
      document.querySelector('#createTicketModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Limpiar formulario y items
      document.getElementById('ctClient').value = '';
      document.getElementById('ctItemDesc').value = '';
      document.getElementById('ctItemPrice').value = '';
      document.getElementById('ctTotal').value = '';
      createTicketItems = [];
      updateCreateTicketItemList();

      // Recargar tickets
      cargarBoletas();

      alert('Boleta creada exitosamente');
    } catch (error) {
      console.error('Error al crear boleta:', error);
      alert('Error al crear la boleta: ' + error.message);
    }
  });

  // Formulario de edición de boleta
  document.getElementById('editTicketForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editingId = document.getElementById('editTicketForm').dataset.editingId;
    if (!editingId) {
      alert('Error: No se encontró el ID de la boleta para editar');
      return;
    }

    const clienteNombre = document.getElementById('etClient').value.trim();
    const total = parseFloat(document.getElementById('etTotal').value);
    const estado_pago = document.getElementById('etEstadoPago').value;

    if (!clienteNombre || !total || isNaN(total) || !estado_pago) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    try {
      // Obtener ID del cliente
      let clienteId = 1; // ID predeterminado

      try {
        const usuariosResponse = await fetch(`${adminApiClient.baseURL}/auth/usuarios`, {
          method: 'GET',
          headers: adminApiClient.getHeaders()
        });

        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          const clienteEncontrado = usuariosData.usuarios.find(u =>
            u.nombre.toLowerCase() === clienteNombre.toLowerCase()
          );

          if (clienteEncontrado) {
            clienteId = clienteEncontrado.id;
          } else {
            // Si no se encuentra, usar el primer cliente que no sea admin
            const clienteDefault = usuariosData.usuarios.find(u => u.rol === 'cliente');
            if (clienteDefault) {
              clienteId = clienteDefault.id;
            }
          }
        }
      } catch (error) {
        console.log('No se pudo acceder a la lista de usuarios:', error.message);
      }

      // Preparar datos para actualización
      const updateData = {
        cliente_id: clienteId,
        cliente_nombre: clienteNombre,
        estado_pago: estado_pago,
        total: total,
        items: editTicketItems.length > 0 ? [...editTicketItems] : undefined // Enviar items si hay
      };

      console.log('Datos para actualizar boleta:', {
        editingId,
        ...updateData
      });

      // Actualizar boleta
      const result = await adminApiClient.updateBoleta(editingId, updateData);
      console.log('Resultado de actualización:', result);

      // Cerrar modal
      document.querySelector('#editTicketModal').classList.remove('open');
      document.querySelector('#editTicketModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Limpiar el dataset y items
      delete document.getElementById('editTicketForm').dataset.editingId;
      editTicketItems = [];
      updateEditTicketItemList();

      // Recargar tickets
      await cargarBoletas();
      alert('Boleta actualizada exitosamente');

    } catch (error) {
      console.error('Error al actualizar boleta:', error);
      alert('Error al actualizar la boleta: ' + error.message);
    }
  });

  // Eventos para editar, eliminar y cambiar estado de boletas
  document.getElementById('ticketTable')?.addEventListener('click', async (e) => {
    try {
      const editBtn = e.target.closest('[data-edit-ticket]');
      if (editBtn) {
        const ticketId = editBtn.getAttribute('data-ticket-id');

        try {
          // Obtener los datos actuales de la boleta
          const response = await fetch(`${adminApiClient.baseURL}/boletas/${ticketId}`, {
            method: 'GET',
            headers: adminApiClient.getHeaders()
          });

          if (response.ok) {
            const ticketData = await response.json();
            const boleta = ticketData.boleta;

            console.log('Datos de la boleta para edición:', boleta); // Para debugging

            // Llenar el formulario de edición con los datos actuales
            document.getElementById('etClient').value = boleta.cliente_nombre || boleta.cliente_id.toString();
            document.getElementById('etTotal').value = boleta.total;
            document.getElementById('etEstadoPago').value = boleta.estado_pago;

            // Guardar el ID de la boleta que se está editando en el formulario de edición
            document.getElementById('editTicketForm').dataset.editingId = ticketId;

            // Limpiar items previos
            editTicketItems = [];

            // Cargar items si existen en la boleta
            if (boleta.detalles && boleta.detalles.length > 0) {
              // Usar el array de detalles directamente
              boleta.detalles.forEach((detalle, index) => {
                editTicketItems.push({
                  id: detalle.id || (Date.now() + index), // Usar ID existente o crear uno nuevo
                  descripcion: detalle.nombre_item || detalle.descripcion,
                  cantidad: detalle.cantidad || 1,
                  precio_unitario: detalle.precio_unitario,
                  subtotal: detalle.subtotal,
                  precio: detalle.precio_unitario // Para compatibilidad con la UI
                });
              });
            } else if (boleta.items_detalle && boleta.items_detalle !== 'Sin items' && boleta.items_detalle !== 'Producto/Servicio' && boleta.items_detalle !== '1 item(s)') {
              // Retrocompatibilidad con el formato anterior
              const itemsDetalle = boleta.items_detalle;
              const items = itemsDetalle.split('; ');
              items.forEach((item, index) => {
                if (item && item !== 'Producto/Servicio' && item !== '1 item(s)') {
                  // Formato: "nombre - cantidad x S/ precio"
                  const match = item.match(/(.+?) - (\d+) x S\/ ([\d.]+)/);
                  if (match) {
                    editTicketItems.push({
                      id: Date.now() + index, // ID único
                      descripcion: match[1],
                      cantidad: parseInt(match[2]),
                      precio_unitario: parseFloat(match[3]),
                      subtotal: parseInt(match[2]) * parseFloat(match[3]), // calcular subtotal
                      precio: parseFloat(match[3]) // para compatibilidad con la UI
                    });
                  } else {
                    // Formato alternativo: "nombre - S/ precio"
                    const simpleMatch = item.match(/(.+?) - S\/ ([\d.]+)/);
                    if (simpleMatch) {
                      editTicketItems.push({
                        id: Date.now() + index,
                        descripcion: simpleMatch[1],
                        precio: parseFloat(simpleMatch[2])
                      });
                    } else {
                      editTicketItems.push({
                        id: Date.now() + index,
                        descripcion: item,
                        precio: parseFloat(item.split('S/ ')[1]) || 0
                      });
                    }
                  }
                }
              });
            }

            // Actualizar la lista de items en el formulario (esto también actualizará el total)
            updateEditTicketItemList();

            // Abrir el modal de edición
            document.querySelector('#editTicketModal').classList.add('open');
            document.querySelector('#editTicketModal').setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
          } else {
            alert('Error al cargar los datos de la boleta para editar');
          }
        } catch (error) {
          console.error('Error al editar boleta:', error);
          alert('Error al editar la boleta: ' + (error.message || 'Error desconocido'));
        }
      }

      const delBtn = e.target.closest('[data-del-ticket]');
      if (delBtn) {
        const ticketId = delBtn.getAttribute('data-ticket-id');
        if (confirm('¿Eliminar boleta?')) {
          try {
            console.log(`Intentando eliminar boleta con ID: ${ticketId}`);
            await adminApiClient.deleteBoleta(ticketId);
            console.log(`Boleta con ID ${ticketId} eliminada exitosamente`);
            cargarBoletas(); // Recargar la lista
          } catch (error) {
            console.error('Error al eliminar boleta:', error);
            alert('Error al eliminar la boleta: ' + (error.message || 'Error desconocido'));
          }
        }
      }

      // Evento para cambiar rápidamente el estado de pago
      const statusChip = e.target.closest('.chip-clickable');
      if (statusChip) {
        const ticketId = statusChip.getAttribute('data-ticket-id');
        const currentStatus = statusChip.getAttribute('data-current-status');

        // Determinar el nuevo estado (alternar entre pendiente y pagado)
        let newStatus;
        if (currentStatus === 'pendiente') {
          newStatus = 'pagado';
        } else if (currentStatus === 'pagado') {
          newStatus = 'pendiente';
        } else {
          // Para otros estados como 'rechazado', usar confirmación
          newStatus = confirm(`¿Marcar la boleta #${ticketId} como pagada?`) ? 'pagado' : currentStatus;
          if (newStatus === currentStatus) return; // Si se cancela, no hacer nada
        }

        if (newStatus !== currentStatus) {
          try {
            // Actualizar el estado de pago
            await adminApiClient.updateBoleta(ticketId, { estado_pago: newStatus });

            // Actualizar visualmente el chip
            statusChip.textContent = newStatus;
            statusChip.className = `chip chip-clickable ${getEstadoPagoClass(newStatus)}`;
            statusChip.setAttribute('data-current-status', newStatus);

            // Mostrar mensaje de confirmación
            alert(`Boleta #${ticketId} marcada como ${newStatus}`);
          } catch (error) {
            console.error('Error al actualizar estado de pago:', error);
            alert('Error al actualizar el estado de pago: ' + error.message);
          }
        }
      }
    } catch (error) {
      console.error('Error general en eventos de boleta:', error);
    }
  });

  // Eventos para productos
  document.getElementById('btnAddProduct')?.addEventListener('click', () => {
    document.getElementById('pName').value = '';
    document.getElementById('pCategory').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pStock').value = '';
    document.querySelector('#productModal').classList.add('open');
    document.querySelector('#productModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('pName').value.trim();
    const categoria = document.getElementById('pCategory').value;
    const precio = parseFloat(document.getElementById('pPrice').value);
    const stock = parseInt(document.getElementById('pStock').value);

    if (!nombre || !categoria || !precio || !stock) {
      alert('Completa todos los campos');
      return;
    }

    try {
      await adminApiClient.createProducto({ nombre, categoria, precio, stock });
      document.querySelector('#productModal').classList.remove('open');
      document.querySelector('#productModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      cargarProductos(); // Recargar la lista
    } catch (error) {
      console.error('Error al crear producto:', error);
      alert('Error al crear el producto: ' + error.message);
    }
  });

  // Formulario para editar producto
  document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editingId = document.getElementById('editProductForm').dataset.editingId;
    if (!editingId) {
      alert('Error: No se encontró el ID del producto para editar');
      return;
    }

    const nombre = document.getElementById('epName').value.trim();
    const categoria = document.getElementById('epCategory').value;
    const precio = parseFloat(document.getElementById('epPrice').value);
    const stock = parseInt(document.getElementById('epStock').value);

    if (!nombre || !categoria || !precio || !stock) {
      alert('Completa todos los campos');
      return;
    }

    try {
      const productoData = { nombre, categoria, precio, stock };

      await adminApiClient.updateProducto(editingId, productoData);

      // Cerrar modal
      document.querySelector('#editProductModal').classList.remove('open');
      document.querySelector('#editProductModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Limpiar dataset
      delete document.getElementById('editProductForm').dataset.editingId;

      cargarProductos(); // Recargar la lista
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      alert('Error al actualizar el producto: ' + error.message);
    }
  });

  document.getElementById('prodTable')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit-product]');
    if (editBtn) {
      const productoId = editBtn.getAttribute('data-producto-id');

      try {
        // Obtener los datos actuales del producto
        const response = await fetch(`${adminApiClient.baseURL}/productos/${productoId}`, {
          method: 'GET',
          headers: adminApiClient.getHeaders()
        });

        if (response.ok) {
          const productoData = await response.json();
          const producto = productoData.producto;

          // Llenar el formulario de edición con los datos actuales
          document.getElementById('epName').value = producto.nombre;
          document.getElementById('epCategory').value = producto.categoria;
          document.getElementById('epPrice').value = producto.precio;
          document.getElementById('epStock').value = producto.stock;

          // Guardar el ID del producto que se está editando en el formulario
          document.getElementById('editProductForm').dataset.editingId = productoId;

          // Abrir el modal de edición
          document.querySelector('#editProductModal').classList.add('open');
          document.querySelector('#editProductModal').setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        } else {
          alert('Error al cargar los datos del producto para editar');
        }
      } catch (error) {
        console.error('Error al editar producto:', error);
        alert('Error al editar el producto: ' + (error.message || 'Error desconocido'));
      }
    }

    const delBtn = e.target.closest('[data-del-product]');
    if (delBtn) {
      const productoId = delBtn.getAttribute('data-producto-id');
      if (confirm('¿Eliminar producto?')) {
        try {
          await adminApiClient.deleteProducto(productoId);
          cargarProductos(); // Recargar la lista
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          alert('Error al eliminar el producto: ' + error.message);
        }
      }
    }
  });

  // Botones de cierre de modal
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el || el.classList.contains('modal-overlay')) {
        const modal = el.closest('.modal');
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Si es el modal de creación de boletas, limpiar estado
        if (modal.id === 'createTicketModal') {
          document.getElementById('ctClient').value = '';
          document.getElementById('ctItemDesc').value = '';
          document.getElementById('ctItemPrice').value = '';
          document.getElementById('ctTotal').value = '';
          createTicketItems = [];
          updateCreateTicketItemList();
        }
        // Si es el modal de edición de boletas, limpiar estado
        else if (modal.id === 'editTicketModal') {
          delete document.getElementById('editTicketForm').dataset.editingId;
        }
        // Si es el modal de edición de productos, limpiar estado
        else if (modal.id === 'editProductModal') {
          delete document.getElementById('editProductForm').dataset.editingId;
        }
      }
    });
  });

  // Cargar las reservas por defecto
  cargarReservas();
});