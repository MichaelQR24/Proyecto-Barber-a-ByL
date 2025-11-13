// Modelo de Producto
// archivo: models/Producto.js

const db = require('../config/db');

const Producto = {
  // Obtener todos los productos
  getAll: (callback) => {
    const query = 'SELECT * FROM productos WHERE activo = 1';
    db.query(query, callback);
  },

  // Obtener producto por ID
  getById: (id, callback) => {
    const query = 'SELECT * FROM productos WHERE id = ? AND activo = 1';
    db.query(query, [id], callback);
  },

  // Crear nuevo producto
  create: (nuevoProducto, callback) => {
    const query = 'INSERT INTO productos (nombre, descripcion, categoria, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [
      nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.categoria,
      nuevoProducto.precio,
      nuevoProducto.stock,
      nuevoProducto.imagen_url
    ], callback);
  },

  // Actualizar producto
  update: (id, datosProducto, callback) => {
    const query = 'UPDATE productos SET nombre = ?, descripcion = ?, categoria = ?, precio = ?, stock = ?, imagen_url = ?, activo = ? WHERE id = ?';
    db.query(query, [
      datosProducto.nombre,
      datosProducto.descripcion,
      datosProducto.categoria,
      datosProducto.precio,
      datosProducto.stock,
      datosProducto.imagen_url,
      datosProducto.activo,
      id
    ], callback);
  },

  // Eliminar (desactivar) producto
  delete: (id, callback) => {
    const query = 'UPDATE productos SET activo = 0 WHERE id = ?';
    db.query(query, [id], callback);
  },

  // Reducir stock
  reducirStock: (id, cantidad, callback) => {
    const query = 'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?';
    db.query(query, [cantidad, id, cantidad], callback);
  }
};

module.exports = Producto;