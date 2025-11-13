// Configuración de la base de datos
     // archivo: config/db.js
     
     const mysql = require('mysql2');
     require('dotenv').config();
     
     const connection = mysql.createConnection({
       host: process.env.DB_HOST || 'localhost',
       user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'barberia_byl',
      ssl: {
        rejectUnauthorized: true
      },
      connectTimeout: 60000 // 60 segundos
    });
   
    connection.connect((err) => {
      if (err) {
        console.error('Error conectando a la base de datos:', err);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
          console.error('Verifica el nombre de usuario y contraseña');
        } else if (err.code === 'ECONNREFUSED') {
          console.error('Verifica que el host y puerto sean correctos');
        } else if (err.message.includes('SSL')) {
          console.error('Verifica la configuración SSL');
        }
        return;
      }
      console.log('Conexión a base de datos MySQL exitosa');
  });
  
    module.exports = connection;