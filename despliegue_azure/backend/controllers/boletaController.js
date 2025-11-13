// archivo: controllers/boletaController.js

const boletaController = {
  // Obtener todas las boletas
  getAll: (req, res) => {
    // Solo los administradores pueden ver todas las boletas
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver todas las boletas.' });
    }
    
    const query = `
      SELECT 
        b.id,
        b.cliente_id,
        COALESCE(b.cliente_nombre, u.nombre) as cliente_nombre,
        b.fecha,
        b.estado_pago,
        b.total,
        COUNT(db.id) as items_count,
        GROUP_CONCAT(db.descripcion SEPARATOR ', ') as items_detalle
      FROM boletas b
      LEFT JOIN usuarios u ON b.cliente_id = u.id
      LEFT JOIN detalle_boleta db ON b.id = db.boleta_id
      GROUP BY b.id
      ORDER BY b.fecha DESC
    `;
    
    req.db.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener boletas:', err);
        return res.status(500).json({ message: 'Error al obtener boletas', error: err.message });
      }
      res.json({ boletas: results });
    });
  },

  // Obtener boleta por ID
  getById: (req, res) => {
    const { id } = req.params;
    
    // Los administradores pueden ver cualquier boleta
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver boletas.' });
    }
    
    const query = `
      SELECT 
        b.id,
        b.cliente_id,
        COALESCE(b.cliente_nombre, u.nombre) as cliente_nombre,
        b.fecha,
        b.estado_pago,
        b.total,
        COUNT(db.id) as items_count,
        GROUP_CONCAT(db.descripcion SEPARATOR ', ') as items_detalle
      FROM boletas b
      LEFT JOIN usuarios u ON b.cliente_id = u.id
      LEFT JOIN detalle_boleta db ON b.id = db.boleta_id
      WHERE b.id = ?
      GROUP BY b.id
    `;
    
    req.db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error al obtener boleta:', err);
        return res.status(500).json({ message: 'Error al obtener boleta', error: err.message });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Boleta no encontrada' });
      }
      
      res.json({ boleta: results[0] });
    });
  },

  // Crear nueva boleta
  create: (req, res) => {
    const { cliente_id, cliente_nombre, estado_pago, total, items } = req.body;  // Añadir items
    
    // Validar campos requeridos
    if (!cliente_id || !total) {
      return res.status(400).json({ message: 'Cliente ID y total son obligatorios' });
    }
    
    // Solo los administradores pueden crear boletas
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden crear boletas.' });
    }
    
    // Valor por defecto para estado_pago
    const estado = estado_pago || 'pendiente';
    
    const query = 'INSERT INTO boletas (cliente_id, cliente_nombre, estado_pago, total) VALUES (?, ?, ?, ?)';
    
    req.db.query(query, [cliente_id, cliente_nombre, estado, total], (err, result) => {
      if (err) {
        console.error('Error al crear boleta:', err);
        return res.status(500).json({ message: 'Error al crear boleta', error: err.message });
      }
      
      const boletaId = result.insertId;
      
      // Si hay items, crear registros en detalle_boleta
      if (items && items.length > 0) {
        let detallesPendientes = items.length;
        let errores = 0;
        
        items.forEach(item => {
          const detalleQuery = 'INSERT INTO detalle_boleta (boleta_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, 1, ?, ?)';
          const precio = item.precio || item.precio_unitario || 0;
          const subtotal = precio; // En este caso, cantidad es 1
          
          req.db.query(detalleQuery, [boletaId, item.descripcion || '', precio, subtotal], (err, detalleResult) => {
            if (err) {
              console.error('Error al crear detalle de boleta:', err);
              errores++;
            }
            
            detallesPendientes--;
            
            // Responder cuando se hayan procesado todos los detalles
            if (detallesPendientes === 0) {
              if (errores === 0) {
                res.status(201).json({ message: 'Boleta y detalles creados exitosamente', id: boletaId });
              } else {
                res.status(201).json({ 
                  message: 'Boleta creada con algunos errores en los detalles', 
                  id: boletaId,
                  detallesError: errores
                });
              }
            }
          });
        });
      } else {
        res.status(201).json({ message: 'Boleta creada exitosamente', id: boletaId });
      }
    });
  },

  // Actualizar boleta
  update: (req, res) => {
    const { id } = req.params;
    const { cliente_id, cliente_nombre, estado_pago, total } = req.body;
    
    // Validar que al menos un campo esté presente para actualizar
    if (!estado_pago && !cliente_id && !cliente_nombre && total === undefined) {
      return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar (estado_pago, cliente_id, cliente_nombre o total)' });
    }
    
    // Solo los administradores pueden actualizar boletas
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden actualizar boletas.' });
    }
    
    // Construir la consulta dinámicamente según los campos proporcionados
    const updates = [];
    const params = [];
    
    if (cliente_id !== undefined) {
      updates.push('cliente_id = ?');
      params.push(cliente_id);
    }
    
    if (cliente_nombre !== undefined) {
      updates.push('cliente_nombre = ?');
      params.push(cliente_nombre);
    }
    
    if (estado_pago !== undefined) {
      updates.push('estado_pago = ?');
      params.push(estado_pago);
    }
    
    if (total !== undefined) {
      updates.push('total = ?');
      params.push(total);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos válidos para actualizar' });
    }
    
    const query = `UPDATE boletas SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);
    
    req.db.query(query, params, (err, result) => {
      if (err) {
        console.error('Error al actualizar boleta:', err);
        return res.status(500).json({ message: 'Error al actualizar boleta', error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Boleta no encontrada' });
      }
      
      res.json({ message: 'Boleta actualizada exitosamente' });
    });
  },

  // Eliminar boleta
  delete: (req, res) => {
    const { id } = req.params;
    
    // Solo los administradores pueden eliminar boletas
    if (req.userRol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden eliminar boletas.' });
    }
    
    const query = 'DELETE FROM boletas WHERE id = ?';
    
    req.db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Error al eliminar boleta:', err);
        return res.status(500).json({ message: 'Error al eliminar boleta', error: err.message });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Boleta no encontrada' });
      }
      
      res.json({ message: 'Boleta eliminada exitosamente' });
    });
  }
};

module.exports = boletaController;