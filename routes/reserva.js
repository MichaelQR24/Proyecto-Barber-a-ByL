// Rutas de reservas
// archivo: routes/reserva.js

const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.get('/', auth, reservaController.getMyReservas); // Solo las del usuario autenticado
router.get('/all', auth, reservaController.getAll); // Todas las reservas (solo para admins)
router.get('/:id', auth, reservaController.getById);
router.post('/', auth, reservaController.create);
router.put('/:id', auth, reservaController.updateEstado); // Actualizar estado (solo para admins)
router.delete('/:id', auth, reservaController.delete);

module.exports = router;