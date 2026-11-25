import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingCart, AlertTriangle, Clock, ArrowRight, Package, BarChart2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { authFetch, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/reportes/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <PageLoader />;

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Hola, {user?.nombre?.split(' ')[0]}</h1>
          <p style={styles.subtitle}>{hoy}</p>
        </div>
        <Link to="/pos" style={styles.posBtn}>
          <ShoppingCart size={16} strokeWidth={2.5} />
          Nueva Venta
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <KpiCard
          icon={<TrendingUp size={22} color="#30D158" />}
          iconBg="#E8FAF0"
          label="Ventas hoy"
          value={`S/ ${(stats?.totalVentasHoy || 0).toFixed(2)}`}
          sub={`${stats?.ventasHoy || 0} transacciones`}
          color="#30D158"
        />
        <KpiCard
          icon={<AlertCircle size={22} color="#FF3B30" />}
          iconBg="#FFF0EF"
          label="Sin Stock"
          value={stats?.sinStockCount || 0}
          sub="productos agotados"
          color="#FF3B30"
          link="/alertas"
        />
        <KpiCard
          icon={<AlertTriangle size={22} color="#FF9F0A" />}
          iconBg="#FFF5E6"
          label="Stock bajo"
          value={stats?.stockBajoCount || 0}
          sub="por reponer"
          color="#FF9F0A"
          link="/alertas"
        />
        <KpiCard
          icon={<Clock size={22} color="#FF9F0A" />}
          iconBg="#FFF5E6"
          label="Próx. a vencer"
          value={stats?.proximosVencerCount || 0}
          sub="lotes en 30 días"
          color="#FF9F0A"
          link="/alertas"
        />
      </div>

      {/* Últimas ventas */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Últimas ventas</h2>
          <Link to="/reportes" style={styles.seeAll}>Ver todas <ArrowRight size={14} /></Link>
        </div>
        <div style={styles.card}>
          {stats?.ultimas5Ventas?.length === 0 && (
            <div style={styles.emptyState}>
              <Package size={40} color="var(--label3)" />
              <p>No hay ventas registradas hoy</p>
            </div>
          )}
          {stats?.ultimas5Ventas?.map((v, i) => (
            <div key={v.id} style={{ ...styles.ventaRow, borderBottom: i < stats.ultimas5Ventas.length - 1 ? '1px solid var(--separator)' : 'none' }}>
              <div style={styles.comprobanteTag}>{v.numero_comprobante}</div>
              <div style={styles.ventaInfo}>
                <span style={styles.ventaCliente}>{v.cliente_nombre || 'Cliente General'}</span>
                <span style={styles.ventaHora}>{new Date(v.fecha_hora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={styles.ventaTotal}>S/ {Number(v.total).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Accesos rápidos</h2>
        <div style={styles.quickGrid}>
          <QuickLink
            to="/pos"
            icon={<ShoppingCart size={20} color="#0A84FF" />}
            iconBg="#E8F4FF"
            label="Punto de Venta"
            desc="Registrar nueva venta"
          />
          <QuickLink
            to="/alertas"
            icon={<AlertTriangle size={20} color="#FF9F0A" />}
            iconBg="#FFF5E6"
            label="Alertas"
            desc="Stock bajo y vencimientos"
          />
          <QuickLink
            to="/reportes"
            icon={<BarChart2 size={20} color="#5E5CE6" />}
            iconBg="#F2F1FD"
            label="Reportes"
            desc="Ventas y estadísticas"
          />
          {user?.rol === 'admin' && (
            <QuickLink
              to="/inventario"
              icon={<Package size={20} color="#30D158" />}
              iconBg="#E8FAF0"
              label="Inventario"
              desc="Productos y lotes"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, iconBg, label, value, sub, color, link }) {
  const content = (
    <div style={{ ...styles.kpiCard }}>
      <div style={{ ...styles.kpiIcon, background: iconBg }}>{icon}</div>
      <div style={styles.kpiValue} >{value}</div>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiSub}>{sub}</div>
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function QuickLink({ to, icon, iconBg, label, desc }) {
  return (
    <Link to={to} style={styles.quickCard}>
      <div style={{ ...styles.quickIconBox, background: iconBg }}>{icon}</div>
      <span style={styles.quickLabel}>{label}</span>
      <span style={styles.quickDesc}>{desc}</span>
    </Link>
  );
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ color: 'var(--label2)', fontSize: 15 }}>Cargando…</div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 28 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 28, fontWeight: 700, color: '#000', letterSpacing: '-0.5px' },
  subtitle: { fontSize: 14, color: 'var(--label2)', marginTop: 4, textTransform: 'capitalize' },
  posBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 20px',
    background: '#0A84FF', color: '#FFF',
    borderRadius: 12, fontSize: 14, fontWeight: 600,
    textDecoration: 'none', transition: 'all 0.15s',
    boxShadow: '0 4px 16px rgba(10,132,255,0.30)',
  },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  kpiCard: {
    background: '#FFF', borderRadius: 16,
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex', flexDirection: 'column', gap: 4,
    transition: 'all 0.15s',
    cursor: 'default',
  },
  kpiIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 28, fontWeight: 700, color: '#000', letterSpacing: '-0.5px', lineHeight: 1 },
  kpiLabel: { fontSize: 13, fontWeight: 600, color: '#000' },
  kpiSub: { fontSize: 12, color: 'var(--label2)' },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#000', letterSpacing: '-0.3px' },
  seeAll: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#0A84FF', fontWeight: 500, textDecoration: 'none' },
  card: { background: '#FFF', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  ventaRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' },
  comprobanteTag: {
    fontSize: 11, fontWeight: 600, color: '#0A84FF',
    background: '#E8F4FF', borderRadius: 6, padding: '3px 8px',
    fontFamily: 'monospace', whiteSpace: 'nowrap',
  },
  ventaInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1 },
  ventaCliente: { fontSize: 14, fontWeight: 500, color: '#000' },
  ventaHora: { fontSize: 12, color: 'var(--label2)' },
  ventaTotal: { fontSize: 16, fontWeight: 700, color: '#000' },
  emptyState: { padding: '40px', textAlign: 'center', color: 'var(--label2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  quickCard: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '20px',
    background: '#FFF', borderRadius: 16,
    textDecoration: 'none',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.15s',
  },
  quickIconBox: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { fontSize: 14, fontWeight: 600, color: '#000' },
  quickDesc: { fontSize: 12, color: 'var(--label2)' },
};
