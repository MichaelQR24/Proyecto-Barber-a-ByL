// Modelo de Servicio
// archivo: models/Servicio.js

const db = require('../config/db');

const Servicio = {
  // Obtener todos los servicios
  getAll: (callback) => {
    const query = 'SELECT * FROM servicios WHERE activo = 1';
    db.query(query, callback);
  },

  // Obtener servicio por ID
  getById: (id, callback) => {
    const query = 'SELECT * FROM servicios WHERE id = ? AND activo = 1';
    db.query(query, [id], callback);
  },

  // Crear nuevo servicio
  create: (nuevoServicio, callback) => {
    const query = 'INSERT INTO servicios (nombre, descripcion, precio, duracion, imagen_url) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [
      nuevoServicio.nombre,
      nuevoServicio.descripcion,
      nuevoServicio.precio,
      nuevoServicio.duracion,
      nuevoServicio.imagen_url
    ], callback);
  },

  // Actualizar servicio
  update: (id, datosServicio, callback) => {
    const query = 'UPDATE servicios SET nombre = ?, descripcion = ?, precio = ?, duracion = ?, imagen_url = ?, activo = ? WHERE id = ?';
    db.query(query, [
      datosServicio.nombre,
      datosServicio.descripcion,
      datosServicio.precio,
      datosServicio.duracion,
      datosServicio.imagen_url,
      datosServicio.activo,
      id
    ], callback);
  },

  // Eliminar (desactivar) servicio
  delete: (id, callback) => {
    const query = 'UPDATE servicios SET activo = 0 WHERE id = ?';
    db.query(query, [id], callback);
  }
};

module.exports = Servicio;