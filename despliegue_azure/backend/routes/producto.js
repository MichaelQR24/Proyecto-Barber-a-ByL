// Rutas de productos
// archivo: routes/producto.js

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const auth = require('../middleware/auth');

// Rutas públicas
router.get('/', productoController.getAll);
router.get('/:id', productoController.getById);

// Rutas protegidas (requieren autenticación)
router.post('/', auth, productoController.create);
router.put('/:id', auth, productoController.update);
router.delete('/:id', auth, productoController.delete);

module.exports = router;