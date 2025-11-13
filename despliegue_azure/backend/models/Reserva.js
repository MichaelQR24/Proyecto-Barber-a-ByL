// Modelo de Reserva
// archivo: models/Reserva.js

const db = require('../config/db');

const Reserva = {
  // Obtener todas las reservas
  getAll: (callback) => {
    const query = `
      SELECT r.*, u.nombre AS cliente_nombre, u.email AS cliente_email, s.nombre AS servicio_nombre, s.precio AS servicio_precio
      FROM reservas r
      LEFT JOIN usuarios u ON r.cliente_id = u.id
      LEFT JOIN servicios s ON r.servicio_id = s.id
      ORDER BY r.fecha, r.hora
    `;
    db.query(query, callback);
  },

  // Obtener reserva por ID
  getById: (id, callback) => {
    const query = `
      SELECT r.*, u.nombre AS cliente_nombre, u.email AS cliente_email, s.nombre AS servicio_nombre, s.precio AS servicio_precio
      FROM reservas r
      LEFT JOIN usuarios u ON r.cliente_id = u.id
      LEFT JOIN servicios s ON r.servicio_id = s.id
      WHERE r.id = ?
    `;
    db.query(query, [id], callback);
  },

  // Crear nueva reserva
  create: (nuevaReserva, callback) => {
    const query = 'INSERT INTO reservas (cliente_id, servicio_id, fecha, hora, notas) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [
      nuevaReserva.cliente_id,
      nuevaReserva.servicio_id,
      nuevaReserva.fecha,
      nuevaReserva.hora,
      nuevaReserva.notas
    ], callback);
  },

  // Actualizar estado de reserva
  updateEstado: (id, estado, callback) => {
    const query = 'UPDATE reservas SET estado = ? WHERE id = ?';
    db.query(query, [estado, id], callback);
  },

  // Eliminar reserva
  delete: (id, callback) => {
    const query = 'DELETE FROM reservas WHERE id = ?';
    db.query(query, [id], callback);
  },
  
  // Obtener disponibilidad para una fecha y hora específica
  getDisponibilidad: (fecha, callback) => {
    const query = 'SELECT * FROM reservas WHERE fecha = ? AND estado IN ("pendiente", "confirmada", "en proceso")';
    db.query(query, [fecha], callback);
  }
};

module.exports = Reserva;