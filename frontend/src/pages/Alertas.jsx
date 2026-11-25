import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Package, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function Alertas() {
  const { authFetch } = useAuth();
  const [data, setData] = useState({ sinStock: [], stockBajo: [], proximosVencer: [], vencidos: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sinStock'); // Por defecto a sinStock si hay alguno

  useEffect(() => {
    authFetch('/api/alertas')
      .then(r => r.json())
      .then(d => {
        setData(d);
        // Si hay productos sin stock, abrir esa pestaña; si no, stock bajo
        if (d.sinStock && d.sinStock.length > 0) {
          setTab('sinStock');
        } else if (d.stockBajo && d.stockBajo.length > 0) {
          setTab('stockBajo');
        }
        setLoading(false);
      });
  }, []);

  const hoy = new Date();
  const daysLeft = (fecha) => Math.ceil((new Date(fecha) - hoy) / 86400000);

  const tabs = [
    { key: 'sinStock', label: 'Sin Stock', count: data.sinStock?.length || 0, color: '#FF3B30', icon: AlertCircle },
    { key: 'stockBajo', label: 'Stock Bajo', count: data.stockBajo?.length || 0, color: '#FF9F0A', icon: Package },
    { key: 'proximosVencer', label: 'Próx. a Vencer', count: data.proximosVencer?.length || 0, color: '#FF9F0A', icon: Clock },
    { key: 'vencidos', label: 'Vencidos', count: data.vencidos?.length || 0, color: '#BF5AF2', icon: AlertTriangle },
  ];

  if (loading) return <div style={{ padding: 40, color: 'var(--label2)' }}>Cargando alertas…</div>;

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h1 style={styles.title}>Alertas de Inventario</h1>
        <p style={styles.sub}>Monitoreo en tiempo real de productos agotados, stock bajo y vencimientos</p>
      </div>

      {/* Summary badges */}
      <div style={styles.summaryGrid}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...styles.summaryCard,
              borderColor: tab === t.key ? t.color : 'transparent',
              background: tab === t.key ? `${t.color}10` : '#FFF'
            }}
          >
            <div style={{ ...styles.summaryIcon, background: `${t.color}20`, color: t.color }}>
              <t.icon size={20} />
            </div>
            <div style={{ ...styles.summaryNum, color: t.count > 0 && t.key === 'sinStock' ? '#FF3B30' : '#000' }}>
              {t.count}
            </div>
            <div style={styles.summaryLabel}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.card}>
        {/* Pestaña: Sin Stock (Agotados) */}
        {tab === 'sinStock' && (
          <div>
            <div style={{ ...styles.cardHeader, background: '#FFF0EF', color: '#FF3B30' }}>
              <AlertCircle size={16} color="#FF3B30" />
              <span>Productos totalmente agotados — Sin Stock ({data.sinStock?.length || 0})</span>
            </div>
            {(!data.sinStock || data.sinStock.length === 0) && (
              <EmptyState msg="¡Excelente! No hay ningún medicamento con stock en cero." />
            )}
            {data.sinStock?.map(p => (
              <div key={p.id} style={{ ...styles.alertRow, background: '#FFFAFA' }}>
                <div style={styles.alertInfo}>
                  <div style={styles.alertName}>{p.nombre_comercial}</div>
                  <div style={styles.alertMeta}>Código: {p.codigo} · {p.categoria || 'Sin categoría'}</div>
                </div>
                <div style={styles.alertData}>
                  <div style={{ ...styles.badge, background: '#FF3B30', color: '#FFF' }}>
                    SIN STOCK (0)
                  </div>
                  <div style={styles.stockNums}>
                    <span style={{ color: 'var(--label2)', fontSize: 12 }}>Mínimo sugerido: {p.stock_minimo} uds</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pestaña: Stock Bajo */}
        {tab === 'stockBajo' && (
          <div>
            <div style={styles.cardHeader}>
              <AlertTriangle size={16} color="#FF9F0A" />
              <span>Productos por debajo del stock mínimo ({data.stockBajo?.length || 0})</span>
            </div>
            {(!data.stockBajo || data.stockBajo.length === 0) && (
              <EmptyState msg="No hay productos con stock por debajo del mínimo." />
            )}
            {data.stockBajo?.map(p => {
              const pct = Math.round((p.stock_actual / p.stock_minimo) * 100);
              return (
                <div key={p.id} style={styles.alertRow}>
                  <div style={styles.alertInfo}>
                    <div style={styles.alertName}>{p.nombre_comercial}</div>
                    <div style={styles.alertMeta}>Código: {p.codigo} · {p.categoria || 'Sin categoría'}</div>
                  </div>
                  <div style={styles.alertData}>
                    <div style={styles.stockBar}>
                      <div style={{ ...styles.stockBarFill, width: `${Math.min(pct, 100)}%`, background: '#FF9F0A' }} />
                    </div>
                    <div style={styles.stockNums}>
                      <span style={{ color: '#FF9F0A', fontWeight: 700 }}>{p.stock_actual} disp.</span>
                      <span style={{ color: 'var(--label2)' }}> / mín. {p.stock_minimo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pestaña: Próximos a Vencer */}
        {tab === 'proximosVencer' && (
          <div>
            <div style={styles.cardHeader}>
              <Clock size={16} color="#FF9F0A" />
              <span>Lotes que vencen en los próximos 30 días ({data.proximosVencer?.length || 0})</span>
            </div>
            {(!data.proximosVencer || data.proximosVencer.length === 0) && (
              <EmptyState msg="No hay lotes próximos a vencer en los siguientes 30 días." />
            )}
            {data.proximosVencer?.map(l => {
              const days = daysLeft(l.fecha_vencimiento);
              return (
                <div key={l.id} style={styles.alertRow}>
                  <div style={styles.alertInfo}>
                    <div style={styles.alertName}>{l.nombre_comercial}</div>
                    <div style={styles.alertMeta}>Lote: {l.numero_lote}</div>
                  </div>
                  <div style={styles.alertData}>
                    <div style={{ ...styles.badge, background: days <= 7 ? '#FFF0EF' : '#FFF5E6', color: days <= 7 ? '#FF3B30' : '#FF9F0A' }}>
                      {days <= 0 ? 'Vence HOY' : `${days} días restantes`}
                    </div>
                    <div style={styles.alertMeta}>{l.fecha_vencimiento} · {l.cantidad_disponible} uds disponibles</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pestaña: Vencidos */}
        {tab === 'vencidos' && (
          <div>
            <div style={styles.cardHeader}>
              <AlertTriangle size={16} color="#BF5AF2" />
              <span>Lotes vencidos con stock ({data.vencidos?.length || 0})</span>
            </div>
            {(!data.vencidos || data.vencidos.length === 0) && (
              <EmptyState msg="No hay lotes vencidos en stock." />
            )}
            {data.vencidos?.map(l => (
              <div key={l.id} style={styles.alertRow}>
                <div style={styles.alertInfo}>
                  <div style={styles.alertName}>{l.nombre_comercial}</div>
                  <div style={styles.alertMeta}>Lote: {l.numero_lote}</div>
                </div>
                <div style={styles.alertData}>
                  <div style={{ ...styles.badge, background: '#F5E6FF', color: '#BF5AF2' }}>VENCIDO</div>
                  <div style={styles.alertMeta}>{l.fecha_vencimiento} · {l.cantidad_disponible} uds</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--label2)' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <CheckCircle2 size={36} color="#30D158" strokeWidth={1.75} />
      </div>
      <p>{msg}</p>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  header: { marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 700, color: '#000', letterSpacing: '-0.5px' },
  sub: { fontSize: 14, color: 'var(--label2)', marginTop: 4 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  summaryCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
    padding: '20px', borderRadius: 16, border: '2px solid',
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
    boxShadow: 'var(--shadow-sm)',
  },
  summaryIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryNum: { fontSize: 32, fontWeight: 700, color: '#000', letterSpacing: '-1px' },
  summaryLabel: { fontSize: 13, fontWeight: 600, color: 'var(--label2)' },
  card: { background: '#FFF', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '14px 20px', background: '#FAFAFA',
    borderBottom: '1px solid var(--separator)',
    fontSize: 13, fontWeight: 600, color: 'var(--label2)',
  },
  alertRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    padding: '14px 20px', borderBottom: '1px solid var(--separator)',
  },
  alertInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  alertName: { fontSize: 14, fontWeight: 600, color: '#000' },
  alertMeta: { fontSize: 12, color: 'var(--label2)' },
  alertData: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  stockBar: { width: 100, height: 6, background: '#F2F2F7', borderRadius: 999, overflow: 'hidden' },
  stockBarFill: { height: '100%', borderRadius: 999, transition: 'width 0.5s' },
  stockNums: { fontSize: 13 },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.3px' },
};
