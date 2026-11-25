import express from 'express';
import { getDB } from '../db/database.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, (_, res) => {
  const prov = getDB().prepare('SELECT * FROM proveedores ORDER BY razon_social').all();
  res.json(prov);
});

router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { ruc, razon_social, telefono, contacto } = req.body;
  if (!ruc || !razon_social) return res.status(400).json({ error: 'RUC y razón social requeridos' });
  const result = getDB().prepare(
    'INSERT INTO proveedores (ruc, razon_social, telefono, contacto) VALUES (?,?,?,?)'
  ).run(ruc, razon_social, telefono || null, contacto || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const { ruc, razon_social, telefono, contacto } = req.body;
  getDB().prepare(
    'UPDATE proveedores SET ruc=?, razon_social=?, telefono=?, contacto=? WHERE id=?'
  ).run(ruc, razon_social, telefono, contacto, req.params.id);
  res.json({ message: 'Proveedor actualizado' });
});

router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  getDB().prepare('DELETE FROM proveedores WHERE id = ?').run(req.params.id);
  res.json({ message: 'Proveedor eliminado' });
});

export default router;
