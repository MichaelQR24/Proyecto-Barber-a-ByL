// Script para crear un hash de contraseña
// archivo: create_hash.js

const bcrypt = require('bcryptjs');

// Contraseña que quieres usar para el admin
const password = 'admin123';

// Generar el hash
bcrypt.hash(password, 10, function(err, hash) {
  if (err) {
    console.error('Error al generar el hash:', err);
    return;
  }
  
  console.log('Contraseña original:', password);
  console.log('Hash generado:', hash);
  
  // Consulta SQL para actualizar la contraseña del admin
  console.log('\nConsulta SQL para actualizar la contraseña:');
  console.log(`UPDATE usuarios SET password = '${hash}' WHERE email = 'admin@barberiabyl.com';`);
});