import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Edit2, Trash2, Package, ChevronDown, X, Check } from 'lucide-react';

export default function Inventario() {
  const { authFetch } = useAuth();
  const [tab, setTab] = useState('productos'); // productos | categorias | proveedores | lotes
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [modal, setModal] = useState(null); // { type: 'producto'|'categoria'|'proveedor'|'lote', data: {} }
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const cargar = async () => {
    setLoading(true);
    const [pr, ca, pv, lo] = await Promise.all([
      authFetch('/api/productos').then(r => r.json()),
      authFetch('/api/categorias').then(r => r.json()),
      authFetch('/api/proveedores').then(r => r.json()),
      authFetch('/api/lotes').then(r => r.json()),
    ]);
    setProductos(pr); setCategorias(ca); setProveedores(pv); setLotes(lo);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Inventario</h1>
          <p style={styles.sub}>Gestión de productos, categorías, proveedores y lotes</p>
        </div>
        {msg && (
          <div style={styles.toast}><Check size={14} /> {msg}</div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[['productos', 'Productos'], ['lotes', 'Lotes / Ingresos'], ['categorias', 'Categorías'], ['proveedores', 'Proveedores']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}) }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loadingBox}>Cargando…</div>
      ) : (
        <>
          {tab === 'productos' && (
            <TabProductos
              productos={productos} categorias={categorias}
              onAdd={() => setModal({ type: 'producto', data: {} })}
              onEdit={(p) => setModal({ type: 'producto', data: p })}
              onDelete={async (id) => {
                await authFetch(`/api/productos/${id}`, { method: 'DELETE' });
                notify('Producto desactivado'); cargar();
              }}
            />
          )}
          {tab === 'lotes' && (
            <TabLotes lotes={lotes} onAdd={() => setModal({ type: 'lote', data: {} })} />
          )}
          {tab === 'categorias' && (
            <TabSimple
              items={categorias} label="Categoría" campo="nombre"
              onAdd={() => setModal({ type: 'categoria', data: {} })}
              onEdit={(c) => setModal({ type: 'categoria', data: c })}
              onDelete={async (id) => { await authFetch(`/api/categorias/${id}`, { method: 'DELETE' }); notify('Eliminada'); cargar(); }}
            />
          )}
          {tab === 'proveedores' && (
            <TabSimple
              items={proveedores} label="Proveedor"
              campos={[['ruc','RUC'], ['razon_social','Razón Social'], ['telefono','Teléfono'], ['contacto','Contacto']]}
              onAdd={() => setModal({ type: 'proveedor', data: {} })}
              onEdit={(p) => setModal({ type: 'proveedor', data: p })}
              onDelete={async (id) => { await authFetch(`/api/proveedores/${id}`, { method: 'DELETE' }); notify('Eliminado'); cargar(); }}
            />
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <Modal
          type={modal.type} data={modal.data}
          categorias={categorias} proveedores={proveedores} productos={productos}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            const { type, data } = modal;
            const isEdit = !!data.id;
            const url = `/api/${type === 'lote' ? 'lotes' : type === 'categoria' ? 'categorias' : type === 'proveedor' ? 'proveedores' : 'productos'}${isEdit ? `/${data.id}` : ''}`;
            await authFetch(url, { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) });
            notify(isEdit ? 'Actualizado correctamente' : 'Creado correctamente');
            setModal(null); cargar();
          }}
        />
      )}
    </div>
  );
}

