import bcrypt from 'bcryptjs';
import { getDB, initDB } from './database.js';

console.log('\n🌱 Iniciando seed de Nova Salud...\n');

initDB();

const db = getDB();

// Limpiar tablas para re-seed
db.exec(`
  DELETE FROM detalle_ventas;
  DELETE FROM ventas;
  DELETE FROM lotes_inventario;
  DELETE FROM productos;
  DELETE FROM proveedores;
  DELETE FROM categorias;
  DELETE FROM usuarios;
`);

// === USUARIOS ===
const hashAdmin = bcrypt.hashSync('admin123', 10);
const hashVendedor = bcrypt.hashSync('vendedor123', 10);

db.prepare(`INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES (?,?,?,?)`).run('Dr. Carlos Mendoza', 'admin', hashAdmin, 'admin');
db.prepare(`INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES (?,?,?,?)`).run('Ana Torres', 'vendedor1', hashVendedor, 'vendedor');
db.prepare(`INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES (?,?,?,?)`).run('Luis García', 'vendedor2', hashVendedor, 'vendedor');

console.log('✅ Usuarios creados');

// === CATEGORÍAS ===
const categorias = [
  'Analgésicos y Antiinflamatorios',
  'Antibióticos',
  'Antihistamínicos',
  'Antisépticos y Curaciones',
  'Vitaminas y Suplementos',
  'Antihipertensivos',
  'Antiácidos y Digestivos',
  'Antidiabéticos',
];

const catMap = {};
for (const nombre of categorias) {
  const r = db.prepare('INSERT INTO categorias (nombre) VALUES (?)').run(nombre);
  catMap[nombre] = r.lastInsertRowid;
}
console.log('✅ Categorías creadas');

// === PROVEEDORES ===
const prov1 = db.prepare('INSERT INTO proveedores (ruc, razon_social, telefono, contacto) VALUES (?,?,?,?)').run('20100012345', 'Distribuidora Farma Norte S.A.C.', '01-456-7890', 'Miguel Rios');
const prov2 = db.prepare('INSERT INTO proveedores (ruc, razon_social, telefono, contacto) VALUES (?,?,?,?)').run('20200023456', 'Laboratorios LIFE S.A.', '01-567-8901', 'Carmen Vega');
const prov3 = db.prepare('INSERT INTO proveedores (ruc, razon_social, telefono, contacto) VALUES (?,?,?,?)').run('20300034567', 'Química Suiza Corporativo S.A.', '01-678-9012', 'Roberto Chávez');
const p1 = prov1.lastInsertRowid, p2 = prov2.lastInsertRowid, p3 = prov3.lastInsertRowid;
console.log('✅ Proveedores creados');

