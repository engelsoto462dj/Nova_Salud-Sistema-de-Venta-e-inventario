import express from 'express';
import { getDB } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Generar número de comprobante único
function generarComprobante(db) {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const count = db.prepare("SELECT COUNT(*) as n FROM ventas WHERE fecha_hora LIKE ?").get(`${yyyy}-${mm}-${dd}%`).n;
  return `B001-${yyyy}${mm}${dd}-${String(count + 1).padStart(4, '0')}`;
}

// POST /api/ventas - Registrar venta con transacción atómica FEFO
router.post('/', authMiddleware, (req, res) => {
  const db = getDB();
  const { items, cliente_nombre, cliente_doc } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'El carrito no puede estar vacío' });
  }

  const registrarVenta = db.transaction(() => {
    const numero_comprobante = generarComprobante(db);
    let subtotal = 0;

    // Validar stock y calcular totales
    const detalles = [];
    for (const item of items) {
      const { producto_id, cantidad, precio_unitario } = item;

      // FEFO: obtener lotes con stock, ordenados por fecha de vencimiento más próxima
      const lotes = db.prepare(`
        SELECT * FROM lotes_inventario
        WHERE producto_id = ? AND cantidad_disponible > 0
        ORDER BY fecha_vencimiento ASC
      `).all(producto_id);

      let restante = cantidad;
      const lotesUsados = [];

      for (const lote of lotes) {
        if (restante <= 0) break;
        const tomar = Math.min(restante, lote.cantidad_disponible);
        lotesUsados.push({ lote_id: lote.id, cantidad: tomar });
        restante -= tomar;
      }

      if (restante > 0) {
        throw new Error(`Stock insuficiente para producto ID ${producto_id}`);
      }

      for (const lu of lotesUsados) {
        detalles.push({
          producto_id,
          lote_id: lu.lote_id,
          cantidad: lu.cantidad,
          precio_unitario,
          subtotal_item: lu.cantidad * precio_unitario
        });
        subtotal += lu.cantidad * precio_unitario;
      }
    }

    const igv = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + igv) * 100) / 100;

    // Insertar venta
    const ventaResult = db.prepare(`
      INSERT INTO ventas (numero_comprobante, usuario_id, cliente_nombre, cliente_doc, subtotal, igv, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(numero_comprobante, req.user.id, cliente_nombre || null, cliente_doc || null, subtotal, igv, total);

    const venta_id = ventaResult.lastInsertRowid;

    // Insertar detalles y descontar stock (atómico)
    for (const d of detalles) {
      db.prepare(`
        INSERT INTO detalle_ventas (venta_id, producto_id, lote_id, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(venta_id, d.producto_id, d.lote_id, d.cantidad, d.precio_unitario, d.subtotal_item);

      // Descontar lote
      db.prepare('UPDATE lotes_inventario SET cantidad_disponible = cantidad_disponible - ? WHERE id = ?')
        .run(d.cantidad, d.lote_id);

      // Descontar stock del producto
      db.prepare('UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?')
        .run(d.cantidad, d.producto_id);
    }

    return { venta_id, numero_comprobante, subtotal, igv, total };
  });

  try {
    const result = registrarVenta();
    // Obtener venta completa para ticket
    const venta = db.prepare('SELECT * FROM ventas WHERE id = ?').get(result.venta_id);
    const detalleCompleto = db.prepare(`
      SELECT dv.*, p.nombre_comercial, p.codigo, l.numero_lote, l.fecha_vencimiento
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      JOIN lotes_inventario l ON dv.lote_id = l.id
      WHERE dv.venta_id = ?
    `).all(result.venta_id);

    res.status(201).json({ ...venta, detalle: detalleCompleto });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/ventas - Listado
router.get('/', authMiddleware, (req, res) => {
  const db = getDB();
  const { fecha } = req.query;
  let sql = `
    SELECT v.*, u.nombre as vendedor_nombre
    FROM ventas v LEFT JOIN usuarios u ON v.usuario_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (fecha) { sql += ' AND DATE(v.fecha_hora) = ?'; params.push(fecha); }
  sql += ' ORDER BY v.fecha_hora DESC LIMIT 200';

  const ventas = db.prepare(sql).all(...params);
  res.json(ventas);
});

// GET /api/ventas/:id - Detalle
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const venta = db.prepare(`
    SELECT v.*, u.nombre as vendedor_nombre
    FROM ventas v LEFT JOIN usuarios u ON v.usuario_id = u.id
    WHERE v.id = ?
  `).get(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

  const detalle = db.prepare(`
    SELECT dv.*, p.nombre_comercial, p.codigo, p.presentacion, l.numero_lote, l.fecha_vencimiento
    FROM detalle_ventas dv
    JOIN productos p ON dv.producto_id = p.id
    JOIN lotes_inventario l ON dv.lote_id = l.id
    WHERE dv.venta_id = ?
  `).all(req.params.id);

  res.json({ ...venta, detalle });
});

export default router;
