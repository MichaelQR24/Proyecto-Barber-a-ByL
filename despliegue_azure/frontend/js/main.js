// Barbería ByL – Interacciones con backend

document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu toggle
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("navLinks");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
    });
  }

  // Close the menu when a link is clicked
  if (links) {
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav?.classList.remove("open");
        toggle?.setAttribute("aria-expanded", "false");
      })
    );
  }

  // Actualizar UI según estado de autenticación
  function actualizarUIPorAutenticacion() {
    const token = localStorage.getItem('token');
    const loginBtn = document.querySelector("#loginBtn");
    const btnText = loginBtn?.querySelector('.btn-text');
    
    if (token) {
      // Decodificar el token para obtener el rol (simplificado - en producción se debería verificar el token)
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const userRol = tokenPayload.rol;
        
        if (userRol === 'admin') {
          // Usuario administrador
          if (btnText) {
            btnText.textContent = 'Panel Admin';
          }
          // Cambiar el enlace para ir al panel de administración
          loginBtn.href = 'admin/index.html';
          loginBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'admin/index.html';
          };
        } else {
          // Usuario cliente
          if (btnText) {
            btnText.textContent = 'Mis Reservas';
          }
          // Cambiar el enlace para ir a la página de reservas
          loginBtn.href = 'mis_reservas.html';
          loginBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'mis_reservas.html';
          };
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // En caso de error, manejar como usuario normal
        if (btnText) {
          btnText.textContent = 'Cerrar Sesión';
        }
        loginBtn.href = '#';
        loginBtn.onclick = (e) => {
          e.preventDefault();
          // Cerrar sesión
          apiClient.logout();
          actualizarUIPorAutenticacion();
          alert('Sesión cerrada exitosamente');
        };
      }
    } else {
      // Usuario no autenticado
      if (btnText) {
        btnText.textContent = 'Iniciar Sesión';
      }
      loginBtn.href = '#login';
      loginBtn.onclick = (e) => {
        e.preventDefault();
        openModal(loginModal);
      };
    }
  }

  // Inicializar UI
  actualizarUIPorAutenticacion();

  // Floating accent dots to emulate the design
  const layer = document.querySelector(".floating-dots");
  if (layer) {
    const dots = 16;
    const headerH = 88; // keep some space for the header
    for (let i = 0; i < dots; i++) {
      const s = document.createElement("span");
      s.className = "dot";
      const size = Math.floor(6 + Math.random() * 8);
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.left = `${Math.random() * 100}%`;
      const topVh = headerH + Math.random() * (window.innerHeight - headerH - 40);
      s.style.top = `${topVh}px`;
      s.style.setProperty("--t", `${6 + Math.random() * 6}s`);
      s.style.opacity = String(0.35 + Math.random() * 0.4);
      layer.appendChild(s);
    }
  }

  // Booking form helpers
  const timeSel = document.getElementById("bkTime");
  if (timeSel) {
    const toHH = (n) => n.toString().padStart(2, "0");
    for (let h = 9; h <= 20; h++) {
      for (let m of [0, 30]) {
        const v = `${toHH(h)}:${toHH(m)}`;
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        timeSel.appendChild(opt);
      }
    }
  }

  // Cargar servicios desde la API para el formulario de reservas
  async function cargarServiciosEnFormulario() {
    try {
      const { servicios } = await apiClient.getServicios();
      const servicioSelect = document.getElementById("bkService");
      
      // Limpiar opciones actuales
      servicioSelect.innerHTML = '<option value="" selected disabled>Selecciona un servicio</option>';
      
      // Agregar servicios desde la API
      servicios.forEach(servicio => {
        const option = document.createElement("option");
        option.value = servicio.id; // Usar el ID del servicio
        option.textContent = `${servicio.nombre} - $${servicio.precio}`;
        servicioSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      alert('Error al cargar los servicios. Por favor, intenta de nuevo más tarde.');
    }
  }

  // Cargar servicios cuando se muestre el formulario de reserva
  const reservaSection = document.getElementById("reserva");
  if (reservaSection) {
    reservaSection.addEventListener('click', async () => {
      // Cargar servicios si aún no se han cargado
      if (document.getElementById("bkService").options.length <= 1) {
        await cargarServiciosEnFormulario();
      }
    });
    // Cargar servicios también al cargar la página
    cargarServiciosEnFormulario();
  }

  // Manejar el formulario de reserva con conexión a la API
  const form = document.getElementById("bookingForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const vals = Object.fromEntries(data.entries());
      
      if (!vals.name || !vals.phone || !vals.service || !vals.date || !vals.time) {
        alert("Por favor completa todos los campos.");
        return;
      }

      try {
        // Verificar si el usuario está autenticado
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Debes iniciar sesión para hacer una reserva');
          openModal(loginModal); // Abrir modal de login en lugar de redirigir
          return;
        }
        
        // Obtener el ID del servicio seleccionado
        const servicioId = parseInt(vals.service);
        
        // Formar los datos de la reserva
        const reservaData = {
          servicio_id: servicioId,
          fecha: vals.date,
          hora: vals.time
        };
        
        // Actualizar el teléfono del usuario si ha cambiado
        try {
          // Decodificar el token para obtener el ID del usuario
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const userId = tokenPayload.id;
          
          // Obtener datos del perfil del usuario
          const profileResponse = await apiClient.getProfile();
          if (profileResponse.user && profileResponse.user.telefono !== vals.phone) {
            // Actualizar el teléfono del usuario
            await apiClient.updateProfile({ telefono: vals.phone });
          }
        } catch (profileError) {
          console.warn('No se pudo actualizar el teléfono del usuario:', profileError);
          // Continuar con la reserva aún si no se puede actualizar el teléfono
        }
        
        const result = await apiClient.createReserva(reservaData);
        alert(`Reserva confirmada:\nServicio ID ${servicioId}\n${vals.date} a las ${vals.time}`);
        form.reset();
      } catch (error) {
        console.error('Error al crear la reserva:', error);
        alert('Error al crear la reserva: ' + error.message);
      }
    });
  }

  // Login modal interactions
  const openLogin = document.querySelector("#loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeBtn = loginModal?.querySelector(".modal-close");
  const overlay = loginModal?.querySelector(".modal-overlay");
  
  function openModal(m){ 
    if(!m) return; 
    m.classList.add("open"); 
    m.setAttribute("aria-hidden","false"); 
    document.body.style.overflow="hidden"; 
    m.querySelector("input")?.focus(); 
  }
  
  function closeModal(m){ 
    if(!m) return; 
    m.classList.remove("open"); 
    m.setAttribute("aria-hidden","true"); 
    document.body.style.overflow=""; 
  }
  
  openLogin?.addEventListener("click", (e)=>{ 
    const token = localStorage.getItem('token');
    if (token) {
      // Si está logueado, ir a la página de reservas
      window.location.href = 'mis_reservas.html';
    } else {
      // Si no está logueado, abrir modal
      e.preventDefault(); 
      openModal(loginModal); 
    }
  });
  
  closeBtn?.addEventListener("click", ()=> closeModal(loginModal));
  overlay?.addEventListener("click", ()=> closeModal(loginModal));
  
  window.addEventListener("keydown", (e)=>{ 
    if(e.key === "Escape" && loginModal?.classList.contains("open")) closeModal(loginModal); 
  });

  // Login form handling
  const loginForm = document.getElementById("loginForm");
  loginForm?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const email = /** @type {HTMLInputElement} */(document.getElementById("loginEmail")).value.trim();
    const pass = /** @type {HTMLInputElement} */(document.getElementById("loginPass")).value.trim();
    
    try {
      const result = await apiClient.login(email, pass);
      
      alert(`Bienvenido, ${result.user.nombre}!`);
      closeModal(loginModal);
      
      // Actualizar UI después del login
      actualizarUIPorAutenticacion();
      
      // Verificar rol y redirigir según corresponda
      try {
        const tokenPayload = JSON.parse(atob(result.token.split('.')[1]));
        if (tokenPayload.rol === 'admin') {
          // Si es admin, ir directamente al panel de admin
          window.location.href = 'admin/index.html';
        }
      } catch (error) {
        console.error('Error al verificar rol:', error);
      }
    } catch (error) {
      alert("Credenciales inválidas: " + error.message);
    }
  });

  // Toggle password visibility
  const toggleBtn = loginModal?.querySelector(".pass-toggle");
  toggleBtn?.addEventListener("click", ()=>{
    const inp = /** @type {HTMLInputElement} */(document.getElementById("loginPass"));
    inp.type = inp.type === "password" ? "text" : "password";
  });

  // Tabs: login vs register
  const tabs = loginModal?.querySelectorAll(".login-tabs .tab-btn");
  const regForm = document.getElementById("registerForm");
  tabs?.forEach((btn)=>{
    btn.addEventListener("click", ()=>{
      tabs.forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const tab = btn.getAttribute("data-tab");
      if(tab === "register"){
        loginForm?.classList.add("is-hidden");
        regForm?.classList.remove("is-hidden");
      } else {
        regForm?.classList.add("is-hidden");
        loginForm?.classList.remove("is-hidden");
      }
    });
  });

  // Register form handling
  regForm?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const name = /** @type {HTMLInputElement} */(document.getElementById("regName")).value.trim();
    const email = /** @type {HTMLInputElement} */(document.getElementById("regEmail")).value.trim();
    const pass1 = /** @type {HTMLInputElement} */(document.getElementById("regPass")).value;
    const pass2 = /** @type {HTMLInputElement} */(document.getElementById("regPass2")).value;
    
    if(!name || !email || pass1.length < 6 || pass2.length < 6){
      alert("Completa todos los campos. La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if(pass1 !== pass2){
      alert("Las contraseñas no coinciden.");
      return;
    }
    
    try {
      const userData = {
        nombre: name,
        email: email,
        password: pass1,
        rol: 'cliente'
      };
      
      const result = await apiClient.register(userData);
      alert("Cuenta creada exitosamente. Ya puedes iniciar sesión.");
      
      // Switch back to login tab after registration
      const firstTab = loginModal?.querySelector('.login-tabs .tab-btn[data-tab="login"]');
      firstTab?.dispatchEvent(new Event('click'));
    } catch (error) {
      alert("Error al crear la cuenta: " + error.message);
    }
  });

  // Cargar servicios dinámicamente en la sección de servicios
  async function cargarServiciosDinamicos() {
    try {
      const { servicios } = await apiClient.getServicios();
      const serviceGrid = document.querySelector('.service-grid');
      
      if (serviceGrid) {
        serviceGrid.innerHTML = ''; // Limpiar servicios actuales
        
        servicios.forEach(servicio => {
          const serviceCard = document.createElement('article');
          serviceCard.className = 'service-card';
          serviceCard.innerHTML = `
            <span class="svc-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 8.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 0L12 12m0 0 6.75 6.75m0 0a2.25 2.25 0 1 0 3.182-3.182M18.75 18.75 21 21m-9-9L5.25 15.75m0 0a2.25 2.25 0 1 0 3.182 3.182" stroke="#f1b41f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <div class="svc-body">
              <h3>${servicio.nombre}</h3>
              <p>${servicio.descripcion || 'Servicio profesional'}</p>
              <span class="price">$${servicio.precio.toLocaleString('es-CO')}</span>
            </div>
          `;
          serviceGrid.appendChild(serviceCard);
        });
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      // Si falla, dejar los servicios estáticos
    }
  }
  
  // Cargar servicios al iniciar la página
  cargarServiciosDinamicos();
});