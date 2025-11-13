// Modelo de Usuario
// archivo: models/Usuario.js

const db = require('../config/db');

const Usuario = {
  // Obtener todos los usuarios
  getAll: (callback) => {
    const query = 'SELECT * FROM usuarios';
    db.query(query, callback);
  },

  // Obtener usuario por ID
  getById: (id, callback) => {
    const query = 'SELECT * FROM usuarios WHERE id = ?';
    db.query(query, [id], callback);
  },

  // Obtener usuario por email
  getByEmail: (email, callback) => {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], callback);
  },

  // Crear nuevo usuario
  create: (nuevoUsuario, callback) => {
    const query = 'INSERT INTO usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [
      nuevoUsuario.nombre,
      nuevoUsuario.email,
      nuevoUsuario.password,
      nuevoUsuario.telefono,
      nuevoUsuario.rol
    ], callback);
  },

  // Actualizar usuario
  update: (id, datosUsuario, callback) => {
    const query = 'UPDATE usuarios SET nombre = ?, email = ?, telefono = ? WHERE id = ?';
    db.query(query, [datosUsuario.nombre, datosUsuario.email, datosUsuario.telefono, id], callback);
  },

  // Eliminar usuario
  delete: (id, callback) => {
    const query = 'DELETE FROM usuarios WHERE id = ?';
    db.query(query, [id], callback);
  }
};

module.exports = Usuario;