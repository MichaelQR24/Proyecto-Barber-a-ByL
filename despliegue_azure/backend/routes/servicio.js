// Rutas de servicios
// archivo: routes/servicio.js

const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const auth = require('../middleware/auth');

// Rutas públicas
router.get('/', servicioController.getAll);
router.get('/:id', servicioController.getById);

// Rutas protegidas (requieren autenticación)
router.post('/', auth, servicioController.create);
router.put('/:id', auth, servicioController.update);
router.delete('/:id', auth, servicioController.delete);

module.exports = router;