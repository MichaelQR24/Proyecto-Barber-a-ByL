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
        COALESCE(b.cliente_nombre, u.nombre, CONCAT('Cliente ID: ', b.cliente_id)) as cliente_nombre,
        b.fecha,
        b.estado_pago,
        b.total,
        COUNT(db.id) as items_count,
        GROUP_CONCAT(
          COALESCE(
            CONCAT(COALESCE(p.nombre, s.nombre, db.descripcion), ' - ', db.cantidad, ' x S/ ', db.precio_unitario),
            CONCAT(s.nombre, ' - ', db.cantidad, ' x S/ ', db.precio_unitario),
            db.descripcion
          ) SEPARATOR '; '
        ) as items_detalle
      FROM boletas b
      LEFT JOIN usuarios u ON b.cliente_id = u.id
      LEFT JOIN detalle_boleta db ON b.id = db.boleta_id
      LEFT JOIN productos p ON db.producto_id = p.id
      LEFT JOIN servicios s ON db.servicio_id = s.id
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

    // Primero obtener los datos básicos de la boleta
    const boletaQuery = `
      SELECT
        b.id,
        b.cliente_id,
        COALESCE(b.cliente_nombre, u.nombre) as cliente_nombre,
        b.fecha,
        b.estado_pago,
        b.total
      FROM boletas b
      LEFT JOIN usuarios u ON b.cliente_id = u.id
      WHERE b.id = ?
    `;

    req.db.query(boletaQuery, [id], (err, boletaResult) => {
      if (err) {
        console.error('Error al obtener boleta:', err);
        return res.status(500).json({ message: 'Error al obtener boleta', error: err.message });
      }

      if (boletaResult.length === 0) {
        return res.status(404).json({ message: 'Boleta no encontrada' });
      }

      const boleta = boletaResult[0];

      // Luego obtener los detalles de la boleta
      const detallesQuery = `
        SELECT 
          db.id,
          db.descripcion,
          db.cantidad,
          db.precio_unitario,
          db.subtotal,
          COALESCE(p.nombre, s.nombre, db.descripcion) as nombre_item
        FROM detalle_boleta db
        LEFT JOIN productos p ON db.producto_id = p.id
        LEFT JOIN servicios s ON db.servicio_id = s.id
        WHERE db.boleta_id = ?
        ORDER BY db.id
      `;

      req.db.query(detallesQuery, [id], (err, detallesResult) => {
        if (err) {
          console.error('Error al obtener detalles de boleta:', err);
          return res.status(500).json({ message: 'Error al obtener detalles de boleta', error: err.message });
        }

        // Añadir detalles a la boleta
        boleta.detalles = detallesResult;
        
        // Crear items_detalle como una concatenación de todos los nombres
        if (detallesResult.length > 0) {
          boleta.items_detalle = detallesResult.map(det => 
            `${det.nombre_item} - ${det.cantidad} x S/ ${det.precio_unitario}`
          ).join('; ');
          boleta.items_count = detallesResult.length;
        } else {
          boleta.items_detalle = 'Sin items';
          boleta.items_count = 0;
        }

        res.json({ boleta: boleta });
      });
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
          const detalleQuery = 'INSERT INTO detalle_boleta (boleta_id, producto_id, servicio_id, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)';
          const productoId = item.producto_id || null;
          const servicioId = item.servicio_id || null;
          const descripcion = item.descripcion || (productoId ? 'Producto' : (servicioId ? 'Servicio' : 'Item'));
          const cantidad = item.cantidad || 1;
          const precio = item.precio || item.precio_unitario || 0;
          const subtotal = (precio * cantidad);

          req.db.query(detalleQuery, [boletaId, productoId, servicioId, descripcion, cantidad, precio, subtotal], (err, detalleResult) => {
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

    // Asegurarse de que el id es un número entero
    const boletaId = parseInt(id, 10);
    if (isNaN(boletaId)) {
      console.error('ID de boleta no válido:', id);
      return res.status(400).json({ message: 'ID de boleta no válido' });
    }

    console.log(`Intentando eliminar boleta con ID: ${boletaId}`);

    // Usar transacción para garantizar el orden correcto de operaciones
    req.db.beginTransaction((err) => {
      if (err) {
        console.error('Error al iniciar transacción:', err);
        return res.status(500).json({ message: 'Error interno del servidor', error: err.message });
      }

      // Intentar eliminar los detalles y luego la boleta principal
      const deleteDetallesQuery = 'DELETE FROM detalle_boleta WHERE boleta_id = ?';
      const deleteBoletaQuery = 'DELETE FROM boletas WHERE id = ?';

      // Eliminar primero los detalles de la boleta
      req.db.query(deleteDetallesQuery, [boletaId], (err, detallesResult) => {
        if (err) {
          console.error('Error al eliminar detalles de boleta:', err);
          req.db.rollback(() => {
            return res.status(500).json({ 
              message: 'Error al eliminar detalles de boleta', 
              error: err.sqlMessage || err.message,
              code: err.code
            });
          });
          return;
        }

        console.log(`Registros afectados en detalles: ${detallesResult.affectedRows}`);
        
        // Ahora eliminar la boleta principal
        req.db.query(deleteBoletaQuery, [boletaId], (err, boletaResult) => {
          if (err) {
            console.error('Error al eliminar boleta principal:', err);
            req.db.rollback(() => {
              return res.status(500).json({ 
                message: 'Error al eliminar boleta principal', 
                error: err.sqlMessage || err.message,
                code: err.code
              });
            });
            return;
          }

          console.log(`Registros afectados en boleta principal: ${boletaResult.affectedRows}`);
          
          if (boletaResult.affectedRows === 0) {
            req.db.rollback(() => {
              return res.status(404).json({ message: 'Boleta no encontrada' });
            });
            return;
          }

          // Confirmar la transacción
          req.db.commit((err) => {
            if (err) {
              console.error('Error al confirmar transacción:', err);
              req.db.rollback(() => {
                return res.status(500).json({ message: 'Error al confirmar operación', error: err.message });
              });
              return;
            }

            res.json({ message: 'Boleta eliminada exitosamente' });
          });
        });
      });
    });
  }
};

module.exports = boletaController;