import express from 'express';
import cors from 'cors';
import { initDB } from './db/database.js';
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import categoriasRoutes from './routes/categorias.js';
import proveedoresRoutes from './routes/proveedores.js';
import lotesRoutes from './routes/lotes.js';
import ventasRoutes from './routes/ventas.js';
import reportesRoutes from './routes/reportes.js';
import alertasRoutes from './routes/alertas.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Inicializar DB
initDB();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/lotes', lotesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/alertas', alertasRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'Nova Salud' }));

// Página de bienvenida y estado del Backend
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nova Salud — API Backend</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #F2F2F7;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: #000;
          }
          .card {
            background: #FFF;
            padding: 36px 32px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            max-width: 440px;
            width: 100%;
            text-align: center;
          }
          .badge {
            display: inline-block;
            background: #E8FAF0;
            color: #30D158;
            font-size: 13px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            margin-bottom: 16px;
          }
          h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 700; }
          p { color: rgba(60,60,67,0.6); font-size: 14px; margin: 0 0 24px 0; line-height: 1.5; }
          .btn {
            display: inline-block;
            background: #0A84FF;
            color: #FFF;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(10,132,255,0.25);
            transition: transform 0.1s;
          }
          .btn:hover { transform: scale(1.02); }
          .endpoints {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid rgba(60,60,67,0.1);
            text-align: left;
            font-size: 12px;
            color: rgba(60,60,67,0.6);
          }
          code { background: #F2F2F7; padding: 2px 6px; border-radius: 4px; color: #000; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● API Activa y Operativa</div>
          <h1>Nova Salud — Backend API</h1>
          <p>
            Este puerto (<strong>3001</strong>) procesa la lógica de base de datos y transacciones REST. La interfaz visual interactiva de la botica corre en el puerto <strong>5173</strong>.
          </p>
          <a class="btn" href="http://localhost:5173">Abrir Aplicación (Frontend) →</a>
          <div class="endpoints">
            <strong>Endpoints disponibles:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li><code>/api/productos</code> — Catálogo e inventario</li>
              <li><code>/api/ventas</code> — Registro transaccional FEFO</li>
              <li><code>/api/alertas</code> — Stock bajo y vencimientos</li>
              <li><code>/api/reportes</code> — Estadísticas y Dashboard</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({
      app: 'Nova Salud Backend API',
      status: 'online',
      version: '1.0.0',
      frontend: 'http://localhost:5173'
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🏥 Nova Salud Backend corriendo en http://localhost:${PORT}`);
  console.log(`   Ambiente: desarrollo | DB: SQLite\n`);
});
