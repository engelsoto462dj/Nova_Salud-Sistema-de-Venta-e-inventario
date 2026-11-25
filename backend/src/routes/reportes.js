import express from 'express';
import { getDB } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Dashboard stats del día
router.get('/dashboard', authMiddleware, (req, res) => {
  const db = getDB();
  const hoy = new Date().toISOString().split('T')[0];

  const ventasHoy = db.prepare(`
    SELECT COUNT(*) as num_ventas, COALESCE(SUM(total),0) as total_ventas
    FROM ventas WHERE DATE(fecha_hora) = ?
  `).get(hoy);

  const sinStockCount = db.prepare(`
    SELECT COUNT(*) as n FROM productos
    WHERE stock_actual = 0 AND activo = 1
  `).get().n;

  const stockBajoCount = db.prepare(`
    SELECT COUNT(*) as n FROM productos
    WHERE stock_actual > 0 AND stock_actual <= stock_minimo AND activo = 1
  `).get().n;

  const proximosVencerCount = db.prepare(`
    SELECT COUNT(*) as n FROM lotes_inventario
    WHERE cantidad_disponible > 0
      AND julianday(fecha_vencimiento) - julianday('now') <= 30
      AND julianday(fecha_vencimiento) >= julianday('now')
  `).get().n;

  const ultimas5Ventas = db.prepare(`
    SELECT v.*, u.nombre as vendedor_nombre
    FROM ventas v LEFT JOIN usuarios u ON v.usuario_id = u.id
    ORDER BY v.fecha_hora DESC LIMIT 5
  `).all();

  res.json({
    ventasHoy: ventasHoy.num_ventas,
    totalVentasHoy: ventasHoy.total_ventas,
    sinStockCount,
    stockBajoCount,
    proximosVencerCount,
    ultimas5Ventas
  });
});

// Top productos más vendidos
router.get('/mas-vendidos', authMiddleware, (req, res) => {
  const db = getDB();
  const { dias = 30 } = req.query;
  const productos = db.prepare(`
    SELECT p.nombre_comercial, p.codigo, p.presentacion,
           SUM(dv.cantidad) as total_unidades,
           SUM(dv.subtotal) as total_ingresos
    FROM detalle_ventas dv
    JOIN productos p ON dv.producto_id = p.id
    JOIN ventas v ON dv.venta_id = v.id
    WHERE julianday('now') - julianday(v.fecha_hora) <= ?
    GROUP BY p.id
    ORDER BY total_unidades DESC
    LIMIT 10
  `).all(dias);
  res.json(productos);
});

// Reporte de ventas por rango de fechas
router.get('/ventas', authMiddleware, (req, res) => {
  const db = getDB();
  const { desde, hasta } = req.query;
  let sql = `
    SELECT v.*, u.nombre as vendedor_nombre
    FROM ventas v LEFT JOIN usuarios u ON v.usuario_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (desde) { sql += ' AND DATE(v.fecha_hora) >= ?'; params.push(desde); }
  if (hasta) { sql += ' AND DATE(v.fecha_hora) <= ?'; params.push(hasta); }
  sql += ' ORDER BY v.fecha_hora DESC';
  res.json(db.prepare(sql).all(...params));
});

// Productos con stock bajo
router.get('/stock-bajo', authMiddleware, (req, res) => {
  const db = getDB();
  const productos = db.prepare(`
    SELECT p.*, c.nombre as categoria
    FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.stock_actual <= p.stock_minimo AND p.activo = 1
    ORDER BY p.stock_actual ASC
  `).all();
  res.json(productos);
});

export default router;
