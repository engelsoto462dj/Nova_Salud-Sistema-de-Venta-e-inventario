import express from 'express';
import { getDB } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Alertas: sin stock + stock bajo + lotes próximos a vencer
router.get('/', authMiddleware, (req, res) => {
  const db = getDB();

  const sinStock = db.prepare(`
    SELECT p.id, p.codigo, p.nombre_comercial, p.stock_actual, p.stock_minimo,
           c.nombre as categoria
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.stock_actual = 0 AND p.activo = 1
    ORDER BY p.nombre_comercial ASC
  `).all();

  const stockBajo = db.prepare(`
    SELECT p.id, p.codigo, p.nombre_comercial, p.stock_actual, p.stock_minimo,
           c.nombre as categoria
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.stock_actual > 0 AND p.stock_actual <= p.stock_minimo AND p.activo = 1
    ORDER BY (p.stock_actual * 1.0 / NULLIF(p.stock_minimo,0)) ASC
  `).all();

  const proximosVencer = db.prepare(`
    SELECT l.id, l.numero_lote, l.fecha_vencimiento, l.cantidad_disponible,
           p.nombre_comercial, p.codigo
    FROM lotes_inventario l
    JOIN productos p ON l.producto_id = p.id
    WHERE l.cantidad_disponible > 0
      AND julianday(l.fecha_vencimiento) - julianday('now') <= 30
      AND julianday(l.fecha_vencimiento) >= julianday('now')
    ORDER BY l.fecha_vencimiento ASC
  `).all();

  const vencidos = db.prepare(`
    SELECT l.id, l.numero_lote, l.fecha_vencimiento, l.cantidad_disponible,
           p.nombre_comercial, p.codigo
    FROM lotes_inventario l
    JOIN productos p ON l.producto_id = p.id
    WHERE l.cantidad_disponible > 0
      AND julianday(l.fecha_vencimiento) < julianday('now')
    ORDER BY l.fecha_vencimiento ASC
  `).all();

  res.json({ sinStock, stockBajo, proximosVencer, vencidos });
});

export default router;
