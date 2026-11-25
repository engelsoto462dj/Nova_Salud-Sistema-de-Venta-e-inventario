import express from 'express';
import { getDB } from '../db/database.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, (_, res) => {
  const categorias = getDB().prepare('SELECT * FROM categorias ORDER BY nombre').all();
  res.json(categorias);
});

router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  const result = getDB().prepare('INSERT INTO categorias (nombre) VALUES (?)').run(nombre);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const { nombre } = req.body;
  getDB().prepare('UPDATE categorias SET nombre = ? WHERE id = ?').run(nombre, req.params.id);
  res.json({ message: 'Categoría actualizada' });
});

router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  getDB().prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
  res.json({ message: 'Categoría eliminada' });
});

export default router;
