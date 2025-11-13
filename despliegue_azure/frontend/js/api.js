// archivo: js/api.js
// Cliente API para conectar el frontend con el backend

class ApiClient {
  constructor(baseURL = 'https://tu-backend-azure.azurewebsites.net/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  // Método para incluir token en encabezados
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Manejar respuesta de la API
  async handleResponse(response) {
    if (response.status === 401) {
      // Token expirado o no válido
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      throw new Error('Sesión expirada. Por favor inicie sesión de nuevo.');
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error en la solicitud');
    }
    return data;
  }

  // Autenticación
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await this.handleResponse(response);
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await this.handleResponse(response);
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  // Servicios
  async getServicios() {
    const response = await fetch(`${this.baseURL}/servicios`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  async createServicio(servicioData) {
    const response = await fetch(`${this.baseURL}/servicios`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(servicioData)
    });
    return await this.handleResponse(response);
  }

  // Productos
  async getProductos() {
    const response = await fetch(`${this.baseURL}/productos`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  // Reservas
  async getReservas() {
    const response = await fetch(`${this.baseURL}/reservas`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  async createReserva(reservaData) {
    const response = await fetch(`${this.baseURL}/reservas`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(reservaData)
    });
    return await this.handleResponse(response);
  }

  // Perfil del usuario
  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  async updateProfile(userData) {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });
    return await this.handleResponse(response);
  }

  // Cerrar sesión
  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
}

// Instancia global para usar en toda la aplicación
const apiClient = new ApiClient();