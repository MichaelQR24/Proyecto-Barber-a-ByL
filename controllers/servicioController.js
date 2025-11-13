// Controlador de Servicios
// archivo: controllers/servicioController.js

const Servicio = require('../models/Servicio');

const servicioController = {
  // Obtener todos los servicios
  getAll: (req, res) => {
    Servicio.getAll((err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }
      res.json({
        servicios: results
      });
    });
  },

  // Obtener servicio por ID
  getById: (req, res) => {
    const { id } = req.params;

    Servicio.getById(id, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      res.json({
        servicio: results[0]
      });
    });
  },

  // Crear nuevo servicio (solo para admins)
  create: (req, res) => {
    // Verificar rol de administrador (esto se debería hacer en un middleware específico)
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear servicios.' });
    }

    const { nombre, descripcion, precio, duracion, imagen_url } = req.body;

    // Validar datos requeridos
    if (!nombre || !precio || !duracion) {
      return res.status(400).json({ message: 'Nombre, precio y duración son requeridos' });
    }

    const nuevoServicio = {
      nombre,
      descripcion: descripcion || null,
      precio: parseFloat(precio),
      duracion: parseInt(duracion),
      imagen_url: imagen_url || null
    };

    Servicio.create(nuevoServicio, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al crear el servicio', error: err });
      }

      nuevoServicio.id = results.insertId;

      res.status(201).json({
        message: 'Servicio creado exitosamente',
        servicio: nuevoServicio
      });
    });
  },

  // Actualizar servicio (solo para admins)
  update: (req, res) => {
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden actualizar servicios.' });
    }

    const { id } = req.params;
    const { nombre, descripcion, precio, duracion, imagen_url, activo } = req.body;

    const datosServicio = {
      nombre: nombre || null,
      descripcion: descripcion || null,
      precio: precio ? parseFloat(precio) : null,
      duracion: duracion ? parseInt(duracion) : null,
      imagen_url: imagen_url || null,
      activo: activo !== undefined ? (activo ? 1 : 0) : 1
    };

    Servicio.update(id, datosServicio, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar el servicio', error: err });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      res.json({
        message: 'Servicio actualizado exitosamente'
      });
    });
  },

  // Eliminar servicio (eliminación física permanente) (solo para admins)
  delete: (req, res) => {
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar servicios.' });
    }

    const { id } = req.params;

    Servicio.delete(id, (err, results) => {
      if (err) {
        console.error('Error al eliminar servicio:', err);
        return res.status(500).json({ message: 'Error al eliminar el servicio', error: err.message });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Servicio no encontrado' });
      }

      res.json({
        message: 'Servicio eliminado exitosamente'
      });
    });
  }
};

module.exports = servicioController;