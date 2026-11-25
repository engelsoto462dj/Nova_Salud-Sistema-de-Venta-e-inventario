import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'nova_salud.db');

let db;

export function getDB() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');

    // Polyfill db.transaction for node:sqlite compatibility
    db.transaction = (fn) => (...args) => {
      db.exec('BEGIN TRANSACTION');
      try {
        const res = fn(...args);
        db.exec('COMMIT');
        return res;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    };
  }
  return db;
}

export function initDB() {
  const database = getDB();

  database.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      usuario TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT CHECK(rol IN ('admin','vendedor')) NOT NULL DEFAULT 'vendedor',
      estado INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ruc TEXT UNIQUE NOT NULL,
      razon_social TEXT NOT NULL,
      telefono TEXT,
      contacto TEXT
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre_comercial TEXT NOT NULL,
      principio_activo TEXT,
      presentacion TEXT,
      precio_venta REAL NOT NULL DEFAULT 0,
      stock_actual INTEGER NOT NULL DEFAULT 0,
      stock_minimo INTEGER NOT NULL DEFAULT 10,
      categoria_id INTEGER REFERENCES categorias(id),
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS lotes_inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      proveedor_id INTEGER REFERENCES proveedores(id),
      numero_lote TEXT NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      cantidad_disponible INTEGER NOT NULL DEFAULT 0,
      precio_compra REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_comprobante TEXT UNIQUE NOT NULL,
      fecha_hora TEXT DEFAULT (datetime('now','localtime')),
      usuario_id INTEGER REFERENCES usuarios(id),
      cliente_nombre TEXT,
      cliente_doc TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      igv REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL REFERENCES ventas(id),
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      lote_id INTEGER NOT NULL REFERENCES lotes_inventario(id),
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL
    );
  `);

  console.log('✅ Base de datos inicializada (node:sqlite nativo)');
  return database;
}
