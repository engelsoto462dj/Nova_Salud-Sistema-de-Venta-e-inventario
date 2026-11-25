import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, ShoppingCart, Package, AlertTriangle, BarChart2, LogOut, Activity } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isPOS = location.pathname.startsWith('/pos');

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Inicio' },
    { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
    { to: '/alertas', icon: AlertTriangle, label: 'Alertas' },
    { to: '/reportes', icon: BarChart2, label: 'Reportes' },
    ...(user?.rol === 'admin' ? [{ to: '/inventario', icon: Package, label: 'Inventario' }] : []),
  ];

  return (
    <div style={styles.wrap}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sideTop}>
          <div style={styles.brand}>
            <div style={styles.logoBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M10 4C10 3.44772 10.4477 3 11 3H13C13.5523 3 14 3.44772 14 4V10H20C20.5523 10 21 10.4477 21 11V13C21 13.5523 20.5523 14 20 14H14V20C14 20.5523 13.5523 21 13 21H11C10.4477 21 10 20.5523 10 20V14H4C3.44772 14 3 13.5523 3 13V11C3 10.4477 3.44772 10 4 10H10V4Z" fill="#0A84FF"/>
              </svg>
            </div>
            <div>
              <div style={styles.brandName}>Nova Salud</div>
              <div style={styles.brandSub}>Botica</div>
            </div>
          </div>

          <nav style={styles.nav}>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={styles.sideBottom}>
          <div style={styles.userCard}>
            <div style={styles.avatar}>{user?.nombre?.[0] || 'U'}</div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.nombre}</div>
              <div style={styles.userRole}>{user?.rol === 'admin' ? 'Administrador' : 'Vendedor'}</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ ...styles.main, ...(isPOS ? styles.mainPOS : {}) }}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', height: '100vh', maxHeight: '100vh', background: 'var(--bg)', overflow: 'hidden' },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: '#FFFFFF',
    borderRight: '1px solid var(--separator)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 12px',
    height: '100vh',
    flexShrink: 0,
  },
  sideTop: { display: 'flex', flexDirection: 'column', gap: 32 },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' },
  logoBox: {
    width: 36, height: 36, borderRadius: 10,
    background: '#E8F4FF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  brandName: { fontSize: 15, fontWeight: 700, color: '#000', letterSpacing: '-0.3px' },
  brandSub: { fontSize: 11, color: 'var(--label2)', fontWeight: 500 },
  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    fontSize: 14, fontWeight: 500,
    color: 'var(--label2)',
    transition: 'all 0.15s',
    textDecoration: 'none',
  },
  navItemActive: {
    background: '#E8F4FF',
    color: '#0A84FF',
    fontWeight: 600,
  },
  sideBottom: { padding: '0 0' },
  userCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px',
    background: 'var(--fill2)',
    borderRadius: 12,
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
    color: '#FFF', fontSize: 14, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { fontSize: 11, color: 'var(--label2)', fontWeight: 400 },
  logoutBtn: {
    padding: 6, borderRadius: 8, border: 'none',
    background: 'transparent',
    color: 'var(--label2)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    transition: 'all 0.15s',
  },
  main: { flex: 1, padding: '32px 36px', overflowY: 'auto', height: '100vh', maxWidth: 1400 },
  mainPOS: {
    padding: '20px 24px',
    overflow: 'hidden',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 'none',
  },
};
