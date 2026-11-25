import express from 'express';
import { getDB } from '../db/database.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/productos?q=busqueda
router.get('/', authMiddleware, (req, res) => {
  const db = getDB();
  const { q } = req.query;
  let sql = `
    SELECT p.*, c.nombre as categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.activo = 1
  `;
  const params = [];
  if (q) {
    sql += ` AND (p.nombre_comercial LIKE ? OR p.principio_activo LIKE ? OR p.codigo LIKE ?)`;
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY p.nombre_comercial';
  const productos = db.prepare(sql).all(...params);
  res.json(productos);
});

// GET /api/productos/:id con lotes FEFO
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const producto = db.prepare(`
    SELECT p.*, c.nombre as categoria_nombre
    FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.id = ? AND p.activo = 1
  `).get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

  // Lotes FEFO - más próximo a vencer primero
  const lotes = db.prepare(`
    SELECT l.*, prov.razon_social as proveedor_nombre
    FROM lotes_inventario l
    LEFT JOIN proveedores prov ON l.proveedor_id = prov.id
    WHERE l.producto_id = ? AND l.cantidad_disponible > 0
    ORDER BY l.fecha_vencimiento ASC
  `).all(req.params.id);

  res.json({ ...producto, lotes });
});

// POST /api/productos (admin)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDB();
  const { codigo, nombre_comercial, principio_activo, presentacion, precio_venta, stock_actual, stock_minimo, categoria_id } = req.body;
  if (!codigo || !nombre_comercial) return res.status(400).json({ error: 'Código y nombre son requeridos' });
  
  const exists = db.prepare('SELECT id FROM productos WHERE codigo = ?').get(codigo);
  if (exists) return res.status(400).json({ error: 'Código de producto ya existe' });

  const result = db.prepare(`
    INSERT INTO productos (codigo, nombre_comercial, principio_activo, presentacion, precio_venta, stock_actual, stock_minimo, categoria_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(codigo, nombre_comercial, principio_activo || null, presentacion || null, precio_venta || 0, stock_actual || 0, stock_minimo || 10, categoria_id || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Producto creado' });
});

// PUT /api/productos/:id (admin)
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDB();
  const { nombre_comercial, principio_activo, presentacion, precio_venta, stock_minimo, categoria_id } = req.body;
  db.prepare(`
    UPDATE productos SET nombre_comercial=?, principio_activo=?, presentacion=?, precio_venta=?, stock_minimo=?, categoria_id=?
    WHERE id=?
  `).run(nombre_comercial, principio_activo, presentacion, precio_venta, stock_minimo, categoria_id, req.params.id);
  res.json({ message: 'Producto actualizado' });
});

// DELETE /api/productos/:id (admin - soft delete)
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDB();
  db.prepare('UPDATE productos SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Producto desactivado' });
});

export default router;
