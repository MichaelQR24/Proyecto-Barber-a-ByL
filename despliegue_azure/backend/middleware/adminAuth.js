// Middleware para autorización de administrador
// archivo: middleware/adminAuth.js

const authorizeAdmin = (req, res, next) => {
  // Verificar si el usuario tiene rol de administrador
  if (req.userRol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden realizar esta acción.' });
  }
  
  next();
};

module.exports = authorizeAdmin;