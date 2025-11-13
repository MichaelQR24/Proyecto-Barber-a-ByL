// Middleware de autenticación
// archivo: middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.id;
    req.userEmail = verified.email;
    req.userRol = verified.rol;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token no válido.' });
  }
};

module.exports = auth;