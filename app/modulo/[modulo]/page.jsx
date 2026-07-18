'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { supabase } from '../../supabaseClient';

/* ============================================================
   PÁGINA DE MÓDULO
   Ruta: /modulo/[modulo]  (ej. /modulo/verifactu, /modulo/stock)
   ============================================================ */
const INFO = {
  verifactu: {
    icono: '🧾',
    titulo: 'VeriFactu',
    sub: 'Cumplimiento fiscal',
    intro: 'Aquí podrás emitir tus facturas cumpliendo con la normativa de la AEAT, sin líos y pensado para hostelería.',
    features: [
      'Crea facturas en segundos con atajos de bar (menú del día, consumición, catering, evento)',
      'IVA al 10% por defecto, con cálculo automático de base y total',
      'Numeración correlativa y control de borradores antes de emitir',
      'QR y huella SHA-256 en cada factura emitida',
    ],
  },
  facturacion: {
    icono: '📄',
    titulo: 'Facturación Pro',
    sub: 'Presupuestos y proformas',
    intro: 'Crea presupuestos y proformas para eventos y catering, y conviértelos en factura legal en un clic.',
    features: [
      'Presupuestos y proformas con tu marca, sin valor fiscal hasta confirmar',
      'Anticipos y señales para reservar eventos',
      'Conversión presupuesto → factura sin volver a teclear',
      'Seguimiento del estado: enviado, aceptado, facturado',
    ],
  },
  clientes: {
    icono: '👥',
    titulo: 'Gestión de Clientes',
    sub: 'CRM y fidelización',
    intro: 'Conoce a tus clientes, su historial de consumo, y crea campañas de fidelización que les hagan volver.',
    features: [
      'Ficha completa con historial de consumo',
      'Programa de puntos y recompensas',
      'Reservas integradas',
      'Campañas por segmento (cumpleaños, inactivos, VIP)',
    ],
  },
  empleados: {
    icono: '🕒',
    titulo: 'Gestión de Empleados',
    sub: 'Fichajes y turnos',
    intro: 'Cumple con el registro de jornada obligatorio y gestiona turnos, ausencias y horas de tu equipo.',
    features: [
      'Registro de jornada legal',
      'Fichaje desde móvil o TPV',
      'Cuadrantes de turnos y ausencias',
      'Informe de horas por empleado',
    ],
  },
  alertas: {
    icono: '🌦️',
    titulo: 'Alertas',
    sub: 'Avisos del negocio',
    intro: 'Recibe avisos de factores externos que afectan tu afluencia: clima, obras, eventos cercanos.',
    features: [
      'Previsión de afluencia por clima',
      'Aviso de obras o cortes de calle',
      'Detección de eventos que traen clientes',
      'Recomendaciones para ajustar personal y stock',
    ],
  },
  stock: {
    icono: '📦',
    titulo: 'Control de Stock',
    sub: 'Inventario de almacén',
  },
};

const MODULOS_FUNCIONALES = ['stock'];

