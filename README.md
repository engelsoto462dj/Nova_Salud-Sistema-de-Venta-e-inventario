# Nova Salud — Sistema de Gestión de Botica

Aplicación web full-stack para la gestión integral de inventario, ventas y atención al cliente de una farmacia/botica de alta demanda.

---

##Inicio Rápido

### Requisitos
- **Node.js** v18 o superior
- **npm** v8 o superior

### 1. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

### 2. Inicializar la base de datos con datos de prueba

```bash
cd backend
npm run seed
```

### 3. Iniciar la aplicación

**Opción A — Doble clic (Windows)**
```
Ejecutar: iniciar.bat
```

**Opción B — Manual (dos terminales)**
```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Abre tu navegador en **http://localhost:5173**

---

## Usuarios de Prueba

| Rol           | Usuario     | Contraseña    |
|---------------|-------------|---------------|
| Administrador | `admin`     | `admin123`    |
| Vendedor      | `vendedor1` | `vendedor123` |
| Vendedor      | `vendedor2` | `vendedor123` |

---

## Arquitectura

```
Nova_salud/
├── backend/                 # API REST con Express + SQLite
│   ├── src/
│   │   ├── server.js        # Punto de entrada
│   │   ├── db/
│   │   │   ├── database.js  # Schema y conexión SQLite
│   │   │   └── seed.js      # Datos de prueba
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT + roles
│   │   └── routes/
│   │       ├── auth.js      # Login/logout
│   │       ├── productos.js # CRUD productos
│   │       ├── categorias.js
│   │       ├── proveedores.js
│   │       ├── lotes.js     # Ingresos de mercadería
│   │       ├── ventas.js    # POS + transacciones FEFO
│   │       ├── alertas.js   # Stock bajo + vencimientos
│   │       └── reportes.js  # Dashboard + estadísticas
│   └── nova_salud.db        # Base de datos SQLite (auto-generada)
│
└── frontend/                # React + Vite (diseño iOS)
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── POS.jsx      # Punto de Venta
        │   ├── Inventario.jsx
        │   ├── Alertas.jsx
        │   └── Reportes.jsx
        ├── components/
        │   └── Layout.jsx   # Sidebar + navegación
        └── context/
            └── AuthContext.jsx  # Autenticación JWT
```

---

## Funcionalidades

### Dashboard
- KPIs del día: ventas totales, número de transacciones, alertas de stock y vencimientos
- Últimas 5 ventas con comprobante
- Accesos rápidos a todas las secciones

### Punto de Venta (POS)
- **Búsqueda en tiempo real** por nombre, principio activo o código
- Indicador visual de stock bajo (badge rojo)
- Carrito interactivo con control de cantidades
- Cálculo automático de Subtotal + IGV 18% + Total
- Datos opcionales del cliente (nombre y documento)
- **Ticket imprimible** con comprobante generado automáticamente

### Inventario (Solo Admin)
- **CRUD de productos** con categoría, precio, stock mínimo
- **CRUD de categorías** y proveedores
- **Registro de lotes**: número de lote, fecha de vencimiento, cantidad y precio de compra
  - Al registrar un lote, el stock del producto se actualiza automáticamente
- Visualización de lotes ordenada por fecha de vencimiento (FEFO)

### Alertas
- **Stock Bajo**: productos con `stock_actual ≤ stock_minimo` con barra de progreso
- **Próximos a Vencer**: lotes que vencen en ≤ 30 días, con cuenta regresiva
- **Vencidos**: lotes vencidos que aún tienen stock

### Reportes
- Historial de ventas con filtro por rango de fechas
- Detalle por comprobante (productos, lotes, precios)
- **Top 10 productos más vendidos** (últimos 30 días)
- Resumen de productos con stock bajo

---

## Reglas de Negocio

### FEFO (First Expired, First Out)
Al registrar una venta, el sistema automáticamente asigna la cantidad vendida al lote con la **fecha de vencimiento más próxima** que tenga stock disponible. Si la cantidad supera un lote, continúa con el siguiente (también ordenado por FEFO).

### Transacción Atómica
El registro de una venta utiliza una transacción SQLite. Si falla cualquier paso (stock insuficiente, error de DB), **todos los cambios se revierten** sin dejar datos inconsistentes.

### Generación de Comprobantes
Formato: `B001-YYYYMMDD-NNNN` (ejemplo: `B001-20261124-0001`)

---

## Stack Tecnológico

| Capa        | Tecnología                            |
|-------------|---------------------------------------|
| Frontend    | React 18, Vite, React Router v6       |
| Iconos      | Lucide React                          |
| Backend     | Node.js, Express 4                    |
| Base de datos | SQLite (better-sqlite3)             |
| Auth        | JWT (jsonwebtoken) + bcryptjs         |
| Estilo      | CSS-in-JS, tipografía Inter, estética iOS/Apple |

---

## Datos de Prueba (Seed)

El seed incluye:
- **20 productos** farmacéuticos reales (paracetamol, ibuprofeno, amoxicilina, loratadina, etc.)
- **24 lotes** con diferentes fechas de vencimiento
- **3 productos con stock bajo** (para probar alertas desde el inicio)
- **4 lotes próximos a vencer** (dentro de 30 días)
- **1 lote muy próximo a vencer** (10 días — Ranitidina)
- **3 proveedores** reales con RUC peruano
- **8 categorías** farmacéuticas

---

## Endpoints API

```
POST   /api/auth/login
GET    /api/productos?q=busqueda
GET    /api/productos/:id
POST   /api/productos               [admin]
PUT    /api/productos/:id           [admin]
DELETE /api/productos/:id           [admin]
GET    /api/categorias
POST   /api/categorias              [admin]
GET    /api/proveedores
POST   /api/proveedores             [admin]
GET    /api/lotes
POST   /api/lotes                   [admin]
GET    /api/lotes/producto/:id
GET    /api/ventas
POST   /api/ventas
GET    /api/ventas/:id
GET    /api/alertas
GET    /api/reportes/dashboard
GET    /api/reportes/mas-vendidos
GET    /api/reportes/ventas
GET    /api/reportes/stock-bajo
```

---

Hecho con amor para **Nova Salud** — Sistema de Botica
