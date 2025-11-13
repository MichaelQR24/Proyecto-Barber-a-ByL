// archivo: admin/check_auth.js
// Verificar autenticación de administrador antes de cargar la página

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar si el usuario está autenticado
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Debes iniciar sesión para acceder al panel de administración');
    window.location.href = '../index.html';
    return;
  }

  // Decodificar el token para verificar el rol de administrador
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const userRol = tokenPayload.rol;
    
    if (userRol !== 'admin') {
      alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
      window.location.href = '../index.html';
      return;
    }
    
    // Actualizar la interfaz para reflejar el rol de administrador
    const adminMailElement = document.querySelector('.admin-mail');
    if (adminMailElement && tokenPayload.email) {
      adminMailElement.textContent = tokenPayload.email;
    }
    
    // Configurar el botón de logout
    const logoutButton = document.querySelector('.admin-logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        apiClient.logout();
        window.location.href = '../index.html';
      });
    }
    
    // Si llegamos aquí, el usuario es admin y puede ver el panel
    console.log('Usuario admin autenticado correctamente. Mostrando panel de administración.');
  } catch (error) {
    console.error('Error al verificar autenticación:', error);
    alert('Error al verificar autenticación. Por favor, inicie sesión nuevamente.');
    window.location.href = '../index.html';
  }
});