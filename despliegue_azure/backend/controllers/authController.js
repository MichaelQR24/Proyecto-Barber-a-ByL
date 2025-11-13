// Controlador de autenticación
// archivo: controllers/authController.js

const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authController = {
  // Registro de nuevo usuario
  register: (req, res) => {
    const { nombre, email, password, telefono, rol = 'cliente' } = req.body;

    // Validar datos requeridos
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    // Verificar si el email ya existe
    Usuario.getByEmail(email, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }

      // Hash de la contraseña
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ message: 'Error al encriptar la contraseña' });
        }

        // Crear nuevo usuario
        const nuevoUsuario = {
          nombre,
          email,
          password: hashedPassword,
          telefono,
          rol
        };

        Usuario.create(nuevoUsuario, (err, results) => {
          if (err) {
            return res.status(500).json({ message: 'Error al crear el usuario', error: err });
          }

          // Eliminar la contraseña del resultado antes de enviarla
          const { password, ...user } = nuevoUsuario;
          user.id = results.insertId;
          
          res.status(201).json({
            message: 'Usuario creado exitosamente',
            user
          });
        });
      });
    });
  },

  // Login de usuario
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    Usuario.getByEmail(email, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }

      const usuario = results[0];

      // Comparar contraseña
      bcrypt.compare(password, usuario.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ message: 'Error al comparar contraseñas' });
        }

        if (!isMatch) {
          return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Crear token JWT
        const token = jwt.sign(
          { id: usuario.id, email: usuario.email, rol: usuario.rol },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Actualizar último login
        Usuario.update(usuario.id, { ...usuario }, (err) => {
          if (err) {
            console.error('Error al actualizar último login:', err);
          }
        });

        // Eliminar la contraseña del resultado antes de enviarla
        const { password: _, ...user } = usuario;
        
        res.json({
          message: 'Login exitoso',
          token,
          user
        });
      });
    });
  },

  // Obtener perfil de usuario (requiere token)
  getProfile: (req, res) => {
    const userId = req.userId; // Inyectado por el middleware de autenticación
    
    Usuario.getById(userId, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error en el servidor', error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const { password, ...user } = results[0];
      
      res.json({
        user
      });
    });
  },

  // Actualizar perfil de usuario (requiere token)
  updateProfile: (req, res) => {
    const userId = req.userId; // Inyectado por el middleware de autenticación
    const { nombre, email, telefono } = req.body;

    // Validar que se haya enviado al menos un campo para actualizar
    if (!nombre && !email && !telefono) {
      return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar (nombre, email o telefono)' });
    }

    // Si se va a actualizar el email, verificar que no esté en uso por otro usuario
    if (email) {
      Usuario.getByEmail(email, (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error en el servidor', error: err });
        }
        
        // Verificar si el email ya está en uso por otro usuario
        const emailExists = results.some(usuario => usuario.id !== userId && usuario.email === email);
        if (emailExists) {
          return res.status(400).json({ message: 'El email ya está registrado por otro usuario' });
        }

        // Actualizar el usuario
        const datosUsuario = { nombre: nombre || null, email: email || null, telefono: telefono || null };
        Usuario.update(userId, datosUsuario, (err, results) => {
          if (err) {
            return res.status(500).json({ message: 'Error al actualizar el usuario', error: err });
          }

          if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
          }

          res.json({
            message: 'Perfil actualizado exitosamente'
          });
        });
      });
    } else {
      // Actualizar el usuario sin cambiar el email
      const datosUsuario = { nombre: nombre || null, email: null, telefono: telefono || null };
      Usuario.update(userId, datosUsuario, (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error al actualizar el usuario', error: err });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({
          message: 'Perfil actualizado exitosamente'
        });
      });
    }
  },

  // Obtener todos los usuarios (solo para administradores)
  getAllUsers: (req, res) => {
    // Validar que el usuario sea administrador
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver todos los usuarios.' });
    }

    Usuario.getAll((err, results) => {
      if (err) {
        console.error('Error al obtener usuarios:', err);
        return res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
      }

      // Eliminar la contraseña de los resultados antes de enviarlos
      const usuarios = results.map(({ password, ...user }) => user);
      
      res.json({ usuarios });
    });
  }
};

module.exports = authController;