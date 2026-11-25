import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, AlertCircle, Check, X } from 'lucide-react';

export default function POS() {
  const { authFetch } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [query, setQuery] = useState('');
  const [cargando, setCargando] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState({ nombre: '', doc: '' });
  const [ticket, setTicket] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [alertaStock, setAlertaStock] = useState(null); // { mensaje, tipo }
  const searchRef = useRef(null);

  const mostrarAlerta = (mensaje, tipo = 'warning') => {
    setAlertaStock({ mensaje, tipo });
    setTimeout(() => setAlertaStock(null), 4500);
  };

  // Cargar productos y categorías al inicio
  const cargarCatalogo = async () => {
    setCargando(true);
    try {
      const [resProd, resCat] = await Promise.all([
        authFetch('/api/productos'),
        authFetch('/api/categorias')
      ]);
      const dataProd = await resProd.json();
      const dataCat = await resCat.json();
      setProductos(Array.isArray(dataProd) ? dataProd : []);
      setCategorias(Array.isArray(dataCat) ? dataCat : []);
    } catch (e) {
      console.error('Error al cargar catálogo', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  // Filtrado reactivo en memoria
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      // Filtro de categoría
      if (categoriaSeleccionada !== null && p.categoria_id !== categoriaSeleccionada) {
        return false;
      }
      // Filtro de búsqueda
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const matchNombre = p.nombre_comercial?.toLowerCase().includes(q);
      const matchPrincipio = p.principio_activo?.toLowerCase().includes(q);
      const matchCodigo = p.codigo?.toLowerCase().includes(q);
      const matchCategoria = p.categoria_nombre?.toLowerCase().includes(q);
      return matchNombre || matchPrincipio || matchCodigo || matchCategoria;
    });
  }, [productos, query, categoriaSeleccionada]);

  const agregarAlCarrito = (prod) => {
    if (prod.stock_actual <= 0) {
      mostrarAlerta(`El medicamento "${prod.nombre_comercial}" está totalmente AGOTADO (Sin stock disponible).`, 'error');
      return;
    }
    const enCarrito = carrito.find(i => i.id === prod.id);
    if (enCarrito && enCarrito.cantidad >= prod.stock_actual) {
      mostrarAlerta(`Stock máximo alcanzado: Solo hay ${prod.stock_actual} unidad(es) de "${prod.nombre_comercial}" en inventario.`, 'warning');
      return;
    }
    setCarrito(prev => {
      const existe = prev.find(i => i.id === prod.id);
      if (existe) {
        return prev.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { ...prod, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    const item = carrito.find(i => i.id === id);
    if (item && delta > 0 && item.cantidad >= item.stock_actual) {
      mostrarAlerta(`Stock máximo alcanzado: Solo hay ${item.stock_actual} unidad(es) de "${item.nombre_comercial}" en inventario.`, 'warning');
      return;
    }
    setCarrito(prev => prev
      .map(i => {
        if (i.id !== id) return i;
        const nuevaCant = i.cantidad + delta;
        if (nuevaCant <= 0) return null;
        return { ...i, cantidad: nuevaCant };
      })
      .filter(Boolean)
    );
  };

  const eliminar = (id) => setCarrito(prev => prev.filter(i => i.id !== id));

  const subtotal = carrito.reduce((s, i) => s + i.precio_venta * i.cantidad, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const registrarVenta = async () => {
    if (carrito.length === 0) return;
    setProcesando(true);
    setError('');
    try {
      const res = await authFetch('/api/ventas', {
        method: 'POST',
        body: JSON.stringify({
          items: carrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad, precio_unitario: i.precio_venta })),
          cliente_nombre: cliente.nombre?.trim() || null,
          cliente_doc: cliente.doc?.trim() || null,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la venta');
      setTicket(data);
      setCarrito([]);
      setCliente({ nombre: '', doc: '' });
      cargarCatalogo();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (ticket) return <Ticket ticket={ticket} onClose={() => setTicket(null)} />;

  return (
    <div style={styles.wrap}>
      {/* Columna Izquierda: Catálogo y Búsqueda */}
      <div style={styles.left}>
        {/* Cabecera Fija (Nunca se desplaza ni se corta) */}
        <div style={styles.leftFixedHeader}>
          {/* Toast Alerta In-app */}
          {alertaStock && (
            <div style={{
              ...styles.toastBanner,
              background: alertaStock.tipo === 'error' ? '#FF3B30' : '#FF9F0A'
            }}>
              <div style={styles.toastContent}>
                <AlertCircle size={16} color="#FFF" style={{ flexShrink: 0 }} />
                <span>{alertaStock.mensaje}</span>
              </div>
              <button onClick={() => setAlertaStock(null)} style={styles.toastCloseBtn}><X size={14} color="#FFF" /></button>
            </div>
          )}

          <div style={styles.pageHeader}>
            <h1 style={styles.title}>Punto de Venta</h1>
            <p style={styles.subTitle}>Selecciona productos del catálogo o busca por código/nombre</p>
          </div>

          {/* Buscador iOS */}
          <div style={styles.searchWrap}>
            <Search size={18} color="var(--label2)" />
            <input
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Buscar medicamento (ej. Paracetamol, Ibuprofeno, MED001)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} style={styles.clearBtn} title="Limpiar búsqueda"><X size={12} /></button>
            )}
          </div>

          {/* Filtros por Categoría (Chips iOS) */}
          <div style={styles.categoryPills}>
            <button
              onClick={() => setCategoriaSeleccionada(null)}
              style={{
                ...styles.pill,
                ...(categoriaSeleccionada === null ? styles.pillActive : {})
              }}
            >
              Todos ({productos.length})
            </button>
            {categorias.map(cat => {
              const count = productos.filter(p => p.categoria_id === cat.id).length;
              const activa = categoriaSeleccionada === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(activa ? null : cat.id)}
                  style={{
                    ...styles.pill,
                    ...(activa ? styles.pillActive : {})
                  }}
                >
                  {cat.nombre} ({count})
                </button>
              );
            })}
          </div>

          <div style={styles.catalogHeader}>
            <span style={styles.catalogCount}>
              Mostrando <strong>{productosFiltrados.length}</strong> medicamentos disponibles
            </span>
            {categoriaSeleccionada !== null && (
              <button onClick={() => setCategoriaSeleccionada(null)} style={styles.resetCatLink}>
                Ver todos
              </button>
            )}
          </div>
        </div>

        {/* Catálogo de Productos con Scroll Exclusivo */}
        <div style={styles.catalogScrollArea}>
          {cargando ? (
            <div style={styles.loadingBox}>Cargando catálogo de medicamentos...</div>
          ) : productosFiltrados.length === 0 ? (
            <div style={styles.noResult}>
              <AlertCircle size={32} color="var(--label3)" style={{ marginBottom: 8 }} />
              <div>No se encontraron medicamentos coincidentes con "{query}"</div>
              <button onClick={() => { setQuery(''); setCategoriaSeleccionada(null); }} style={styles.resetFilterBtn}>
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div style={styles.grid}>
              {productosFiltrados.map(prod => {
                const enCarrito = carrito.find(i => i.id === prod.id);
                const agotado = prod.stock_actual <= 0;
                const stockBajo = prod.stock_actual <= prod.stock_minimo;
                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (agotado) {
                        mostrarAlerta(`El medicamento "${prod.nombre_comercial}" está AGOTADO (0 unidades disponibles).`, 'error');
                      } else {
                        agregarAlCarrito(prod);
                      }
                    }}
                    style={{
                      ...styles.card,
                      ...(agotado ? styles.cardAgotado : {}),
                      ...(enCarrito ? styles.cardEnCarrito : {})
                    }}
                  >
                    <div style={styles.cardTop}>
                      <span style={styles.cardCode}>{prod.codigo}</span>
                      <span style={{
                        ...styles.stockBadge,
                        background: agotado ? '#FFF0EF' : stockBajo ? '#FFF5E6' : '#E8FAF0',
                        color: agotado ? '#FF3B30' : stockBajo ? '#FF9F0A' : '#30D158',
                        border: agotado ? '1px solid rgba(255,59,48,0.3)' : 'none'
                      }}>
                        {agotado ? 'Sin Stock (0)' : `${prod.stock_actual} disp.`}
                      </span>
                    </div>

                    <div style={{ ...styles.cardTitle, color: agotado ? '#8E8E93' : '#000' }}>{prod.nombre_comercial}</div>
                    
                    <div style={styles.cardMeta}>
                      {prod.principio_activo && <span style={styles.principio}>{prod.principio_activo}</span>}
                      {prod.presentacion && <span style={styles.presentacion}>· {prod.presentacion}</span>}
                    </div>

                    <div style={styles.cardBottom}>
                      <div style={{ ...styles.cardPrice, color: agotado ? '#8E8E93' : '#000' }}>
                        <span style={styles.currency}>S/</span> {Number(prod.precio_venta).toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (agotado) {
                            mostrarAlerta(`El medicamento "${prod.nombre_comercial}" está AGOTADO (0 unidades disponibles).`, 'error');
                          } else {
                            agregarAlCarrito(prod);
                          }
                        }}
                        style={{
                          ...styles.addCardBtn,
                          ...(agotado ? styles.addCardBtnAgotado : {}),
                          ...(enCarrito && !agotado ? styles.addCardBtnAdded : {})
                        }}
                      >
                        {agotado ? (
                          <>
                            <AlertCircle size={13} /> Sin Stock
                          </>
                        ) : enCarrito ? (
                          <>
                            <Check size={14} /> En Carrito ({enCarrito.cantidad})
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Agregar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Panel de Venta & Carrito */}
      <div style={styles.right}>
        {/* Cabecera del Carrito */}
        <div style={styles.carritoHeader}>
          <div style={styles.cartHeaderTitle}>
            <ShoppingCart size={18} strokeWidth={2.5} color="#0A84FF" />
            <span style={styles.carritoTitle}>Orden de Venta</span>
          </div>
          <span style={styles.carritoCount}>
            {carrito.reduce((s, i) => s + i.cantidad, 0)} {carrito.length === 1 && carrito[0].cantidad === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        {/* Lista de Ítems en Carrito */}
        <div style={styles.carritoItems}>
          {carrito.length === 0 ? (
            <div style={styles.emptyCarrito}>
              <div style={styles.emptyIconBox}>
                <ShoppingCart size={32} color="var(--label3)" />
              </div>
              <strong style={{ color: '#000', fontSize: 15 }}>Tu carrito está vacío</strong>
              <p style={{ color: 'var(--label2)', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Haz clic en cualquier medicamento de la izquierda para agregarlo.
              </p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} style={styles.carritoItem}>
                <div style={styles.itemInfo}>
                  <div style={styles.itemNombre}>{item.nombre_comercial}</div>
                  <div style={styles.itemSubText}>
                    S/ {Number(item.precio_venta).toFixed(2)} c/u {item.presentacion ? `· ${item.presentacion}` : ''}
                  </div>
                </div>

                <div style={styles.itemControls}>
                  <button onClick={() => cambiarCantidad(item.id, -1)} style={styles.qtyBtn} title="Disminuir">
                    <Minus size={12} />
                  </button>
                  <span style={styles.qtyNum}>{item.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(item.id, 1)}
                    disabled={item.cantidad >= item.stock_actual}
                    style={{ ...styles.qtyBtn, opacity: item.cantidad >= item.stock_actual ? 0.4 : 1 }}
                    title="Aumentar"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div style={styles.itemSubtotal}>
                  S/ {(item.precio_venta * item.cantidad).toFixed(2)}
                </div>

                <button onClick={() => eliminar(item.id)} style={styles.deleteBtn} title="Quitar">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Datos del Cliente */}
        <div style={styles.clienteCard}>
          <div style={styles.clienteHeader}>
            <span style={styles.clienteTitle}>Datos del Comprobante (Opcional)</span>
          </div>
          <div style={styles.clienteGrid}>
            <input
              style={styles.clienteInput}
              placeholder="Nombre del cliente"
              value={cliente.nombre}
              onChange={e => setCliente(c => ({ ...c, nombre: e.target.value }))}
            />
            <input
              style={styles.clienteInput}
              placeholder="DNI / RUC"
              value={cliente.doc}
              onChange={e => setCliente(c => ({ ...c, doc: e.target.value }))}
            />
          </div>
        </div>

        {/* Totales y Botón de Venta */}
        <div style={styles.footerPanel}>
          <div style={styles.totales}>
            <div style={styles.totRow}><span>Subtotal</span><span>S/ {subtotal.toFixed(2)}</span></div>
            <div style={styles.totRow}><span>IGV (18%)</span><span>S/ {igv.toFixed(2)}</span></div>
            <div style={styles.totRowTotal}>
              <span>Total a Pagar</span>
              <span style={styles.totalMonto}>S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} /> <span>{error}</span>
            </div>
          )}

          <button
            onClick={registrarVenta}
            disabled={carrito.length === 0 || procesando}
            style={{
              ...styles.ventaBtn,
              opacity: carrito.length === 0 || procesando ? 0.5 : 1,
              cursor: carrito.length === 0 || procesando ? 'not-allowed' : 'pointer'
            }}
          >
            {procesando ? 'Procesando Venta…' : carrito.length === 0 ? 'Selecciona productos para vender' : `Registrar Venta · S/ ${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Ticket({ ticket, onClose }) {
  const printTicket = () => window.print();
  return (
    <div style={ticketStyles.overlay}>
      <div style={ticketStyles.modal} id="ticket-print">
        <div style={ticketStyles.header}>
          <div style={ticketStyles.checkCircle}><Check size={28} color="#FFF" strokeWidth={3} /></div>
          <h2 style={ticketStyles.title}>¡Venta Registrada con Éxito!</h2>
          <div style={ticketStyles.numero}>{ticket.numero_comprobante}</div>
        </div>

        <div style={ticketStyles.body}>
          <div style={ticketStyles.infoRow}>
            <span>Fecha y Hora</span>
            <strong>{new Date(ticket.fecha_hora).toLocaleString('es-PE')}</strong>
          </div>
          {ticket.cliente_nombre && (
            <div style={ticketStyles.infoRow}><span>Cliente</span><strong>{ticket.cliente_nombre}</strong></div>
          )}
          {ticket.cliente_doc && (
            <div style={ticketStyles.infoRow}><span>DNI / RUC</span><span>{ticket.cliente_doc}</span></div>
          )}

          <div style={ticketStyles.divider} />

          <table style={ticketStyles.table}>
            <thead>
              <tr>
                <th style={ticketStyles.th}>Medicamento</th>
                <th style={{ ...ticketStyles.th, textAlign: 'center' }}>Cant.</th>
                <th style={{ ...ticketStyles.th, textAlign: 'right' }}>P.U.</th>
                <th style={{ ...ticketStyles.th, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {ticket.detalle?.map(d => (
                <tr key={d.id}>
                  <td style={ticketStyles.td}>
                    <strong>{d.nombre_comercial}</strong>
                    {d.numero_lote && <div style={{ fontSize: 11, color: 'var(--label2)' }}>Lote: {d.numero_lote} (FEFO)</div>}
                  </td>
                  <td style={{ ...ticketStyles.td, textAlign: 'center' }}>{d.cantidad}</td>
                  <td style={{ ...ticketStyles.td, textAlign: 'right' }}>S/ {Number(d.precio_unitario).toFixed(2)}</td>
                  <td style={{ ...ticketStyles.td, textAlign: 'right' }}>S/ {Number(d.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={ticketStyles.divider} />
          {ticket.detalle?.some(d => {
            const prodObj = productos.find(x => x.id === d.producto_id);
            return prodObj && prodObj.stock_actual <= 0;
          }) && (
            <div style={ticketStyles.alertaAgotado}>
              <AlertCircle size={15} color="#FF3B30" style={{ flexShrink: 0 }} />
              <div>
                <strong>Aviso de Inventario:</strong> Uno o más medicamentos vendidos han quedado <strong>SIN STOCK</strong>.
              </div>
            </div>
          )}
          <div style={ticketStyles.totRow}><span>Subtotal</span><span>S/ {Number(ticket.subtotal).toFixed(2)}</span></div>
          <div style={ticketStyles.totRow}><span>IGV (18%)</span><span>S/ {Number(ticket.igv).toFixed(2)}</span></div>
          <div style={ticketStyles.totRowBig}><span>TOTAL</span><span>S/ {Number(ticket.total).toFixed(2)}</span></div>
        </div>

        <div style={ticketStyles.actions}>
          <button onClick={printTicket} style={ticketStyles.printBtn}><Printer size={16} /> Imprimir Comprobante</button>
          <button onClick={onClose} style={ticketStyles.closeBtn}>Continuar Vendiendo</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    gap: 20,
    height: '100%',
    maxHeight: '100%',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },
  leftFixedHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flexShrink: 0,
    paddingBottom: 6,
  },
  toastBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderRadius: 12,
    color: '#FFF', fontSize: 13, fontWeight: 600,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  },
  toastContent: { display: 'flex', alignItems: 'center', gap: 8 },
  toastCloseBtn: { border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 },

  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 700, color: '#000', letterSpacing: '-0.5px' },
  subTitle: { fontSize: 13, color: 'var(--label2)', marginTop: 2 },

  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#FFF', borderRadius: 14,
    padding: '11px 16px',
    boxShadow: 'var(--shadow-sm)',
    border: '1.5px solid rgba(60,60,67,0.1)',
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 14, background: 'transparent', color: '#000',
  },
  clearBtn: {
    border: 'none', background: 'var(--fill)',
    width: 20, height: 20, borderRadius: '50%',
    cursor: 'pointer', fontSize: 11, display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'var(--label2)'
  },

  categoryPills: {
    display: 'flex', gap: 6, overflowX: 'auto',
    padding: '4px 0 8px 0',
    scrollbarWidth: 'none',
  },
  pill: {
    padding: '6px 14px', borderRadius: 20,
    border: '1px solid rgba(60,60,67,0.12)',
    background: '#FFF', color: 'var(--label2)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    whiteSpace: 'nowrap', transition: 'all 0.15s',
    flexShrink: 0,
  },
  pillActive: {
    background: '#0A84FF', color: '#FFF',
    borderColor: '#0A84FF', fontWeight: 600,
    boxShadow: '0 2px 8px rgba(10,132,255,0.25)',
  },

  catalogHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' },
  catalogCount: { fontSize: 12, color: 'var(--label2)' },
  resetCatLink: {
    border: 'none', background: 'none', color: '#0A84FF',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },

  catalogScrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    paddingRight: 6,
    paddingBottom: 20,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: 12,
  },
  card: {
    background: '#FFF', borderRadius: 16,
    padding: '14px',
    boxShadow: 'var(--shadow-sm)',
    border: '1.5px solid transparent',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.16s ease-in-out',
  },
  cardEnCarrito: {
    borderColor: '#0A84FF',
    background: '#F8FBFF',
  },
  cardAgotado: {
    background: '#FFFDFD',
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardCode: { fontSize: 11, color: 'var(--label3)', fontFamily: 'monospace', fontWeight: 600 },
  stockBadge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#000', lineHeight: 1.3, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: 'var(--label2)', marginBottom: 12, minHeight: 18 },
  principio: { color: 'var(--label2)' },
  presentacion: { color: 'var(--label3)', marginLeft: 3 },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  cardPrice: { fontSize: 16, fontWeight: 700, color: '#000' },
  currency: { fontSize: 12, fontWeight: 500, color: 'var(--label2)' },
  addCardBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', borderRadius: 10,
    border: 'none', background: '#E8F4FF', color: '#0A84FF',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  addCardBtnAdded: {
    background: '#30D158', color: '#FFF',
  },
  addCardBtnAgotado: {
    background: '#FFF0EF',
    color: '#FF3B30',
    border: '1px solid rgba(255, 59, 48, 0.25)',
    cursor: 'not-allowed',
  },

  loadingBox: { padding: '40px', textAlign: 'center', color: 'var(--label2)', fontSize: 14 },
  noResult: {
    padding: '40px 20px', textAlign: 'center', color: 'var(--label2)', fontSize: 14,
    background: '#FFF', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  resetFilterBtn: {
    marginTop: 10, padding: '8px 16px', borderRadius: 10,
    border: '1px solid var(--separator)', background: '#FFF',
    fontSize: 13, fontWeight: 600, color: '#0A84FF', cursor: 'pointer'
  },

  // Panel Carrito
  right: {
    width: 390, minWidth: 350,
    background: '#FFF', borderRadius: 20,
    boxShadow: 'var(--shadow)',
    display: 'flex', flexDirection: 'column',
    height: '100%', maxHeight: '100%',
    flexShrink: 0,
    overflow: 'hidden',
  },
  carritoHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 18px', borderBottom: '1px solid var(--separator)',
  },
  cartHeaderTitle: { display: 'flex', alignItems: 'center', gap: 8 },
  carritoTitle: { fontSize: 15, fontWeight: 700, color: '#000' },
  carritoCount: {
    background: '#E8F4FF', color: '#0A84FF',
    fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
  },
  carritoItems: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 12px' },
  emptyCarrito: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', minHeight: 180,
    color: 'var(--label2)', padding: '20px',
  },
  emptyIconBox: {
    width: 56, height: 56, borderRadius: '50%', background: 'var(--fill2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  carritoItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 6px', borderBottom: '1px solid var(--separator)',
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemNombre: { fontSize: 13, fontWeight: 600, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemSubText: { fontSize: 11, color: 'var(--label2)', marginTop: 1 },
  itemControls: { display: 'flex', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 24, height: 24, borderRadius: 8,
    background: 'var(--fill)', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  qtyNum: { fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' },
  itemSubtotal: { fontSize: 13, fontWeight: 700, minWidth: 55, textAlign: 'right' },
  deleteBtn: {
    padding: 4, border: 'none', background: 'transparent',
    color: '#FF3B30', cursor: 'pointer', borderRadius: 6,
  },

  // Datos Cliente
  clienteCard: {
    padding: '12px 18px', borderTop: '1px solid var(--separator)',
    background: '#FAFAFA',
  },
  clienteHeader: { marginBottom: 8 },
  clienteTitle: { fontSize: 11, fontWeight: 700, color: 'var(--label2)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  clienteGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 },
  clienteInput: {
    padding: '8px 10px', border: '1px solid var(--separator)',
    borderRadius: 8, fontSize: 12, outline: 'none', background: '#FFF',
  },

  footerPanel: { padding: '14px 18px 18px', borderTop: '1px solid var(--separator)' },
  totales: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  totRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--label2)' },
  totRowTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 700, color: '#000', marginTop: 4 },
  totalMonto: { fontSize: 20, color: '#0A84FF', fontWeight: 800 },
  errorBox: {
    marginBottom: 10, padding: '8px 12px',
    background: '#FFF0EF', borderRadius: 8,
    fontSize: 12, color: '#FF3B30',
    display: 'flex', gap: 6, alignItems: 'center',
  },
  ventaBtn: {
    width: '100%', padding: '14px',
    background: '#0A84FF', color: '#FFF',
    border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 16px rgba(10,132,255,0.25)',
    transition: 'all 0.15s',
  },
};

const ticketStyles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  },
  modal: {
    background: '#FFF', borderRadius: 24,
    width: '100%', maxWidth: 480,
    boxShadow: '0 24px 80px rgba(0,0,0,0.20)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #30D158, #34C759)',
    padding: '24px 20px',
    textAlign: 'center', color: '#FFF',
  },
  checkCircle: {
    width: 50, height: 50, borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 10px',
  },
  title: { fontSize: 18, fontWeight: 700, color: '#FFF', marginBottom: 4 },
  numero: { fontSize: 13, fontWeight: 600, background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '3px 10px', display: 'inline-block', fontFamily: 'monospace' },
  body: { padding: '18px 22px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#000' },
  divider: { height: 1, background: 'var(--separator)', margin: '10px 0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--label2)', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '6px 0', textAlign: 'left' },
  td: { fontSize: 12, padding: '6px 0', color: '#000', borderBottom: '1px solid var(--separator)' },
  alertaAgotado: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: '#FFF0EF',
    borderRadius: 10, fontSize: 12, color: '#FF3B30',
    marginBottom: 8,
  },
  totRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--label2)', padding: '3px 0' },
  totRowBig: { display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: '#000', padding: '6px 0 0' },
  actions: { display: 'flex', gap: 10, padding: '0 22px 20px' },
  printBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '11px 16px', borderRadius: 10,
    border: '1.5px solid var(--separator)',
    background: '#FFF', color: '#000',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  closeBtn: {
    flex: 1, padding: '11px 16px', borderRadius: 10,
    border: 'none', background: '#0A84FF', color: '#FFF',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
};
