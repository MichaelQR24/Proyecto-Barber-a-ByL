// Archivo de prueba para verificar la conexión a la base de datos en Azure
// Uso: node test_db_connection.js

require('dotenv').config();
const mysql = require('mysql2');

console.log('='.repeat(60));
console.log('         Prueba de conexión a Azure Database for MySQL');
console.log('='.repeat(60));
console.log();

// Verificar que las variables de entorno estén definidas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingEnvVars.join(', '));
  console.error('Asegúrate de tener un archivo .env con las credenciales correctas de Azure');
  console.error('Ejemplo de contenido para .env:');
  console.error('DB_HOST=nombre-servidor.mysql.database.azure.com');
  console.error('DB_USER=nombre-usuario'); // Nota: NO incluye @servidor
  console.error('DB_NAME=nombre-base-datos');
  console.error('DB_PASSWORD=contraseña');
  process.exit(1);
}

// Configuración de la conexión específica para Azure Database for MySQL
const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: {
    rejectUnauthorized: true
  },
  // Opciones válidas para MySQL2
  connectTimeout: 60000, // 60 segundos
  timeout: 60000,
  // Ajustes para manejar la latencia de conexión a la nube
  reconnect: true
};

console.log('Configuración de conexión:');
console.log(`- Host: ${connectionConfig.host}`);
console.log(`- Usuario: ${connectionConfig.user}`);
console.log(`- Base de datos: ${connectionConfig.database}`);
console.log(`- Puerto: ${connectionConfig.port}`);
console.log('- SSL: Configurado (requisito de Azure)\n');

// Crear conexión
let connection;
try {
  connection = mysql.createConnection(connectionConfig);
} catch (err) {
  console.error('❌ Error creando la conexión:', err.message);
  process.exit(1);
}

// Medir tiempo de conexión
const startTime = Date.now();

connection.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos de Azure:');
    console.error('- Código:', err.code);
    console.error('- Número:', err.errno);
    console.error('- Mensaje:', err.message);

    // Sugerencias específicas según el error
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Posibles causas:');
      console.log('  - Firewall de Azure no permite la conexión');
      console.log('  - Servidor MySQL no está en estado activo');
      console.log('  - Puerto incorrecto (debe ser 3306)');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Posibles causas:');
      console.log('  - Nombre de usuario o contraseña incorrecta');
      console.log('  - Formato de usuario incorrecto (debe ser solo el nombre de usuario, no usuario@servidor)');
    } else if (err.code === 'ENOTFOUND' || err.errno === -3008) {
      console.log('\n💡 Posibles causas:');
      console.log('  - Nombre de host incorrecto');
      console.log('  - Problemas de DNS o red');
    } else if (err.message.includes('SSL')) {
      console.log('\n💡 Posibles causas:');
      console.log('  - Configuración SSL incorrecta');
      console.log('  - Certificado no válido');
    }

    connection.end();
    process.exit(1);
  }

  const connectionTime = Date.now() - startTime;
  console.log(`✅ Conexión exitosa a la base de datos de Azure en ${connectionTime}ms`);
  console.log('Información de la conexión:');
  console.log(`- ID de conexión: ${connection.threadId}`);
  console.log(`- Host: ${connectionConfig.host}`);
  console.log(`- Puerto: ${connectionConfig.port}`);
  console.log(`- Usuario: ${connectionConfig.user}`);
  console.log(`- Base de datos: ${connectionConfig.database}\n`);

  // Realizar una consulta simple para verificar que podemos interactuar con la base de datos
  console.log('Ejecutando consulta de prueba...');
  
  connection.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta de prueba:', err.message);
      connection.end();
      process.exit(1);
    }

    console.log('✅ Consulta de prueba exitosa:');
    console.log(`- Resultado: ${results[0].solution}\n`);

    // Verificar información del servidor (útil para confirmar conexión con Azure)
    connection.query('SELECT VERSION() as version, @@version_comment as comment', (err, results) => {
      if (err) {
        console.error('❌ Error obteniendo información del servidor:', err.message);
      } else {
        console.log('🔍 Información del servidor:');
        console.log(`- Versión: ${results[0].version}`);
        console.log(`- Comentario: ${results[0].comment || 'No disponible'}\n`);
      }

      // Intentar verificar si existen las tablas principales
      const tablesToCheck = ['productos', 'servicios', 'usuarios', 'reservas', 'boletas'];
      let tablesChecked = 0;

      console.log('🔍 Verificando tablas principales...');
      tablesToCheck.forEach(table => {
        connection.query(`SHOW TABLES LIKE '${table}'`, (err, result) => {
          if (err) {
            console.error(`❌ Error verificando la tabla ${table}:`, err.message);
          } else {
            if (result.length > 0) {
              console.log(`✅ Tabla '${table}' existe`);
            } else {
              console.log(`⚠️  Tabla '${table}' no encontrada`);
            }
          }

          tablesChecked++;
          if (tablesChecked === tablesToCheck.length) {
            // Verificar si hay productos en la base de datos como prueba completa
            connection.query('SELECT COUNT(*) as count FROM productos', (err, result) => {
              if (err) {
                if (err.errno === 1146) { // Table doesn't exist
                  console.log(`\n📊 Tabla 'productos' no encontrada`);
                } else {
                  console.error('❌ Error contando productos:', err.message);
                }
              } else {
                console.log(`\n📊 Hay ${result[0].count} productos en la base de datos`);
              }

              // Verificar conexión a Azure Database for MySQL
              connection.query("SHOW VARIABLES LIKE 'have_ssl'", (err, result) => {
                if (err) {
                  console.error('❌ Error verificando SSL:', err.message);
                } else {
                  const sslEnabled = result[0]?.Value === 'YES' ? 'Sí' : 'No';
                  console.log(`🔒 SSL habilitado en el servidor: ${sslEnabled}`);
                }

                console.log('\n🎉 Prueba de conexión completada exitosamente');
                console.log('✅ La base de datos de Azure está accesible y funcional');
                
                // Cerrar la conexión
                connection.end(() => {
                  console.log('🔒 Conexión cerrada');
                  console.log('='.repeat(60));
                  process.exit(0);
                });
              });
            });
          }
        });
      });
    });
  });
});

// Manejar errores de conexión no capturados
connection.on('error', (err) => {
  console.error('❌ Error de conexión no manejado:', err.message);
  process.exit(1);
});

// Manejar timeout de conexión
connection.on('connect', () => {
  // Una vez conectado, establecer un timeout más largo para operaciones
  connection.query('SET SESSION wait_timeout=28800', (err) => {
    if (err) {
      console.warn('⚠️  No se pudo configurar el timeout de sesión:', err.message);
    }
  });
});