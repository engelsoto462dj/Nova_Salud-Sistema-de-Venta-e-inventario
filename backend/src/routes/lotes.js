import express from 'express';
import { getDB } from '../db/database.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET lotes de un producto (FEFO)
router.get('/producto/:productoId', authMiddleware, (req, res) => {
  const lotes = getDB().prepare(`
    SELECT l.*, prov.razon_social as proveedor_nombre
    FROM lotes_inventario l
    LEFT JOIN proveedores prov ON l.proveedor_id = prov.id
    WHERE l.producto_id = ?
    ORDER BY l.fecha_vencimiento ASC
  `).all(req.params.productoId);
  res.json(lotes);
});

// GET todos los lotes
router.get('/', authMiddleware, adminOnly, (req, res) => {
  const lotes = getDB().prepare(`
    SELECT l.*, p.nombre_comercial, p.codigo, prov.razon_social as proveedor_nombre
    FROM lotes_inventario l
    JOIN productos p ON l.producto_id = p.id
    LEFT JOIN proveedores prov ON l.proveedor_id = prov.id
    ORDER BY l.fecha_vencimiento ASC
  `).all();
  res.json(lotes);
});

// POST nuevo lote (ingreso de mercadería)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDB();
  const { producto_id, proveedor_id, numero_lote, fecha_vencimiento, cantidad_disponible, precio_compra } = req.body;
  if (!producto_id || !numero_lote || !fecha_vencimiento || !cantidad_disponible) {
    return res.status(400).json({ error: 'Datos incompletos del lote' });
  }

  const ingresar = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO lotes_inventario (producto_id, proveedor_id, numero_lote, fecha_vencimiento, cantidad_disponible, precio_compra)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(producto_id, proveedor_id || null, numero_lote, fecha_vencimiento, cantidad_disponible, precio_compra || 0);

    // Actualizar stock del producto
    db.prepare('UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?')
      .run(cantidad_disponible, producto_id);

    return result;
  });

  const result = ingresar();
  res.status(201).json({ id: result.lastInsertRowid, message: 'Lote registrado y stock actualizado' });
});

export default router;
