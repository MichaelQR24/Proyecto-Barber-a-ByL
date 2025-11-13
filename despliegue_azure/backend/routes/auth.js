// Rutas de autenticación
// archivo: routes/auth.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');

// Validaciones para registro
const registerValidation = [
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('email').isEmail().withMessage('Email debe ser válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para login
const loginValidation = [
  body('email').isEmail().withMessage('Email debe ser válido'),
  body('password').notEmpty().withMessage('Contraseña es requerida')
];

// Ruta para registro
router.post('/register', registerValidation, authController.register);

// Ruta para login
router.post('/login', loginValidation, authController.login);

// Ruta para obtener perfil (requiere autenticación)
const auth = require('../middleware/auth');
router.get('/profile', auth, authController.getProfile);

// Ruta para actualizar perfil (requiere autenticación)
router.put('/profile', auth, authController.updateProfile);

// Ruta para obtener todos los usuarios (solo para admins)
const authorizeAdmin = require('../middleware/adminAuth');
router.get('/usuarios', auth, authorizeAdmin, authController.getAllUsers);

module.exports = router;