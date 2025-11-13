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

  // Cargar datos en cada sección
  function cargarReservas() {
    adminApiClient.getAllReservas()
      .then(data => {
        const tableBody = document.querySelector('#resTable tbody');
        tableBody.innerHTML = '';
        data.reservas.forEach(reserva => {
          const row = document.createElement('tr');
          // Format date to display without timezone conversion
          const formattedDate = formatDateForDisplay(reserva.fecha);
          row.innerHTML = `
            <td>${reserva.cliente_nombre || reserva.cliente_id}</td>
            <td>${reserva.telefono || 'N/A'}</td>
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
      })
      .catch(error => {
        console.error('Error al cargar reservas:', error);
        // Cargar datos alternativos para pruebas si la API falla
        const tableBody = document.querySelector('#resTable tbody');
        tableBody.innerHTML = '<tr><td colspan="7">Error al cargar las reservas. Verifique la conexión con el servidor.</td></tr>';
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
          if (boleta.items_detalle && boleta.items_detalle.trim() !== '') {
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
            <td class="status"><span class="chip ${getEstadoPagoClass(boleta.estado_pago)}">${boleta.estado_pago}</span></td>
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
    document.getElementById('sName').value = '';
    document.getElementById('sPrice').value = '';
    document.getElementById('sDur').value = '';
    document.querySelector('#serviceModal').classList.add('open');
    document.querySelector('#serviceModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('serviceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('sName').value.trim();
    const precio = parseFloat(document.getElementById('sPrice').value);
    const duracion = document.getElementById('sDur').value.trim();

    if (!nombre || !precio || !duracion) {
      alert('Completa todos los campos');
      return;
    }

    try {
      await adminApiClient.createServicio({ nombre, precio, duracion });
      document.querySelector('#serviceModal').classList.remove('open');
      document.querySelector('#serviceModal').setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      cargarServicios(); // Recargar la lista
    } catch (error) {
      console.error('Error al crear servicio:', error);
      alert('Error al crear el servicio');
    }
  });

  document.getElementById('svcGrid')?.addEventListener('click', async (e) => {
    if (e.target.closest('[data-del-service]')) {
      const servicioId = e.target.closest('[data-del-service]').getAttribute('data-servicio-id');
      if (confirm('¿Eliminar servicio?')) {
        try {
          await adminApiClient.deleteServicio(servicioId);
          cargarServicios(); // Recargar la lista
        } catch (error) {
          console.error('Error al eliminar servicio:', error);
          alert('Error al eliminar el servicio');
        }
      }
    }
  });

  // Eventos para boletas
  document.getElementById('btnAddTicket')?.addEventListener('click', () => {
    // Limpiar el formulario
    document.getElementById('tClient').value = '';
    document.getElementById('tItemDesc').value = '';
    document.getElementById('tItemPrice').value = '';
    document.getElementById('tTotal').value = '';
    document.getElementById('tItemList').innerHTML = '';
    
    document.querySelector('#ticketModal').classList.add('open');
    document.querySelector('#ticketModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
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
      alert('Error al crear el producto');
    }
  });

  // Agregar items a la boleta en el formulario
  let ticketItems = [];
  document.getElementById('btnAddItem')?.addEventListener('click', () => {
    const desc = document.getElementById('tItemDesc').value.trim();
    const price = parseFloat(document.getElementById('tItemPrice').value);
    
    if (!desc || !price) {
      alert('Completa la descripción y el precio del item');
      return;
    }
    
    const item = {
      id: Date.now(), // ID temporal para el formulario
      descripcion: desc,
      precio: price
    };
    
    ticketItems.push(item);
    updateTicketItemList();
    
    // Limpiar campos
    document.getElementById('tItemDesc').value = '';
    document.getElementById('tItemPrice').value = '';
  });

  function updateTicketItemList() {
    const list = document.getElementById('tItemList');
    list.innerHTML = '';
    
    let total = 0;
    ticketItems.forEach(item => {
      total += item.precio;
      
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <span>${item.descripcion}</span>
        <span class="list-price">S/ ${item.precio.toLocaleString('es-PE')}</span>
        <button class="ab ab-red ab-sm" type="button" data-remove-item="${item.id}" title="Eliminar">✖</button>
      `;
      list.appendChild(li);
    });
    
    // Actualizar total
    const totalInput = document.getElementById('tTotal');
    if (totalInput.value === '' || totalInput.value.startsWith('S/')) {
      totalInput.value = `S/ ${total.toLocaleString('es-PE')}`;
    }
  }
  
  // Evento para eliminar items de la lista
  document.getElementById('tItemList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-item]');
    if (btn) {
      const itemId = parseInt(btn.getAttribute('data-remove-item'));
      ticketItems = ticketItems.filter(item => item.id !== itemId);
      updateTicketItemList();
    }
  });

  // Formulario de boleta (simplificado para manejar creación y edición)
  document.getElementById('ticketForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const clienteNombre = document.getElementById('tClient').value.trim();
    let totalInput = document.getElementById('tTotal').value;
    // Convertir el formato monetario a número
    const total = parseFloat(totalInput.replace(/[^\d.-]/g, ''));
    
    if (!clienteNombre || !total || isNaN(total)) {
      alert('Completa todos los campos obligatorios y asegúrate que el total sea un número válido');
      return;
    }
    
    // Verificar si estamos editando o creando
    const editingId = document.getElementById('ticketForm').dataset.editingId;
    
    if (editingId) {
      // Estamos editando - obtener el estado de pago del combobox si está disponible
      const estadoSelect = document.getElementById('estadoPagoSelect');
      let estadoPagoActual = document.getElementById('ticketForm').dataset.originalEstado || 'pendiente';
      
      if (estadoSelect) {
        estadoPagoActual = estadoSelect.value;
      } else {
        // Si no existe el combobox, usar prompt como fallback
        const estadoPago = prompt('Ingrese el nuevo estado de pago (pendiente/pagado/rechazado):', 
                                  document.getElementById('ticketForm').dataset.originalEstado || 'pendiente');
        
        if (!estadoPago || !['pendiente', 'pagado', 'rechazado'].includes(estadoPago)) {
          if (estadoPago !== null) { // Si no fue cancelado
            alert('Estado no válido. Use: pendiente, pagado o rechazado');
          }
          return;
        }
        estadoPagoActual = estadoPago;
      }
      
      if (!['pendiente', 'pagado', 'rechazado'].includes(estadoPagoActual)) {
        alert('Estado no válido. Use: pendiente, pagado o rechazado');
        return;
      }
      
      try {
        // Preparar datos para actualización
        const updateData = {
          cliente_nombre: clienteNombre,  // Actualizar el nombre tal como se introdujo
          estado_pago: estadoPagoActual,
          total: total
        };
        
        // Opcionalmente intentar encontrar cliente existente por nombre
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
              updateData.cliente_id = clienteEncontrado.id;
            } else {
              // Si no se encuentra, usar el primer cliente que no sea admin
              const clienteDefault = usuariosData.usuarios.find(u => u.rol === 'cliente');
              if (clienteDefault) {
                updateData.cliente_id = clienteDefault.id;
              }
            }
          }
        } catch (error) {
          console.log('No se pudo acceder a la lista de usuarios:', error.message);
        }
        
        await adminApiClient.updateBoleta(editingId, updateData);
        
        // Limpiar modo edición
        delete document.getElementById('ticketForm').dataset.editingId;
        delete document.getElementById('ticketForm').dataset.originalEstado;
        
        // Cambiar texto del botón
        const submitButton = document.querySelector('#ticketForm button[type="submit"]');
        if (submitButton) {
          submitButton.textContent = 'Crear Boleta';
        }
        
        // Eliminar el campo de estado si existe
        const estadoSelect = document.getElementById('estadoPagoSelect');
        if (estadoSelect) {
          estadoSelect.closest('.form-field').remove();
        }
        
        // Cerrar modal
        document.querySelector('#ticketModal').classList.remove('open');
        document.querySelector('#ticketModal').setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Limpiar formulario y items
        ticketItems = [];
        updateTicketItemList();
        
        // Recargar tickets
        cargarBoletas();
      } catch (error) {
        console.error('Error al actualizar la boleta:', error);
        alert('Error al actualizar la boleta: ' + error.message);
      }
    } else {
      // Estamos creando una nueva boleta
      try {
        // Buscar cliente existente por nombre, o usar ID predeterminado
        let clienteId = 1; // ID predeterminado
        
        try {
          const usuariosResponse = await fetch(`${adminApiClient.baseURL}/auth/usuarios`, {
            method: 'GET',
            headers: adminApiClient.getHeaders()
          });
          
          if (usuariosResponse.ok) {
            const usuariosData = await usuariosResponse.json();
            // Buscar cualquier usuario que coincida con el nombre
            const clienteEncontrado = usuariosData.usuarios.find(u => 
              u.nombre.toLowerCase() === clienteNombre.toLowerCase()
            );
            
            if (clienteEncontrado) {
              clienteId = clienteEncontrado.id;
            } else {
              // Si no se encuentra un cliente exacto, usar el primer cliente que no sea admin
              const clienteDefault = usuariosData.usuarios.find(u => u.rol === 'cliente');
              if (clienteDefault) {
                clienteId = clienteDefault.id;
              }
            }
          }
        } catch (error) {
          // Si la ruta de usuarios no se puede acceder, usamos ID predeterminado
          console.log('No se pudo acceder a la lista de usuarios:', error.message);
        }
        
        const ticketData = {
          cliente_id: clienteId,
          cliente_nombre: clienteNombre, // Enviar el nombre tal como se introdujo
          total: total,
          estado_pago: 'pendiente', // Valor por defecto
          items: [...ticketItems] // Enviar los items también
        };
        
        // Crear boleta
        await adminApiClient.createBoleta(ticketData);
        
        // Cerrar modal
        document.querySelector('#ticketModal').classList.remove('open');
        document.querySelector('#ticketModal').setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Limpiar formulario y items
        ticketItems = [];
        updateTicketItemList();
        
        // Recargar tickets
        cargarBoletas();
      } catch (error) {
        console.error('Error al crear boleta:', error);
        alert('Error al crear la boleta: ' + error.message);
      }
    }
  });

  // Eventos para editar boletas
  document.getElementById('ticketTable')?.addEventListener('click', async (e) => {
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
          
          // Llenar el formulario con los datos actuales
          document.getElementById('tClient').value = boleta.cliente_nombre || boleta.cliente_id.toString();
          document.getElementById('tTotal').value = boleta.total || '';
          
          // Abrir el modal de edición
          document.querySelector('#ticketModal').classList.add('open');
          document.querySelector('#ticketModal').setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          
          // Guardar el ID de la boleta que se está editando
          document.getElementById('ticketForm').dataset.editingId = ticketId;
          document.getElementById('ticketForm').dataset.originalEstado = boleta.estado_pago;
          
          // Cambiar el texto del botón de submit
          const submitButton = document.querySelector('#ticketForm button[type="submit"]');
          if (submitButton) {
            submitButton.textContent = 'Actualizar Boleta';
          }
          
          // Crear o actualizar campo de estado de pago como combobox si no existe
          let estadoSelect = document.querySelector('#estadoPagoSelect');
          if (!estadoSelect) {
            const totalField = document.getElementById('tTotal');
            const estadoDiv = document.createElement('div');
            estadoDiv.className = 'form-field';
            estadoDiv.innerHTML = `
              <label for="estadoPagoSelect">Estado de Pago</label>
              <select id="estadoPagoSelect" required>
                <option value="pendiente" ${boleta.estado_pago === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="pagado" ${boleta.estado_pago === 'pagado' ? 'selected' : ''}>Pagado</option>
                <option value="rechazado" ${boleta.estado_pago === 'rechazado' ? 'selected' : ''}>Rechazado</option>
              </select>
            `;
            // Insertar después del campo de cliente
            const clienteField = document.getElementById('tClient').closest('.form-field');
            clienteField.parentNode.insertBefore(estadoDiv, clienteField.nextSibling);
          } else {
            // Si ya existe, simplemente actualizar la selección
            estadoSelect.value = boleta.estado_pago;
          }
        } else {
          alert('Error al cargar los datos de la boleta para editar');
        }
      } catch (error) {
        console.error('Error al editar boleta:', error);
        alert('Error al editar la boleta');
      }
    }
    
    const delBtn = e.target.closest('[data-del-ticket]');
    if (delBtn) {
      const ticketId = delBtn.getAttribute('data-ticket-id');
      if (confirm('¿Eliminar boleta?')) {
        try {
          await adminApiClient.deleteBoleta(ticketId);
          cargarBoletas(); // Recargar la lista
        } catch (error) {
          console.error('Error al eliminar boleta:', error);
          alert('Error al eliminar la boleta');
        }
      }
    }
  });

  document.getElementById('prodTable')?.addEventListener('click', async (e) => {
    if (e.target.closest('[data-del-product]')) {
      const productoId = e.target.closest('[data-del-product]').getAttribute('data-producto-id');
      if (confirm('¿Eliminar producto?')) {
        try {
          await adminApiClient.deleteProducto(productoId);
          cargarProductos(); // Recargar la lista
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          alert('Error al eliminar el producto');
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
      }
    });
  });

  // Cargar las reservas por defecto
  cargarReservas();
});

