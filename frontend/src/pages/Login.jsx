import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.usuario, form.password);
      navigate(user.rol === 'admin' ? '/dashboard' : '/pos');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <div style={styles.logoWrap}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="12" fill="#0A84FF"/>
              <path d="M18 10C18 8.89543 18.8954 8 20 8H24C25.1046 8 26 8.89543 26 10V18H34C35.1046 18 36 18.8954 36 20V24C36 25.1046 35.1046 26 34 26H26V34C26 35.1046 25.1046 36 24 36H20C18.8954 36 18 35.1046 18 34V26H10C8.89543 26 8 25.1046 8 24V20C8 18.8954 8.89543 18 10 18H18V10Z" fill="white"/>
            </svg>
          </div>
          <h1 style={styles.logoTitle}>Nova Salud</h1>
          <p style={styles.logoSub}>Sistema de Gestión de Botica</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Usuario</label>
            <input
              style={styles.input}
              type="text"
              placeholder=""
              value={form.usuario}
              onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder=""
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div style={styles.hint}>
          <p style={styles.hintTitle}>Cuentas de prueba</p>
          <div style={styles.hintGrid}>
            <Credential label="Administrador" user="admin" pass="admin123" onClick={() => setForm({ usuario: 'admin', password: 'admin123' })} />
            <Credential label="Vendedor" user="vendedor1" pass="vendedor123" onClick={() => setForm({ usuario: 'vendedor1', password: 'vendedor123' })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Credential({ label, user, pass, onClick }) {
  return (
    <button onClick={onClick} style={styles.cred} type="button">
      <span style={styles.credLabel}>{label}</span>
      <span style={styles.credUser}>{user}</span>
      <span style={styles.credPass}>{pass}</span>
    </button>
  );
}

const styles = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #E8F4FF 0%, #F2F2F7 50%, #EEF0FF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: 24,
    padding: '44px 40px 32px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)',
  },
  brand: { textAlign: 'center', marginBottom: 36 },
  logoWrap: {
    width: 72, height: 72,
    borderRadius: 20,
    background: 'linear-gradient(145deg, #E8F4FF, #F5F5FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 4px 16px rgba(10,132,255,0.15)',
  },
  logoTitle: { fontSize: 26, fontWeight: 700, color: '#000', letterSpacing: '-0.5px' },
  logoSub: { fontSize: 14, color: 'rgba(60,60,67,0.60)', marginTop: 4, fontWeight: 400 },
  form: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: 'rgba(60,60,67,0.80)', letterSpacing: '0.1px' },
  input: {
    padding: '13px 16px',
    border: '1.5px solid rgba(60,60,67,0.15)',
    borderRadius: 12,
    fontSize: 15,
    color: '#000',
    background: '#FAFAFA',
    outline: 'none',
    transition: 'all 0.15s',
  },
  errorBox: {
    padding: '12px 16px',
    background: '#FFF0EF',
    border: '1px solid rgba(255,59,48,0.2)',
    borderRadius: 10,
    fontSize: 14,
    color: '#FF3B30',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  btn: {
    padding: '15px',
    background: '#0A84FF',
    color: '#FFF',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '-0.1px',
    transition: 'all 0.15s',
    marginTop: 4,
  },
  hint: {
    padding: '16px',
    background: '#F2F2F7',
    borderRadius: 14,
  },
  hintTitle: { fontSize: 12, fontWeight: 600, color: 'rgba(60,60,67,0.50)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 },
  hintGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  cred: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '10px 12px',
    background: '#FFF',
    border: '1px solid rgba(60,60,67,0.10)',
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  credLabel: { fontSize: 11, color: 'rgba(60,60,67,0.50)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' },
  credUser: { fontSize: 14, color: '#000', fontWeight: 600 },
  credPass: { fontSize: 12, color: '#0A84FF', fontFamily: 'monospace' },
};
