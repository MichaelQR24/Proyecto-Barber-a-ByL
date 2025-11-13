// Controlador de Reservas
// archivo: controllers/reservaController.js

const Reserva = require('../models/Reserva');

const reservaController = {
  // Obtener todas las reservas
  getAll: (req, res) => {
    // Solo los administradores pueden ver todas las reservas
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver todas las reservas.' });
    }
    
    const query = `
      SELECT r.*, u.nombre AS cliente_nombre, u.email AS cliente_email, u.telefono AS telefono, s.nombre AS servicio_nombre, s.precio AS servicio_precio
      FROM reservas r
      LEFT JOIN usuarios u ON r.cliente_id = u.id
      LEFT JOIN servicios s ON r.servicio_id = s.id
      ORDER BY r.fecha ASC, r.hora ASC, r.fecha_creacion ASC
    `;
    
    req.db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }
      res.json({
        reservas: results
      });
    });
  },

  // Obtener reservas del usuario autenticado
  getMyReservas: (req, res) => {
    const userId = req.userId;
    
    const query = `
      SELECT r.*, u.nombre AS cliente_nombre, u.telefono AS telefono, s.nombre AS servicio_nombre, s.precio AS servicio_precio
      FROM reservas r
      LEFT JOIN usuarios u ON r.cliente_id = u.id
      LEFT JOIN servicios s ON r.servicio_id = s.id
      WHERE r.cliente_id = ?
      ORDER BY r.fecha ASC, r.hora ASC, r.fecha_creacion ASC
    `;
    
    req.db.query(query, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }
      res.json({
        reservas: results
      });
    });
  },

  // Obtener reserva por ID
  getById: (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    
    // Los usuarios solo pueden ver sus propias reservas
    // Los administradores pueden ver cualquier reserva
    let query, params;
    if (req.userRol === 'admin') {
      query = `
        SELECT r.*, u.nombre AS cliente_nombre, u.email AS cliente_email, s.nombre AS servicio_nombre, s.precio AS servicio_precio
        FROM reservas r
        LEFT JOIN usuarios u ON r.cliente_id = u.id
        LEFT JOIN servicios s ON r.servicio_id = s.id
        WHERE r.id = ?
      `;
      params = [id];
    } else {
      query = `
        SELECT r.*, u.nombre AS cliente_nombre, s.nombre AS servicio_nombre, s.precio AS servicio_precio
        FROM reservas r
        LEFT JOIN usuarios u ON r.cliente_id = u.id
        LEFT JOIN servicios s ON r.servicio_id = s.id
        WHERE r.id = ? AND r.cliente_id = ?
      `;
      params = [id, userId];
    }
    
    req.db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }
      
      res.json({
        reserva: results[0]
      });
    });
  },

  // Crear nueva reserva
  create: (req, res) => {
    const userId = req.userId;
    const { servicio_id, fecha, hora, notas } = req.body;

    // Validar datos requeridos
    if (!servicio_id || !fecha || !hora) {
      return res.status(400).json({ message: 'Servicio, fecha y hora son requeridos' });
    }

    // Verificar disponibilidad del horario
    const checkAvailabilityQuery = 'SELECT * FROM reservas WHERE fecha = ? AND hora = ? AND estado IN ("pendiente", "confirmada", "en proceso")';
    
    req.db.query(checkAvailabilityQuery, [fecha, hora], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verificando disponibilidad', error: err });
      }
      
      // En un salón de barbería real, puedes tener múltiples barberías trabajando simultáneamente
      // Por simplicidad, vamos a permitir múltiples reservas por hora
      // Si quieres restringir a una sola reserva por hora, descomenta las siguientes líneas:
      /*
      if (results.length > 0) {
        return res.status(400).json({ message: 'El horario solicitado no está disponible' });
      }
      */

      // Verificar que el servicio exista y esté activo
      const checkServiceQuery = 'SELECT * FROM servicios WHERE id = ? AND activo = 1';
      
      req.db.query(checkServiceQuery, [servicio_id], (err, serviceResults) => {
        if (err) {
          return res.status(500).json({ message: 'Error verificando servicio', error: err });
        }
        
        if (serviceResults.length === 0) {
          return res.status(400).json({ message: 'El servicio seleccionado no existe o no está disponible' });
        }

        // Crear la reserva
        const query = 'INSERT INTO reservas (cliente_id, servicio_id, fecha, hora, notas) VALUES (?, ?, ?, ?, ?)';
        
        req.db.query(query, [userId, servicio_id, fecha, hora, notas || null], (err, results) => {
          if (err) {
            return res.status(500).json({ message: 'Error al crear la reserva', error: err });
          }

          const nuevaReserva = {
            id: results.insertId,
            cliente_id: userId,
            servicio_id,
            fecha,
            hora,
            notas: notas || null,
            estado: 'pendiente'
          };
          
          res.status(201).json({
            message: 'Reserva creada exitosamente',
            reserva: nuevaReserva
          });
        });
      });
    });
  },

  // Actualizar estado de reserva (solo para admins)
  updateEstado: (req, res) => {
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden actualizar el estado de las reservas.' });
    }
    
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'confirmada', 'en proceso', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const query = 'UPDATE reservas SET estado = ? WHERE id = ?';
    
    req.db.query(query, [estado, id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error al actualizar el estado de la reserva', error: err });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      res.json({
        message: 'Estado de reserva actualizado exitosamente'
      });
    });
  },

  // Eliminar reserva (cancelar)
  delete: (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    
    // Verificar si el usuario es el dueño de la reserva o es admin
    const checkOwnershipQuery = 'SELECT cliente_id, estado FROM reservas WHERE id = ?';
    
    req.db.query(checkOwnershipQuery, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error verificando propiedad de la reserva', error: err });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }
      
      const reserva = results[0];
      
      // No permitir eliminar una reserva si ya está en proceso o completada
      if (reserva.estado === 'en proceso' || reserva.estado === 'completada') {
        return res.status(400).json({ message: 'No se puede cancelar una reserva que ya está en proceso o completada' });
      }
      
      if (reserva.cliente_id !== userId && req.userRol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. No puedes eliminar esta reserva.' });
      }

      const deleteQuery = 'DELETE FROM reservas WHERE id = ?';
      
      req.db.query(deleteQuery, [id], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error al eliminar la reserva', error: err });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        res.json({
          message: 'Reserva eliminada exitosamente'
        });
      });
    });
  }
};

module.exports = reservaController;