function TabProductos({ productos, categorias, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div style={styles.tableHeader}>
        <span style={styles.tableCount}>{productos.length} productos</span>
        <button onClick={onAdd} style={styles.addBtn}><Plus size={15} /> Nuevo Producto</button>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>{['Código','Nombre','Principio Activo','Presentación','Precio','Stock','Mínimo','Categoría',''].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id} style={styles.tr}>
                <td style={styles.td}><code style={styles.code}>{p.codigo}</code></td>
                <td style={styles.td}><strong>{p.nombre_comercial}</strong></td>
                <td style={styles.td}>{p.principio_activo || '—'}</td>
                <td style={styles.td}>{p.presentacion || '—'}</td>
                <td style={styles.td}>S/ {Number(p.precio_venta).toFixed(2)}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.stockChip,
                    background: p.stock_actual <= p.stock_minimo ? '#FFF0EF' : '#F2F2F7',
                    color: p.stock_actual <= p.stock_minimo ? '#FF3B30' : '#000',
                    fontWeight: p.stock_actual <= p.stock_minimo ? 700 : 400,
                  }}>{p.stock_actual}</span>
                </td>
                <td style={styles.td}>{p.stock_minimo}</td>
                <td style={styles.td}>{p.categoria_nombre || '—'}</td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button onClick={() => onEdit(p)} style={styles.iconBtn}><Edit2 size={14} /></button>
                    <button onClick={() => onDelete(p.id)} style={{ ...styles.iconBtn, color: '#FF3B30' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabLotes({ lotes, onAdd }) {
  const hoy = new Date();
  return (
    <div>
      <div style={styles.tableHeader}>
        <span style={styles.tableCount}>{lotes.length} lotes registrados</span>
        <button onClick={onAdd} style={styles.addBtn}><Plus size={15} /> Ingresar Mercadería</button>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>{['Producto','Nº Lote','Proveedor','Fecha Venc.','Disponible','P. Compra'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {lotes.map(l => {
              const daysLeft = Math.ceil((new Date(l.fecha_vencimiento) - hoy) / 86400000);
              const isExp = daysLeft < 0;
              const isClose = !isExp && daysLeft <= 30;
              return (
                <tr key={l.id} style={styles.tr}>
                  <td style={styles.td}><strong>{l.nombre_comercial}</strong><br/><code style={styles.code}>{l.codigo}</code></td>
                  <td style={styles.td}><code style={styles.code}>{l.numero_lote}</code></td>
                  <td style={styles.td}>{l.proveedor_nombre || '—'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.stockChip,
                      background: isExp ? '#FFF0EF' : isClose ? '#FFF5E6' : '#E8FAF0',
                      color: isExp ? '#FF3B30' : isClose ? '#FF9F0A' : '#30D158',
                    }}>
                      {l.fecha_vencimiento}
                      {isClose && !isExp && ` (${daysLeft}d)`}
                      {isExp && ' (Vencido)'}
                    </span>
                  </td>
                  <td style={styles.td}>{l.cantidad_disponible}</td>
                  <td style={styles.td}>S/ {Number(l.precio_compra).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabSimple({ items, label, campos, campo, onAdd, onEdit, onDelete }) {
  const cols = campos || [['nombre', label]];
  return (
    <div>
      <div style={styles.tableHeader}>
        <span style={styles.tableCount}>{items.length} {label.toLowerCase()}s</span>
        <button onClick={onAdd} style={styles.addBtn}><Plus size={15} /> Nuevo/a {label}</button>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead><tr>{[...cols.map(([,h]) => h), ''].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={styles.tr}>
                {cols.map(([k]) => <td key={k} style={styles.td}>{item[k] || '—'}</td>)}
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button onClick={() => onEdit(item)} style={styles.iconBtn}><Edit2 size={14} /></button>
                    <button onClick={() => onDelete(item.id)} style={{ ...styles.iconBtn, color: '#FF3B30' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Modal({ type, data, categorias, proveedores, productos, onClose, onSave }) {
  const isEdit = !!data.id;
  const [form, setForm] = useState({ ...data });
  const [saving, setSaving] = useState(false);

  const field = (key, label, type = 'text', opts = {}) => (
    <div key={key} style={mStyles.field}>
      <label style={mStyles.label}>{label}</label>
      <input
        style={mStyles.input}
        type={type}
        value={form[key] || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        {...opts}
      />
    </div>
  );

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const fields = {
    producto: () => <>
      {field('codigo', 'Código *', 'text', { required: true })}
      {field('nombre_comercial', 'Nombre Comercial *', 'text', { required: true })}
      {field('principio_activo', 'Principio Activo')}
      {field('presentacion', 'Presentación')}
      {field('precio_venta', 'Precio Venta *', 'number', { step: '0.01', required: true })}
      {field('stock_actual', 'Stock Inicial', 'number')}
      {field('stock_minimo', 'Stock Mínimo', 'number')}
      <div style={mStyles.field}>
        <label style={mStyles.label}>Categoría</label>
        <select style={mStyles.input} value={form.categoria_id || ''} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
          <option value="">Sin categoría</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
    </>,
    categoria: () => field('nombre', 'Nombre *', 'text', { required: true }),
    proveedor: () => <>
      {field('ruc', 'RUC *', 'text', { required: true })}
      {field('razon_social', 'Razón Social *', 'text', { required: true })}
      {field('telefono', 'Teléfono')}
      {field('contacto', 'Contacto')}
    </>,
    lote: () => <>
      <div style={mStyles.field}>
        <label style={mStyles.label}>Producto *</label>
        <select style={mStyles.input} value={form.producto_id || ''} onChange={e => setForm(f => ({ ...f, producto_id: e.target.value }))} required>
          <option value="">Seleccionar…</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.nombre_comercial} ({p.codigo})</option>)}
        </select>
      </div>
      <div style={mStyles.field}>
        <label style={mStyles.label}>Proveedor</label>
        <select style={mStyles.input} value={form.proveedor_id || ''} onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}>
          <option value="">Sin proveedor</option>
          {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
        </select>
      </div>
      {field('numero_lote', 'Número de Lote *', 'text', { required: true })}
      {field('fecha_vencimiento', 'Fecha de Vencimiento *', 'date', { required: true })}
      {field('cantidad_disponible', 'Cantidad *', 'number', { required: true })}
      {field('precio_compra', 'Precio de Compra', 'number', { step: '0.01' })}
    </>,
  };

  const titles = { producto: 'Producto', categoria: 'Categoría', proveedor: 'Proveedor', lote: 'Ingreso de Mercadería' };

  return (
    <div style={mStyles.overlay}>
      <div style={mStyles.modal}>
        <div style={mStyles.modalHeader}>
          <h3 style={mStyles.modalTitle}>{isEdit ? 'Editar' : 'Nuevo/a'} {titles[type]}</h3>
          <button onClick={onClose} style={mStyles.closeBtn}><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} style={mStyles.form}>
          <div style={mStyles.fields}>{fields[type]?.()}</div>
          <div style={mStyles.modalActions}>
            <button type="button" onClick={onClose} style={mStyles.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={saving} style={mStyles.saveBtn}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  title: { fontSize: 26, fontWeight: 700, color: '#000', letterSpacing: '-0.5px' },
  sub: { fontSize: 14, color: 'var(--label2)', marginTop: 4 },
  toast: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px',
    background: '#E8FAF0', color: '#30D158',
    borderRadius: 10, fontSize: 13, fontWeight: 600,
  },
  tabs: { display: 'flex', gap: 4, background: '#F2F2F7', padding: 4, borderRadius: 12, width: 'fit-content' },
  tab: {
    padding: '8px 16px', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    background: 'transparent', color: 'var(--label2)',
    transition: 'all 0.15s',
  },
  tabActive: { background: '#FFF', color: '#000', fontWeight: 600, boxShadow: 'var(--shadow-sm)' },
  loadingBox: { padding: 40, textAlign: 'center', color: 'var(--label2)' },
  tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tableCount: { fontSize: 14, color: 'var(--label2)' },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 16px',
    background: '#0A84FF', color: '#FFF',
    border: 'none', borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  tableWrap: { background: '#FFF', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--label2)', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#FAFAFA', textAlign: 'left', borderBottom: '1px solid var(--separator)' },
  tr: { borderBottom: '1px solid var(--separator)' },
  td: { padding: '12px 16px', fontSize: 13, color: '#000', verticalAlign: 'middle' },
  code: { fontFamily: 'monospace', fontSize: 12, background: '#F2F2F7', padding: '2px 6px', borderRadius: 4 },
  stockChip: { display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  actions: { display: 'flex', gap: 4 },
  iconBtn: { padding: '5px 7px', border: 'none', background: 'var(--fill)', borderRadius: 8, cursor: 'pointer', color: 'var(--label2)', display: 'flex', alignItems: 'center' },
};

const mStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 },
  modal: { background: '#FFF', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.20)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--separator)' },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#000' },
  closeBtn: { padding: 6, border: 'none', background: 'var(--fill)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  form: { display: 'flex', flexDirection: 'column' },
  fields: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '60vh', overflowY: 'auto' },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--label2)' },
  input: { padding: '11px 14px', border: '1.5px solid var(--separator)', borderRadius: 10, fontSize: 14, outline: 'none', color: '#000', background: '#FAFAFA' },
  modalActions: { display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--separator)' },
  cancelBtn: { flex: 1, padding: '12px', border: '1.5px solid var(--separator)', borderRadius: 10, background: '#FFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  saveBtn: { flex: 2, padding: '12px', border: 'none', borderRadius: 10, background: '#0A84FF', color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};
