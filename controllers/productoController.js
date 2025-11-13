// Controlador de Productos
// archivo: controllers/productoController.js

const Producto = require('../models/Producto');

const productoController = {
  // Obtener todos los productos
  getAll: (req, res) => {
    Producto.getAll((err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }
      res.json({
        productos: results
      });
    });
  },

  // Obtener producto por ID
  getById: (req, res) => {
    const { id } = req.params;

    Producto.getById(id, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      res.json({
        producto: results[0]
      });
    });
  },

  // Crear nuevo producto (solo para admins)
  create: (req, res) => {
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear productos.' });
    }

    const { nombre, descripcion, categoria, precio, stock, imagen_url } = req.body;

    // Validar datos requeridos
    if (!nombre || !categoria || !precio || stock === undefined) {
      return res.status(400).json({ message: 'Nombre, categoría, precio y stock son requeridos' });
    }

    const nuevoProducto = {
      nombre,
      descripcion: descripcion || null,
      categoria,
      precio: parseFloat(precio),
      stock: parseInt(stock),
      imagen_url: imagen_url || null
    };

    Producto.create(nuevoProducto, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al crear el producto', error: err });
      }

      nuevoProducto.id = results.insertId;

      res.status(201).json({
        message: 'Producto creado exitosamente',
        producto: nuevoProducto
      });
    });
  },

  // Actualizar producto (solo para admins)
  update: (req, res) => {
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden actualizar productos.' });
    }

    const { id } = req.params;
    const { nombre, descripcion, categoria, precio, stock, imagen_url, activo } = req.body;

    const datosProducto = {
      nombre: nombre || null,
      descripcion: descripcion || null,
      categoria: categoria || null,
      precio: precio ? parseFloat(precio) : null,
      stock: stock !== undefined ? parseInt(stock) : null,
      imagen_url: imagen_url || null,
      activo: activo !== undefined ? (activo ? 1 : 0) : 1
    };

    Producto.update(id, datosProducto, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar el producto', error: err });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      res.json({
        message: 'Producto actualizado exitosamente'
      });
    });
  },

  // Eliminar producto (eliminar físico) (solo para admins)
  delete: (req, res) => {
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar productos.' });
    }

    const { id } = req.params;

    Producto.delete(id, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al eliminar el producto', error: err });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      res.json({
        message: 'Producto eliminado exitosamente'
      });
    });
  }
};

module.exports = productoController;