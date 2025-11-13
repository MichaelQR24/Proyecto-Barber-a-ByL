// Configuración del servidor Node.js con Express
// archivo: server.js

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware para pasar la conexión a la base de datos a las rutas
app.use((req, res, next) => {
  req.db = require('./config/db');
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const servicioRoutes = require('./routes/servicio');
const productoRoutes = require('./routes/producto');
const reservaRoutes = require('./routes/reserva');
const boletaRoutes = require('./routes/boleta');

app.use('/api/auth', authRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/boletas', boletaRoutes);

// Ruta de ejemplo para verificar conexión
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend de Barbería ByL funcionando correctamente' });
});

// Ruta para sincronizar la estructura de la base de datos
app.get('/api/sync-db', (req, res) => {
  // Añadir la columna cliente_nombre a la tabla boletas si no existe
  const addClienteNombreColumnQuery = `
    ALTER TABLE boletas 
    ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(100) NULL
  `;
  
  req.db.query(addClienteNombreColumnQuery, (err, result) => {
    if (err) {
      console.error('Error al añadir la columna cliente_nombre:', err);
      return res.status(500).json({ message: 'Error al sincronizar la base de datos', error: err.message });
    }
    
    res.json({ message: 'Base de datos sincronizada correctamente', result });
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});