// === PRODUCTOS CON STOCK REAL ===
// Función helper
const insertProducto = (codigo, nombre, principio, presentacion, precio, stock, minimo, cat) => {
  const r = db.prepare(`
    INSERT INTO productos (codigo, nombre_comercial, principio_activo, presentacion, precio_venta, stock_actual, stock_minimo, categoria_id)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(codigo, nombre, principio, presentacion, precio, stock, minimo, catMap[cat]);
  return r.lastInsertRowid;
};

const pid = {
  paracetamol500:   insertProducto('MED001','Paracetamol 500mg','Paracetamol','Tabletas x 10',1.50,250,50,'Analgésicos y Antiinflamatorios'),
  paracetamol1g:    insertProducto('MED002','Paracetamol 1g','Paracetamol','Tabletas x 8',2.20,80,30,'Analgésicos y Antiinflamatorios'),
  ibuprofeno400:    insertProducto('MED003','Ibuprofeno 400mg','Ibuprofeno','Tabletas x 10',2.80,180,40,'Analgésicos y Antiinflamatorios'),
  ibuprofeno600:    insertProducto('MED004','Ibuprofeno 600mg','Ibuprofeno','Tabletas x 10',3.50,60,20,'Analgésicos y Antiinflamatorios'),
  amoxicilina500:   insertProducto('MED005','Amoxicilina 500mg','Amoxicilina','Cápsulas x 21',12.90,120,30,'Antibióticos'),
  amoxiclav:        insertProducto('MED006','Augmentin 500/125mg','Amoxicilina + Clavulanato','Tabletas x 14',28.50,8,15,'Antibióticos'),   // STOCK BAJO
  azitromicina:     insertProducto('MED007','Azitromicina 500mg','Azitromicina','Tabletas x 3',9.80,45,20,'Antibióticos'),
  loratadina:       insertProducto('MED008','Loratadina 10mg','Loratadina','Tabletas x 10',3.20,200,50,'Antihistamínicos'),
  cetirizina:       insertProducto('MED009','Cetirizina 10mg','Cetirizina','Tabletas x 10',3.80,90,30,'Antihistamínicos'),
  alcoholYodado:    insertProducto('MED010','Alcohol Yodado 120ml','Yodo + Alcohol','Frasco 120ml',4.50,30,20,'Antisépticos y Curaciones'),
  alcoholEtilico:   insertProducto('MED011','Alcohol Etílico 70% 1L','Etanol 70%','Frasco 1 litro',7.90,5,25,'Antisépticos y Curaciones'),  // STOCK BAJO
  aguaOxigenada:    insertProducto('MED012','Agua Oxigenada 10vol 120ml','Peróxido de Hidrógeno','Frasco 120ml',3.20,70,20,'Antisépticos y Curaciones'),
  vitC:             insertProducto('MED013','Vitamina C 1000mg','Ácido Ascórbico','Tabletas x 10',5.50,160,40,'Vitaminas y Suplementos'),
  complVitB:        insertProducto('MED014','Complejo B Forte','Vitaminas B1,B6,B12','Tabletas x 30',8.90,110,25,'Vitaminas y Suplementos'),
  omeprazol:        insertProducto('MED015','Omeprazol 20mg','Omeprazol','Cápsulas x 14',6.20,140,30,'Antiácidos y Digestivos'),
  ranitidina:       insertProducto('MED016','Ranitidina 150mg','Ranitidina','Tabletas x 10',3.50,12,20,'Antiácidos y Digestivos'),          // STOCK BAJO
  enalapril:        insertProducto('MED017','Enalapril 10mg','Enalapril','Tabletas x 20',5.80,180,40,'Antihipertensivos'),
  amlodipino:       insertProducto('MED018','Amlodipino 5mg','Amlodipino','Tabletas x 30',8.20,95,30,'Antihipertensivos'),
  metformina:       insertProducto('MED019','Metformina 850mg','Metformina','Tabletas x 30',7.50,130,35,'Antidiabéticos'),
  diclofenaco:      insertProducto('MED020','Diclofenaco 75mg/3ml','Diclofenaco','Ampolla x 1',4.20,55,20,'Analgésicos y Antiinflamatorios'),
};

console.log('✅ Productos creados');

// === LOTES CON FECHAS REALES (algunos próximos a vencer) ===
const hoy = new Date();
const fechaFutura = (dias) => {
  const d = new Date(hoy); d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
};
const fechaPasada = (dias) => {
  const d = new Date(hoy); d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
};

const insertLote = (productoId, proveedorId, lote, fVen, cantidad, pCompra) => {
  db.prepare(`
    INSERT INTO lotes_inventario (producto_id, proveedor_id, numero_lote, fecha_vencimiento, cantidad_disponible, precio_compra)
    VALUES (?,?,?,?,?,?)
  `).run(productoId, proveedorId, lote, fVen, cantidad, pCompra);
};

// Paracetamol 500mg - 2 lotes normales
insertLote(pid.paracetamol500, p1, 'PAR-2024-001', fechaFutura(400), 150, 0.90);
insertLote(pid.paracetamol500, p2, 'PAR-2024-002', fechaFutura(600), 100, 0.85);

// Paracetamol 1g
insertLote(pid.paracetamol1g, p1, 'PAR1G-2024-001', fechaFutura(300), 80, 1.40);

// Ibuprofeno 400mg - lote próximo a vencer (20 días)
insertLote(pid.ibuprofeno400, p2, 'IBU-2024-001', fechaFutura(20), 50, 1.80);  // ⚠️ Próximo a vencer
insertLote(pid.ibuprofeno400, p1, 'IBU-2024-002', fechaFutura(500), 130, 1.75);

// Ibuprofeno 600mg
insertLote(pid.ibuprofeno600, p2, 'IBU6-2024-001', fechaFutura(450), 60, 2.20);

// Amoxicilina 500mg
insertLote(pid.amoxicilina500, p3, 'AMO-2024-001', fechaFutura(360), 70, 7.50);
insertLote(pid.amoxicilina500, p1, 'AMO-2024-002', fechaFutura(540), 50, 7.20);

// Augmentin - stock bajo, lote próximo a vencer (15 días)
insertLote(pid.amoxiclav, p3, 'AUG-2024-001', fechaFutura(15), 8, 18.00);     // ⚠️ Próximo a vencer + Stock bajo

// Azitromicina - lote próximo a vencer (25 días)
insertLote(pid.azitromicina, p2, 'AZI-2024-001', fechaFutura(25), 20, 5.80);  // ⚠️ Próximo a vencer
insertLote(pid.azitromicina, p1, 'AZI-2024-002', fechaFutura(400), 25, 5.60);

// Loratadina
insertLote(pid.loratadina, p1, 'LOR-2024-001', fechaFutura(700), 200, 2.00);

// Cetirizina
insertLote(pid.cetirizina, p2, 'CET-2024-001', fechaFutura(500), 90, 2.40);

// Alcohol Yodado
insertLote(pid.alcoholYodado, p3, 'ALCY-2024-001', fechaFutura(300), 30, 2.80);

// Alcohol Etílico - STOCK BAJO (5 unidades, mínimo 25)
insertLote(pid.alcoholEtilico, p3, 'ALC-2024-001', fechaFutura(400), 5, 5.50);

// Agua Oxigenada
insertLote(pid.aguaOxigenada, p1, 'H2O2-2024-001', fechaFutura(350), 70, 2.00);

// Vitamina C
insertLote(pid.vitC, p2, 'VITC-2024-001', fechaFutura(600), 160, 3.50);

// Complejo B
insertLote(pid.complVitB, p1, 'VITB-2024-001', fechaFutura(480), 110, 5.60);

// Omeprazol
insertLote(pid.omeprazol, p3, 'OME-2024-001', fechaFutura(400), 140, 3.80);

// Ranitidina - STOCK BAJO (12 unidades, mínimo 20)
insertLote(pid.ranitidina, p1, 'RAN-2024-001', fechaFutura(10), 12, 2.20);    // ⚠️ Stock bajo + muy próximo a vencer

// Enalapril
insertLote(pid.enalapril, p2, 'ENA-2024-001', fechaFutura(550), 180, 3.60);

// Amlodipino
insertLote(pid.amlodipino, p3, 'AML-2024-001', fechaFutura(480), 95, 5.00);

// Metformina
insertLote(pid.metformina, p1, 'MET-2024-001', fechaFutura(520), 130, 4.50);

// Diclofenaco
insertLote(pid.diclofenaco, p2, 'DIC-2024-001', fechaFutura(300), 55, 2.60);

console.log('✅ Lotes de inventario creados');

// === VENTAS DE EJEMPLO ===
const fecha1 = new Date(); fecha1.setHours(9, 15, 0);
const v1 = db.prepare(`
  INSERT INTO ventas (numero_comprobante, fecha_hora, usuario_id, cliente_nombre, cliente_doc, subtotal, igv, total)
  VALUES (?,?,?,?,?,?,?,?)
`).run('B001-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-0001',
  fecha1.toISOString().replace('T',' ').slice(0,19), 2, 'María Quispe', '12345678',
  13.60, 2.45, 16.05);

db.prepare('INSERT INTO detalle_ventas (venta_id, producto_id, lote_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?,?)')
  .run(v1.lastInsertRowid, pid.paracetamol500, 1, 2, 1.50, 3.00);
db.prepare('INSERT INTO detalle_ventas (venta_id, producto_id, lote_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?,?)')
  .run(v1.lastInsertRowid, pid.loratadina, 13, 2, 3.20, 6.40);
db.prepare('INSERT INTO detalle_ventas (venta_id, producto_id, lote_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?,?)')
  .run(v1.lastInsertRowid, pid.vitC, 16, 2, 5.50, 11.00);

console.log('✅ Venta de ejemplo registrada');

console.log(`
╔══════════════════════════════════════════════╗
║          🏥 NOVA SALUD - SEED LISTO          ║
╠══════════════════════════════════════════════╣
║  USUARIOS DE PRUEBA:                         ║
║  ─────────────────────────────────────────── ║
║  👤 admin      / admin123    (Administrador) ║
║  👤 vendedor1  / vendedor123 (Vendedor)      ║
║  👤 vendedor2  / vendedor123 (Vendedor)      ║
╠══════════════════════════════════════════════╣
║  DATOS CARGADOS:                             ║
║  • 3 usuarios  • 8 categorías                ║
║  • 3 proveedores • 20 productos              ║
║  • 24 lotes  • 1 venta ejemplo               ║
║  • 3 alertas de stock bajo                   ║
║  • 4 lotes próximos a vencer (<30 días)      ║
╚══════════════════════════════════════════════╝
`);
