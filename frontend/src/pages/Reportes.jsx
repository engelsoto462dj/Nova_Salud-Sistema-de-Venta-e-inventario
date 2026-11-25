import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { BarChart2, TrendingUp, Package, FileText, CheckCircle2, X } from 'lucide-react';

export default function Reportes() {
  const { authFetch } = useAuth();
  const [tab, setTab] = useState('ventas');
  const [ventas, setVentas] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [hasta, setHasta] = useState(() => new Date().toISOString().split('T')[0]);
  const [ventaDetalle, setVentaDetalle] = useState(null);

  const cargarVentas = async () => {
    setLoading(true);
    const res = await authFetch(`/api/reportes/ventas?desde=${desde}&hasta=${hasta}`);
    setVentas(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (tab === 'ventas') cargarVentas();
    if (tab === 'masVendidos') {
      authFetch('/api/reportes/mas-vendidos').then(r => r.json()).then(setMasVendidos);
    }
    if (tab === 'stockBajo') {
      authFetch('/api/reportes/stock-bajo').then(r => r.json()).then(setStockBajo);
    }
  }, [tab]);

  const totalPeriodo = ventas.reduce((s, v) => s + Number(v.total), 0);

  const verDetalle = async (id) => {
    const res = await authFetch(`/api/ventas/${id}`);
    const data = await res.json();
    setVentaDetalle(data);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h1 style={styles.title}>Reportes</h1>
        <p style={styles.sub}>Análisis de ventas y estado del inventario</p>
      </div>

      <div style={styles.tabs}>
        {[
          ['ventas', <FileText size={14} />, 'Historial de Ventas'],
          ['masVendidos', <TrendingUp size={14} />, 'Más Vendidos'],
          ['stockBajo', <Package size={14} />, 'Stock Bajo'],
        ].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'ventas' && (
        <div>
          <div style={styles.filterBar}>
            <div style={styles.dateGroup}>
              <label style={styles.label}>Desde</label>
              <input type="date" style={styles.dateInput} value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div style={styles.dateGroup}>
              <label style={styles.label}>Hasta</label>
              <input type="date" style={styles.dateInput} value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
            <button onClick={cargarVentas} style={styles.filterBtn}>Filtrar</button>
            <div style={styles.totalChip}>
              Total período: <strong>S/ {totalPeriodo.toFixed(2)}</strong> · {ventas.length} ventas
            </div>
          </div>

          <div style={styles.card}>
            {loading ? <div style={styles.loadingBox}>Cargando…</div> : (
              <table style={styles.table}>
                <thead>
                  <tr>{['Comprobante','Fecha/Hora','Vendedor','Cliente','Subtotal','IGV','Total',''].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {ventas.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--label2)' }}>No hay ventas en el período</td></tr>
                  )}
                  {ventas.map(v => (
                    <tr key={v.id} style={styles.tr}>
                      <td style={styles.td}><code style={styles.code}>{v.numero_comprobante}</code></td>
                      <td style={styles.td}>{new Date(v.fecha_hora).toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                      <td style={styles.td}>{v.vendedor_nombre || '—'}</td>
                      <td style={styles.td}>{v.cliente_nombre || 'General'}</td>
                      <td style={styles.td}>S/ {Number(v.subtotal).toFixed(2)}</td>
                      <td style={styles.td}>S/ {Number(v.igv).toFixed(2)}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>S/ {Number(v.total).toFixed(2)}</td>
                      <td style={styles.td}>
                        <button onClick={() => verDetalle(v.id)} style={styles.detBtn}>Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'masVendidos' && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead><tr>{['Producto','Presentación','Unidades Vendidas','Ingresos Totales'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {masVendidos.map((p, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ ...styles.rank, background: i < 3 ? '#FFF5E6' : '#F2F2F7', color: i < 3 ? '#FF9F0A' : 'var(--label2)' }}>#{i+1}</span>
                      {p.nombre_comercial}
                    </div>
                  </td>
                  <td style={styles.td}>{p.presentacion || '—'}</td>
                  <td style={styles.td}><strong>{p.total_unidades}</strong></td>
                  <td style={styles.td}>S/ {Number(p.total_ingresos).toFixed(2)}</td>
                </tr>
              ))}
              {masVendidos.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--label2)' }}>Sin datos de ventas aún</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'stockBajo' && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead><tr>{['Código','Producto','Categoría','Stock Actual','Stock Mínimo','Diferencia'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
            <tbody>
              {stockBajo.map(p => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}><code style={styles.code}>{p.codigo}</code></td>
                  <td style={styles.td}><strong>{p.nombre_comercial}</strong></td>
                  <td style={styles.td}>{p.categoria || '—'}</td>
                  <td style={styles.td}><span style={{ color: '#FF3B30', fontWeight: 700 }}>{p.stock_actual}</span></td>
                  <td style={styles.td}>{p.stock_minimo}</td>
                  <td style={styles.td}><span style={{ color: '#FF9F0A', fontWeight: 600 }}>-{p.stock_minimo - p.stock_actual}</span></td>
                </tr>
              ))}
              {stockBajo.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--label2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} color="#30D158" />
                      <span>Todos los productos tienen stock suficiente</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle venta modal */}
      {ventaDetalle && (
        <div style={detStyles.overlay} onClick={() => setVentaDetalle(null)}>
          <div style={detStyles.modal} onClick={e => e.stopPropagation()}>
            <div style={detStyles.header}>
              <div>
                <div style={detStyles.comp}>{ventaDetalle.numero_comprobante}</div>
                <div style={detStyles.meta}>{new Date(ventaDetalle.fecha_hora).toLocaleString('es-PE')} · {ventaDetalle.vendedor_nombre}</div>
              </div>
              <button onClick={() => setVentaDetalle(null)} style={detStyles.closeBtn} title="Cerrar"><X size={15} /></button>
            </div>
            {ventaDetalle.cliente_nombre && <div style={detStyles.cliente}>Cliente: {ventaDetalle.cliente_nombre} {ventaDetalle.cliente_doc && `(${ventaDetalle.cliente_doc})`}</div>}
            <table style={styles.table}>
              <thead><tr>{['Producto','Lote','Cant.','P.U.','Subtotal'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
              <tbody>
                {ventaDetalle.detalle?.map(d => (
                  <tr key={d.id} style={styles.tr}>
                    <td style={styles.td}>{d.nombre_comercial}</td>
                    <td style={styles.td}><code style={styles.code}>{d.numero_lote}</code></td>
                    <td style={styles.td}>{d.cantidad}</td>
                    <td style={styles.td}>S/ {Number(d.precio_unitario).toFixed(2)}</td>
                    <td style={styles.td}>S/ {Number(d.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={detStyles.totales}>
              <div style={detStyles.totRow}><span>Subtotal</span><span>S/ {Number(ventaDetalle.subtotal).toFixed(2)}</span></div>
              <div style={detStyles.totRow}><span>IGV 18%</span><span>S/ {Number(ventaDetalle.igv).toFixed(2)}</span></div>
              <div style={{ ...detStyles.totRow, fontWeight: 700, fontSize: 17 }}><span>Total</span><span>S/ {Number(ventaDetalle.total).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 700, color: '#000', letterSpacing: '-0.5px' },
  sub: { fontSize: 14, color: 'var(--label2)', marginTop: 4 },
  tabs: { display: 'flex', gap: 4, background: '#F2F2F7', padding: 4, borderRadius: 12, width: 'fit-content' },
  tab: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--label2)', transition: 'all 0.15s' },
  tabActive: { background: '#FFF', color: '#000', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  filterBar: { display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  dateGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--label2)', textTransform: 'uppercase', letterSpacing: '0.4px' },
  dateInput: { padding: '9px 12px', border: '1.5px solid var(--separator)', borderRadius: 10, fontSize: 13, outline: 'none', color: '#000' },
  filterBtn: { padding: '10px 18px', background: '#0A84FF', color: '#FFF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  totalChip: { padding: '10px 16px', background: '#E8F4FF', borderRadius: 10, fontSize: 13, color: '#0A84FF' },
  card: { background: '#FFF', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--label2)', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#FAFAFA', textAlign: 'left', borderBottom: '1px solid var(--separator)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--separator)' },
  td: { padding: '12px 16px', fontSize: 13, color: '#000', verticalAlign: 'middle' },
  code: { fontFamily: 'monospace', fontSize: 11, background: '#F2F2F7', padding: '2px 6px', borderRadius: 4 },
  detBtn: { padding: '5px 12px', border: '1.5px solid var(--separator)', borderRadius: 8, background: '#FFF', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  loadingBox: { padding: 40, textAlign: 'center', color: 'var(--label2)' },
  rank: { padding: '2px 7px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
};

const detStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 },
  modal: { background: '#FFF', borderRadius: 20, width: '100%', maxWidth: 600, boxShadow: '0 24px 80px rgba(0,0,0,0.20)', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--separator)' },
  comp: { fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#0A84FF' },
  meta: { fontSize: 13, color: 'var(--label2)', marginTop: 2 },
  closeBtn: { padding: '6px 10px', border: 'none', background: 'var(--fill)', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  cliente: { padding: '10px 24px', background: '#E8F4FF', fontSize: 13, color: '#0A84FF', fontWeight: 500 },
  totales: { padding: '16px 24px', borderTop: '1px solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 6 },
  totRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#000' },
};
