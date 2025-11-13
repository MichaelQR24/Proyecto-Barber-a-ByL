// archivo: routes/boleta.js
const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, delete: deleteBoleta } = require('../controllers/boletaController');
const auth = require('../middleware/auth');
const authorizeAdmin = require('../middleware/adminAuth');

// Todas las rutas de boletas requieren autenticación de administrador
router.get('/', auth, authorizeAdmin, getAll);
router.get('/:id', auth, authorizeAdmin, getById);
router.post('/', auth, authorizeAdmin, create);
router.put('/:id', auth, authorizeAdmin, update);
router.delete('/:id', auth, authorizeAdmin, deleteBoleta);

module.exports = router;