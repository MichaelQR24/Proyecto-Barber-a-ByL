// Versión optimizada para Azure App Service
// archivo: app.js

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

// Middleware de seguridad y rendimiento
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',  // Configurable para producción
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para registrar peticiones (útil para debugging en Azure)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
  res.json({ 
    message: 'Backend de Barbería ByL funcionando correctamente en Azure',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta para health check (recomendado para Azure App Service)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }
  });
});

// Escuchar en todas las interfaces de red (requerido por Azure)
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en ${HOST}:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejar señales de cierre para un apagado limpio
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});

module.exports = app;