export default function ModuloPage() {
  const router = useRouter();
  const params = useParams();
  const moduloId = params?.modulo;
  const [estado, setEstado] = useState('cargando');
  const [negocioId, setNegocioId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/acceso'); return; }
      setUserId(user.id);

      const { data: negocio } = await supabase
        .from('negocios')
        .select('id')
        .eq('propietario', user.id)
        .maybeSingle();

      if (!negocio) { router.replace('/catalogo'); return; }
      setNegocioId(negocio.id);

      const { data: mods } = await supabase
        .from('modulos_activos')
        .select('modulo')
        .eq('negocio_id', negocio.id)
        .eq('estado', 'activo')
        .eq('modulo', moduloId)
        .limit(1);

      if (mods && mods.length > 0) setEstado('ok');
      else setEstado('sin-acceso');
    })();
  }, [moduloId, router]);

  const info = INFO[moduloId];

  if (!info) {
    return (
      <div style={wrap}>
        <div style={card}>
          <p style={{ color: '#EAF3EC' }}>Módulo no encontrado.</p>
          <button onClick={() => router.push('/panel')} style={btn}>Volver al panel</button>
        </div>
      </div>
    );
  }

  if (estado === 'cargando') {
    return <div style={wrap}><p style={{ color: '#B7C7BE' }}>Cargando…</p></div>;
  }

  if (estado === 'sin-acceso') {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🔒</div>
          <h1 style={h1}>{info.titulo}</h1>
          <p style={{ color: '#B7C7BE', marginBottom: 24 }}>Aún no tienes este módulo contratado.</p>
          <button onClick={() => router.push('/catalogo')} style={btnLima}>Ver cómo contratarlo</button>
          <button onClick={() => router.push('/panel')} style={btnGhost}>Volver al panel</button>
        </div>
      </div>
    );
  }

  if (MODULOS_FUNCIONALES.includes(moduloId)) {
    return (
      <div style={wrapPanel}>
        <div style={containerPanel}>
          <button onClick={() => router.push('/panel')} style={backLink}>← Volver al panel</button>
          <PanelStock negocioId={negocioId} userId={userId} info={info} />
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={container}>
        <button onClick={() => router.push('/panel')} style={backLink}>← Volver al panel</button>
        <div style={{ fontSize: 54, marginBottom: 10 }}>{info.icono}</div>
        <div style={eyebrow}>{info.sub}</div>
        <h1 style={h1Big}>{info.titulo}</h1>
        <div style={badge}>🛠️ En desarrollo · disponible muy pronto</div>
        <p style={intro}>{info.intro}</p>
        <div style={featBox}>
          <div style={featTitle}>Lo que podrás hacer aquí:</div>
          {info.features.map((f, i) => (
            <div key={i} style={featRow}>
              <span style={{ color: '#7FC9A4', fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <p style={reassure}>
          Tu módulo ya está activo y reservado. Te avisaremos en cuanto esté listo para usar.
        </p>
       {moduloId === 'verifactu' && (
      <button onClick={() => router.push('/demo/verifactu')} style={btnPreview}>
        Ver vista previa del módulo →
      </button>
    )}
       </div>
    </div>
  );
}

/* ============================================================
   ICONO AUTOMÁTICO POR NOMBRE DE PRODUCTO
   ============================================================ */
const MAPA_EMOJIS = [
  { keywords: ['cerveza', 'birra'], emoji: '🍺' },
  { keywords: ['vino', 'cava', 'champan', 'champán'], emoji: '🍷' },
  { keywords: ['agua'], emoji: '💧' },
  { keywords: ['refresco', 'cola', 'fanta', 'sprite', 'tonica', 'tónica'], emoji: '🥤' },
  { keywords: ['cafe', 'café'], emoji: '☕' },
  { keywords: ['leche'], emoji: '🥛' },
  { keywords: ['aceite'], emoji: '🫒' },
  { keywords: ['harina', 'pan', 'trigo', 'masa'], emoji: '🌾' },
  { keywords: ['carne', 'pollo', 'ternera', 'cerdo', 'jamon', 'jamón'], emoji: '🥩' },
  { keywords: ['pescado', 'marisco', 'gamba', 'atun', 'atún'], emoji: '🐟' },
  { keywords: ['fruta', 'manzana', 'naranja', 'platano', 'plátano', 'limon', 'limón'], emoji: '🍎' },
  { keywords: ['tomate'], emoji: '🍅' },
  { keywords: ['verdura', 'lechuga', 'cebolla', 'ensalada'], emoji: '🥬' },
  { keywords: ['queso'], emoji: '🧀' },
  { keywords: ['huevo'], emoji: '🥚' },
  { keywords: ['hielo'], emoji: '🧊' },
  { keywords: ['servilleta', 'papel', 'vaso', 'desechable'], emoji: '🧻' },
  { keywords: ['limpieza', 'detergente', 'jabon', 'jabón', 'lejia', 'lejía'], emoji: '🧼' },
];

function adivinarEmoji(nombre) {
  const n = (nombre || '').toLowerCase();
  for (const { keywords, emoji } of MAPA_EMOJIS) {
    if (keywords.some((k) => n.includes(k))) return emoji;
  }
  return '📦';
}

/* ============================================================
   PANEL DE STOCK — funcionalidad real
   ============================================================ */
function PanelStock({ negocioId, userId, info }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('ud');
  const [nuevoMinimo, setNuevoMinimo] = useState('0');
  const [nuevoInicial, setNuevoInicial] = useState('0');
  const [guardandoAlta, setGuardandoAlta] = useState(false);

  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [detTipo, setDetTipo] = useState('entrada');
  const [detCantidad, setDetCantidad] = useState('1');
  const [detMotivo, setDetMotivo] = useState('');
  const [guardandoMov, setGuardandoMov] = useState(false);

  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);

  const [subiendoFotoId, setSubiendoFotoId] = useState(null); // producto_id cuya foto se está subiendo

  useEffect(() => {
    if (negocioId) cargarProductos();
  }, [negocioId]);

  async function cargarProductos() {
    setCargando(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) setError(error.message);
    else setProductos(data || []);
    setCargando(false);
    return data || [];
  }

  async function registrarMovimiento(producto_id, tipo, cantidad, motivo, silencioso = false) {
    const cant = Number(cantidad);
    if (!cant || cant <= 0) return;

    const { error } = await supabase.from('movimientos_stock').insert({
      producto_id,
      negocio_id: negocioId,
      tipo,
      cantidad: cant,
      motivo: motivo || null,
      creado_por: userId,
    });

    if (error) { setError(error.message); return; }
    if (!silencioso) await cargarProductos();
  }

  async function handleAltaProducto(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setGuardandoAlta(true);

    const { error } = await supabase.from('productos').insert({
      negocio_id: negocioId,
      nombre: nuevoNombre.trim(),
      unidad: nuevaUnidad,
      stock_minimo: Number(nuevoMinimo) || 0,
      stock_actual: Number(nuevoInicial) || 0,
    });

    setGuardandoAlta(false);
    if (error) { setError(error.message); return; }

    setNuevoNombre('');
    setNuevaUnidad('ud');
    setNuevoMinimo('0');
    setNuevoInicial('0');
    setMostrarAlta(false);
    await cargarProductos();
  }

  async function handleGuardarDetalle(producto_id) {
    setGuardandoMov(true);
    await registrarMovimiento(producto_id, detTipo, detCantidad, detMotivo);
    setGuardandoMov(false);
    setDetalleAbierto(null);
    setDetTipo('entrada');
    setDetCantidad('1');
    setDetMotivo('');
  }

  async function handleImportarArchivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportando(true);
    setResultadoImport(null);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const hoja = wb.Sheets[wb.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });

      const existentes = await cargarProductos();

      let creados = 0, actualizados = 0, errores = 0;

      for (const fila of filas) {
        const nombre = String(fila.nombre ?? fila.Nombre ?? '').trim();
        if (!nombre) { errores++; continue; }

        const unidad = String(fila.unidad ?? fila.Unidad ?? 'ud').trim() || 'ud';
        const stockMinimo = Number(fila.stock_minimo ?? fila['Stock minimo'] ?? fila['stock mínimo'] ?? 0) || 0;
        const stockActualDeseado = Number(fila.stock_actual ?? fila['Stock actual'] ?? fila['stock actual'] ?? 0) || 0;

        const existente = existentes.find(
          (p) => p.nombre.trim().toLowerCase() === nombre.toLowerCase()
        );

        if (existente) {
          const { error: errUpd } = await supabase
            .from('productos')
            .update({ unidad, stock_minimo: stockMinimo })
            .eq('id', existente.id);

          if (errUpd) { errores++; continue; }

          const diff = stockActualDeseado - existente.stock_actual;
          if (diff > 0) {
            await registrarMovimiento(existente.id, 'entrada', diff, 'Ajuste por importación', true);
          } else if (diff < 0) {
            await registrarMovimiento(existente.id, 'salida', Math.abs(diff), 'Ajuste por importación', true);
          }
          actualizados++;
        } else {
          const { error: errIns } = await supabase.from('productos').insert({
            negocio_id: negocioId,
            nombre,
            unidad,
            stock_minimo: stockMinimo,
            stock_actual: stockActualDeseado,
          });
          if (errIns) { errores++; continue; }
          creados++;
        }
      }

      setResultadoImport({ creados, actualizados, errores });
      await cargarProductos();
    } catch (err) {
      setError('No se pudo leer el archivo: ' + err.message);
    } finally {
      setImportando(false);
      e.target.value = '';
    }
  }

  // -------- Subida de foto de producto --------
  async function handleSubirFoto(producto_id, file) {
    if (!file) return;
    setSubiendoFotoId(producto_id);
    setError(null);

    try {
      const ext = file.name.split('.').pop();
      const ruta = `${negocioId}/${producto_id}-${Date.now()}.${ext}`;

      const { error: errUpload } = await supabase.storage
        .from('productos-stock')
        .upload(ruta, file, { upsert: true });

      if (errUpload) { setError(errUpload.message); return; }

      const { data: publicData } = supabase.storage
        .from('productos-stock')
        .getPublicUrl(ruta);

      const { error: errUpd } = await supabase
        .from('productos')
        .update({ imagen_url: publicData.publicUrl })
        .eq('id', producto_id);

      if (errUpd) { setError(errUpd.message); return; }

      await cargarProductos();
    } catch (err) {
      setError('No se pudo subir la foto: ' + err.message);
    } finally {
      setSubiendoFotoId(null);
    }
  }

  return (
    <div>
      <div style={{ fontSize: 44, marginBottom: 6 }}>{info.icono}</div>
      <div style={eyebrow}>{info.sub}</div>
      <h1 style={h1Big}>{info.titulo}</h1>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'left' }}>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <button
            onClick={() => setMostrarAlta((v) => !v)}
            style={{ ...btnLima, width: 'auto', padding: '10px 20px' }}
          >
            {mostrarAlta ? 'Cancelar' : '+ Añadir producto'}
          </button>

          <label style={btnImport}>
            {importando ? 'Importando…' : '📤 Importar CSV / Excel'}
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportarArchivo}
              disabled={importando}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <p style={hintImport}>
          Columnas esperadas: <code>nombre</code>, <code>unidad</code>, <code>stock_minimo</code>, <code>stock_actual</code>.
          Si un producto ya existe (mismo nombre), se actualiza en vez de duplicarse.
        </p>

        {resultadoImport && (
          <div style={resultBox}>
            ✅ {resultadoImport.creados} creados · 🔄 {resultadoImport.actualizados} actualizados
            {resultadoImport.errores > 0 && ` · ⚠️ ${resultadoImport.errores} filas con error`}
          </div>
        )}

        {mostrarAlta && (
          <form onSubmit={handleAltaProducto} style={altaBox}>
            <input
              placeholder="Nombre del producto (ej. Cerveza 33cl)"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              style={input}
              required
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)} style={{ ...input, flex: 1 }}>
                <option value="ud">unidades</option>
                <option value="kg">kg</option>
                <option value="l">litros</option>
                <option value="caja">cajas</option>
              </select>
              <input
                type="number"
                min="0"
                placeholder="Stock inicial (cuánto tienes ahora)"
                value={nuevoInicial}
                onChange={(e) => setNuevoInicial(e.target.value)}
                style={{ ...input, flex: 1 }}
              />
              <input
                type="number"
                min="0"
                placeholder="Stock mínimo (aviso)"
                value={nuevoMinimo}
                onChange={(e) => setNuevoMinimo(e.target.value)}
                style={{ ...input, flex: 1 }}
              />
            </div>
            <button type="submit" disabled={guardandoAlta} style={btnLima}>
              {guardandoAlta ? 'Guardando…' : 'Guardar producto'}
            </button>
          </form>
        )}

        {cargando && <p style={{ color: '#B7C7BE' }}>Cargando inventario…</p>}

        {!cargando && productos.length === 0 && (
          <p style={{ color: '#B7C7BE' }}>Aún no has añadido ningún producto.</p>
        )}

        {!cargando && productos.map((p) => {
          const bajoMinimo = p.stock_actual <= p.stock_minimo;
          const subiendo = subiendoFotoId === p.id;
          return (
            <div key={p.id} style={{ ...productoRow, borderColor: bajoMinimo ? '#E0725A' : 'rgba(255,255,255,.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>

                {/* --- icono / foto a la izquierda --- */}
                <div style={fotoWrap}>
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} style={fotoImg} />
                  ) : (
                    <div style={fotoEmoji}>{adivinarEmoji(p.nombre)}</div>
                  )}
                  <label style={fotoBtnCam} title="Subir foto de este producto">
                    {subiendo ? '…' : '📷'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={subiendo}
                      onChange={(e) => handleSubirFoto(p.id, e.target.files?.[0])}
                    />
                  </label>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{p.nombre}</div>
                  <div style={{ color: bajoMinimo ? '#E0725A' : '#8FA79A', fontSize: 13, marginTop: 2 }}>
                    {p.stock_actual} {p.unidad} en stock
                    {bajoMinimo && ' · por debajo del mínimo'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => registrarMovimiento(p.id, 'salida', 1, null)}
                    style={btnRound}
                    title="Restar 1 unidad del stock"
                  >
                    −1
                  </button>
                  <button
                    onClick={() => registrarMovimiento(p.id, 'entrada', 1, null)}
                    style={btnRound}
                    title="Sumar 1 unidad al stock"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setDetalleAbierto(detalleAbierto === p.id ? null : p.id)}
                    style={btnDetalle}
                  >
                    {detalleAbierto === p.id ? 'Cerrar' : 'Detalle'}
                  </button>
                </div>
              </div>

              {detalleAbierto === p.id && (
                <div style={detalleBox}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={detTipo} onChange={(e) => setDetTipo(e.target.value)} style={{ ...input, flex: 1 }}>
                      <option value="entrada">Entrada</option>
                      <option value="salida">Salida</option>
                    </select>
                    <input
                      type="number" min="1" value={detCantidad}
                      onChange={(e) => setDetCantidad(e.target.value)}
                      style={{ ...input, width: 90 }}
                    />
                  </div>
                  <input
                    placeholder="Motivo (opcional): compra, merma, ajuste…"
                    value={detMotivo}
                    onChange={(e) => setDetMotivo(e.target.value)}
                    style={input}
                  />
                  <button
                    onClick={() => handleGuardarDetalle(p.id)}
                    disabled={guardandoMov}
                    style={{ ...btnLima, padding: '9px 16px', width: 'auto' }}
                  >
                    {guardandoMov ? 'Guardando…' : 'Registrar movimiento'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== estilos ===================== */
const wrap = {
  minHeight: '100vh', background: '#0D3A28', display: 'grid', placeItems: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif', padding: 24, boxSizing: 'border-box',
};
const wrapPanel = {
  minHeight: '100vh', background: '#0D3A28', fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '24px 16px 60px', boxSizing: 'border-box',
};
const container = { width: '100%', maxWidth: 640, textAlign: 'center' };
const containerPanel = { width: '100%', maxWidth: 720, margin: '0 auto', textAlign: 'center' };
const card = { background: '#124A34', borderRadius: 18, padding: 40, width: 380, maxWidth: '92vw', textAlign: 'center' };

const backLink = {
  background: 'none', border: 'none', color: '#B7C7BE', fontSize: 14,
  cursor: 'pointer', marginBottom: 24, display: 'inline-block',
};
const eyebrow = { color: '#7FC9A4', fontWeight: 700, fontSize: 14, letterSpacing: '.02em' };
const h1 = { color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 4px' };
const h1Big = { color: '#fff', fontSize: 34, fontWeight: 800, margin: '6px 0 16px' };

const badge = {
  display: 'inline-block', background: 'rgba(188,224,90,.16)', color: '#BCE05A',
  fontWeight: 700, fontSize: 14, padding: '8px 18px', borderRadius: 100, marginBottom: 22,
};

const intro = { color: '#D6E3DB', fontSize: 17, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 28px' };

const featBox = {
  background: 'rgba(255,255,255,.05)', borderRadius: 16, padding: '22px 24px',
  textAlign: 'left', maxWidth: 520, margin: '0 auto 24px',
};
const featTitle = { color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 14 };
const featRow = {
  display: 'flex', gap: 10, color: '#C7D5CC', fontSize: 15,
  lineHeight: 1.5, marginBottom: 12, alignItems: 'flex-start',
};

const reassure = { color: '#8FA79A', fontSize: 14, maxWidth: 460, margin: '0 auto' };

const btn = { width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#1A6A48', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 16 };
const btnLima = { width: '100%', padding: 13, borderRadius: 10, border: 'none', background: '#BCE05A', color: '#0D3A28', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 10 };
const btnGhost = { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid rgba(255,255,255,.25)', background: 'transparent', color: '#EAF3EC', fontWeight: 700, fontSize: 15, cursor: 'pointer' };
const btnPreview = { marginTop: 20, background: 'rgba(188,224,90,.16)', color: '#BCE05A', border: '1.5px solid rgba(188,224,90,.4)', borderRadius: 10, padding: '11px 22px', fontSize: 15, fontWeight: 700, cursor: 'pointer' };

const errorBox = {
  background: 'rgba(224,114,90,.15)', color: '#E0725A', padding: '10px 16px',
  borderRadius: 10, maxWidth: 640, margin: '0 auto 16px', fontSize: 14,
};
const altaBox = {
  background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: 18,
  display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20,
};
const input = {
  padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.15)',
  background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 14, outline: 'none',
};
const productoRow = {
  background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.1)',
  borderRadius: 12, padding: '14px 16px', marginBottom: 10,
};
const btnRound = {
  minWidth: 40, height: 32, padding: '0 10px', borderRadius: 16, border: 'none',
  background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
};
const btnDetalle = {
  padding: '7px 12px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.2)',
  background: 'transparent', color: '#B7C7BE', fontSize: 13, cursor: 'pointer',
};
const detalleBox = {
  marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)',
  display: 'flex', flexDirection: 'column', gap: 8,
};
const btnImport = {
  display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: 10,
  border: '1.5px solid rgba(255,255,255,.25)', background: 'transparent', color: '#EAF3EC',
  fontWeight: 700, fontSize: 15, cursor: 'pointer',
};
const hintImport = { color: '#8FA79A', fontSize: 13, marginBottom: 16, lineHeight: 1.5 };
const resultBox = {
  background: 'rgba(127,201,164,.12)', color: '#7FC9A4', padding: '10px 16px',
  borderRadius: 10, fontSize: 14, marginBottom: 16,
};

/* --- foto / icono de producto --- */
const fotoWrap = {
  position: 'relative', width: 52, height: 52, flexShrink: 0,
};
const fotoImg = {
  width: 52, height: 52, borderRadius: 12, objectFit: 'cover',
  border: '1px solid rgba(255,255,255,.15)',
};
const fotoEmoji = {
  width: 52, height: 52, borderRadius: 12, background: 'rgba(255,255,255,.06)',
  display: 'grid', placeItems: 'center', fontSize: 26,
  border: '1px solid rgba(255,255,255,.1)',
};
const fotoBtnCam = {
  position: 'absolute', bottom: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
  background: '#1A6A48', display: 'grid', placeItems: 'center', fontSize: 11,
  cursor: 'pointer', border: '2px solid #0D3A28',
};
