'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const lineaInicial = { descripcion: '', cantidad: '1', precio_unitario: '', tipo_iva: '10' };

const dinero = (valor) => new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2,
}).format(Number(valor) || 0);

export default function VerifactuPanel({ negocioNombre }) {
  const [facturas, setFacturas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cliente, setCliente] = useState({ nombre: '', nif: '', direccion: '' });
  const [lineas, setLineas] = useState([{ ...lineaInicial }]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  async function tokenActual() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error('Tu sesión ha caducado. Vuelve a entrar.');
    return data.session.access_token;
  }

  async function cargarFacturas() {
    setCargando(true);
    try {
      const token = await tokenActual();
      const response = await fetch('/api/verifactu', { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudieron cargar las facturas.');
      setFacturas(body.facturas || []);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void cargarFacturas(); });
  }, []);

  function actualizarLinea(indice, campo, valor) {
    setLineas((actuales) => actuales.map((linea, i) => (
      i === indice ? { ...linea, [campo]: valor } : linea
    )));
  }

  async function emitirFactura(event) {
    event.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const token = await tokenActual();
      const response = await fetch('/api/verifactu', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, lineas }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'No se pudo emitir la factura.');

      setFacturas((actuales) => [body.factura, ...actuales]);
      setCliente({ nombre: '', nif: '', direccion: '' });
      setLineas([{ ...lineaInicial }]);
      setMostrarFormulario(false);
      setMensaje({ tipo: 'ok', texto: `Factura ${String(body.factura.numero).padStart(3, '0')} emitida. La conexión AEAT está pendiente de configuración.` });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setGuardando(false);
    }
  }

  const mesActual = new Date().toISOString().slice(0, 7);
  const facturasMes = facturas.filter((factura) => factura.fecha_emision?.startsWith(mesActual));
  const totalMes = facturasMes.reduce((total, factura) => total + Number(factura.total || 0), 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Facturas</h1>
          <p style={styles.subtitle}>VeriFactu · {negocioNombre}</p>
        </div>
        <button style={styles.primaryButton} onClick={() => { setMensaje(null); setMostrarFormulario(true); }}>
          + Nueva factura
        </button>
      </div>

      {mensaje && <div style={{ ...styles.message, ...(mensaje.tipo === 'error' ? styles.error : styles.success) }}>{mensaje.texto}</div>}

      <div style={styles.metrics}>
        <Metric label="Facturado este mes" value={dinero(totalMes)} />
        <Metric label="Facturas emitidas" value={facturas.length} />
        <Metric label="AEAT pendiente" value={facturas.filter((f) => f.aeat_estado !== 'aceptada').length} />
      </div>

      {mostrarFormulario && (
        <form onSubmit={emitirFactura} style={styles.card}>
          <div style={styles.formTitle}>Nueva factura <span style={styles.draft}>Borrador</span></div>
          <div style={styles.sectionLabel}>DATOS DEL CLIENTE</div>
          <div style={styles.grid}>
            <input required placeholder="Nombre o razón social" value={cliente.nombre} onChange={(event) => setCliente({ ...cliente, nombre: event.target.value })} style={styles.input} />
            <input required placeholder="NIF" value={cliente.nif} onChange={(event) => setCliente({ ...cliente, nif: event.target.value })} style={styles.input} />
          </div>
          <input placeholder="Dirección" value={cliente.direccion} onChange={(event) => setCliente({ ...cliente, direccion: event.target.value })} style={{ ...styles.input, width: '100%' }} />

          <div style={styles.sectionLabel}>CONCEPTOS</div>
          {lineas.map((linea, indice) => (
            <div key={indice} style={styles.linea}>
              <input required placeholder="Descripción" value={linea.descripcion} onChange={(event) => actualizarLinea(indice, 'descripcion', event.target.value)} style={{ ...styles.input, flex: 1 }} />
              <input required type="number" min="0.001" step="0.001" placeholder="Cant." value={linea.cantidad} onChange={(event) => actualizarLinea(indice, 'cantidad', event.target.value)} style={styles.smallInput} />
              <input required type="number" min="0" step="0.01" placeholder="Precio" value={linea.precio_unitario} onChange={(event) => actualizarLinea(indice, 'precio_unitario', event.target.value)} style={styles.smallInput} />
              <input required type="number" min="0" step="0.01" placeholder="IVA %" value={linea.tipo_iva} onChange={(event) => actualizarLinea(indice, 'tipo_iva', event.target.value)} style={styles.smallInput} />
            </div>
          ))}
          <button type="button" style={styles.linkButton} onClick={() => setLineas([...lineas, { ...lineaInicial }])}>+ Añadir concepto</button>
          <div style={styles.formActions}>
            <button type="button" style={styles.secondaryButton} onClick={() => setMostrarFormulario(false)}>Cancelar</button>
            <button type="submit" disabled={guardando} style={styles.primaryButton}>{guardando ? 'Emitiendo...' : 'Emitir factura'}</button>
          </div>
          <p style={styles.note}>Al emitir se asigna número correlativo y huella SHA-256. El envío a AEAT requiere configurar certificado y entorno de pruebas.</p>
        </form>
      )}

      <div style={styles.table}>
        <div style={{ ...styles.row, ...styles.tableHead }}><span>Número</span><span>Cliente</span><span>Total</span><span>Estado</span></div>
        {cargando && <div style={styles.empty}>Cargando facturas...</div>}
        {!cargando && facturas.length === 0 && <div style={styles.empty}>Aún no has emitido ninguna factura.</div>}
        {!cargando && facturas.map((factura) => (
          <div key={factura.id} style={styles.row}>
            <span style={styles.muted}>{String(factura.numero).padStart(3, '0')}</span>
            <span>{factura.cliente?.nombre || 'Sin cliente'}</span>
            <strong>{dinero(factura.total)}</strong>
            <span style={styles.badge}>{factura.aeat_estado === 'aceptada' ? 'Aceptada AEAT' : 'Emitida local'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div style={styles.metric}><span style={styles.metricLabel}>{label}</span><strong style={styles.metricValue}>{value}</strong></div>;
}

const styles = {
  container: { color: '#15271C' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: 28, fontWeight: 800, color: '#F4F7F1' },
  subtitle: { margin: '4px 0 0', color: '#B7C7BE' },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 },
  metric: { background: '#F6F5EF', borderRadius: 8, padding: 14 },
  metricLabel: { display: 'block', color: '#5C6B61', fontSize: 13 },
  metricValue: { display: 'block', fontSize: 22, marginTop: 4 },
  card: { background: '#fff', border: '1px solid #E2E0D2', borderRadius: 12, padding: 20, marginBottom: 18 },
  formTitle: { fontSize: 22, fontWeight: 700, marginBottom: 18 },
  sectionLabel: { color: '#9A9A90', fontSize: 12, fontWeight: 700, margin: '16px 0 10px' },
  draft: { background: '#FAEEDA', color: '#854F0B', fontSize: 12, padding: '4px 8px', borderRadius: 6, verticalAlign: 'middle' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 },
  input: { boxSizing: 'border-box', border: '1px solid #E2E0D2', borderRadius: 8, padding: '10px 12px', font: 'inherit', minWidth: 0 },
  smallInput: { width: 82, boxSizing: 'border-box', border: '1px solid #E2E0D2', borderRadius: 8, padding: '10px 8px', font: 'inherit' },
  linea: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' },
  linkButton: { border: 0, background: 'none', color: '#1A6A48', cursor: 'pointer', padding: '6px 0', font: 'inherit', fontWeight: 600 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  primaryButton: { border: 0, borderRadius: 8, background: '#1A6A48', color: '#fff', cursor: 'pointer', padding: '10px 16px', font: 'inherit', fontWeight: 700 },
  secondaryButton: { border: '1px solid #2E9E6B', borderRadius: 8, background: '#fff', color: '#1A6A48', cursor: 'pointer', padding: '10px 16px', font: 'inherit', fontWeight: 600 },
  note: { color: '#7A857D', fontSize: 13, margin: '12px 0 0' },
  table: { background: '#fff', border: '1px solid #E2E0D2', borderRadius: 10, overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: '90px 1fr 110px 130px', gap: 8, alignItems: 'center', padding: '13px 14px', borderBottom: '1px solid #EDEBE0', fontSize: 14 },
  tableHead: { color: '#9A9A90', fontSize: 12, fontWeight: 700 },
  muted: { color: '#5C6B61' },
  badge: { justifySelf: 'start', background: '#E1F5EE', color: '#0F6E56', fontSize: 12, padding: '4px 8px', borderRadius: 6 },
  empty: { padding: 24, textAlign: 'center', color: '#5C6B61' },
  message: { borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 14 },
  success: { background: '#E1F5EE', color: '#0F6E56' },
  error: { background: '#FDECEC', color: '#A32D2D' },
};
