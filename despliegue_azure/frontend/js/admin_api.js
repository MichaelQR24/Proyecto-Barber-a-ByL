// archivo: js/admin_api.js
// Cliente API específico para funcionalidades de administrador

class AdminApiClient extends ApiClient {
  constructor(baseURL = 'https://tu-backend-azure.azurewebsites.net/api') {
    super(baseURL);
  }

  // Obtener todas las reservas (solo para admins)
  async getAllReservas() {
    const response = await fetch(`${this.baseURL}/reservas/all`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  // Actualizar estado de reserva (solo para admins)
  async updateReservaEstado(id, estado) {
    const response = await fetch(`${this.baseURL}/reservas/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ estado })
    });
    return await this.handleResponse(response);
  }

  // Obtener todos los servicios
  async getAllServicios() {
    const response = await fetch(`${this.baseURL}/servicios`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  // Crear un nuevo servicio (solo para admins)
  async createServicio(servicioData) {
    const response = await fetch(`${this.baseURL}/servicios`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(servicioData)
    });
    return await this.handleResponse(response);
  }

  // Actualizar un servicio (solo para admins)
  async updateServicio(id, servicioData) {
    const response = await fetch(`${this.baseURL}/servicios/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(servicioData)
    });
    return await this.handleResponse(response);
  }

  // Eliminar un servicio (solo para admins)
  async deleteServicio(id) {
    const response = await fetch(`${this.baseURL}/servicios/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  // Obtener todos los productos
  async getAllProductos() {
    const response = await fetch(`${this.baseURL}/productos`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  // Crear un nuevo producto (solo para admins)
  async createProducto(productoData) {
    const response = await fetch(`${this.baseURL}/productos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(productoData)
    });
    return await this.handleResponse(response);
  }

  // Actualizar un producto (solo para admins)
  async updateProducto(id, productoData) {
    const response = await fetch(`${this.baseURL}/productos/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(productoData)
    });
    return await this.handleResponse(response);
  }

  // Eliminar un producto (solo para admins)
  async deleteProducto(id) {
    const response = await fetch(`${this.baseURL}/productos/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  // Obtener todas las boletas
  async getAllBoletas() {
    const response = await fetch(`${this.baseURL}/boletas`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }

  // Crear una nueva boleta
  async createBoleta(boletaData) {
    const response = await fetch(`${this.baseURL}/boletas`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(boletaData)
    });
    return await this.handleResponse(response);
  }

  // Actualizar una boleta
  async updateBoleta(id, boletaData) {
    const response = await fetch(`${this.baseURL}/boletas/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(boletaData)
    });
    return await this.handleResponse(response);
  }

  // Eliminar una boleta
  async deleteBoleta(id) {
    const response = await fetch(`${this.baseURL}/boletas/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    return await this.handleResponse(response);
  }
}

// Instancia global para usar en páginas de administración
const adminApiClient = new AdminApiClient();