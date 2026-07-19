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

// Normaliza una cabecera de columna: sin tildes, en minúsculas, sin espacios sobrantes.
// Así "Stock Mínimo", "stock_minimo", "STOCK MINIMO" se reconocen todas igual.
function normalizarCabecera(clave) {
  return clave
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/\s+/g, '_');
}

function normalizarFila(fila) {
  const out = {};
  for (const [k, v] of Object.entries(fila)) {
    out[normalizarCabecera(k)] = v;
  }
  return out;
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
  const [edMinimo, setEdMinimo] = useState('0');
  const [guardandoMinimo, setGuardandoMinimo] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [notas, setNotas] = useState([]);
  const [cargandoNotas, setCargandoNotas] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);

  const [subiendoFotoId, setSubiendoFotoId] = useState(null); // producto_id cuya foto se está subiendo

  // cantidad editable del contador rápido +/- (por producto)
  const [cantidades, setCantidades] = useState({});
  const getCantidad = (id) => cantidades[id] ?? 1;
  const setCantidad = (id, val) => setCantidades((c) => ({ ...c, [id]: val }));

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
    if (detalleAbierto === producto_id) await cargarHistorial(producto_id);
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
    setDetMotivo('');
    // La cantidad NO se resetea a 1: se mantiene el último valor usado,
    // por si sueles registrar la misma cantidad varias veces seguidas (ej. cajas de 12).
  }

  async function handleEliminarProducto(producto) {
    const confirmado = window.confirm(`¿Eliminar "${producto.nombre}" de tu inventario?\n\nNo se borrará el historial de movimientos, solo dejará de aparecer en la lista.`);
    if (!confirmado) return;

    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', producto.id);

    if (error) { setError(error.message); return; }
    await cargarProductos();
  }

  async function handleGuardarMinimo(producto_id) {
    setGuardandoMinimo(true);
    const { error } = await supabase
      .from('productos')
      .update({ stock_minimo: Number(edMinimo) || 0 })
      .eq('id', producto_id);
    setGuardandoMinimo(false);
    if (error) { setError(error.message); return; }
    await cargarProductos();
  }

  async function cargarHistorial(producto_id) {
    setCargandoHistorial(true);
    const { data, error } = await supabase
      .from('movimientos_stock')
      .select('*')
      .eq('producto_id', producto_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) setHistorial(data || []);
    setCargandoHistorial(false);
  }

  async function cargarNotas(producto_id) {
    setCargandoNotas(true);
    const { data, error } = await supabase
      .from('notas_producto')
      .select('*')
      .eq('producto_id', producto_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) setNotas(data || []);
    setCargandoNotas(false);
  }

  async function handleGuardarNota(producto_id) {
    if (!nuevaNota.trim()) return;
    setGuardandoNota(true);

    const { error } = await supabase.from('notas_producto').insert({
      producto_id,
      negocio_id: negocioId,
      nota: nuevaNota.trim(),
      creado_por: userId,
    });

    setGuardandoNota(false);
    if (error) { setError(error.message); return; }
    setNuevaNota('');
    await cargarNotas(producto_id);
  }

  async function handleEliminarNota(producto_id, nota) {
    const confirmado = window.confirm('¿Eliminar esta anotación?');
    if (!confirmado) return;

    const { error } = await supabase.from('notas_producto').delete().eq('id', nota.id);
    if (error) { setError(error.message); return; }
    await cargarNotas(producto_id);
  }

  async function handleEliminarMovimiento(producto, movimiento) {
    const confirmado = window.confirm(
      `¿Eliminar este movimiento (${movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} de ${movimiento.cantidad} ${producto.unidad})?\n\nEsto también revertirá su efecto en el stock actual del producto.`
    );
    if (!confirmado) return;

    // Primero borramos el movimiento. Si esto falla (ej. falta de permiso),
    // no tocamos el stock, para no dejar el número descuadrado.
    const { error: errDel } = await supabase
      .from('movimientos_stock')
      .delete()
      .eq('id', movimiento.id);
    if (errDel) { setError(errDel.message); return; }

    // Solo si el borrado fue bien, revertimos su efecto sobre el stock actual
    const ajuste = movimiento.tipo === 'entrada' ? -movimiento.cantidad : movimiento.cantidad;
    const nuevoStock = producto.stock_actual + ajuste;

    const { error: errStock } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoStock })
      .eq('id', producto.id);
    if (errStock) { setError(errStock.message); return; }

    await cargarProductos();
    await cargarHistorial(producto.id);
  }

  function abrirDetalle(p) {
    if (detalleAbierto === p.id) { setDetalleAbierto(null); return; }
    setDetalleAbierto(p.id);
    setEdMinimo(String(p.stock_minimo));
    cargarHistorial(p.id);
    cargarNotas(p.id);
  }

  function descargarPlantilla() {
    const datos = [
      { Nombre: 'Cerveza 33cl', Unidad: 'ud', 'Stock actual': 24, 'Stock mínimo': 6 },
      { Nombre: 'Aceite de oliva', Unidad: 'l', 'Stock actual': 5, 'Stock mínimo': 2 },
    ];
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'productos');
    XLSX.writeFile(libro, 'plantilla_stock_tgh.xlsx');
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
      const filasRaw = XLSX.utils.sheet_to_json(hoja, { defval: '' });
      const filas = filasRaw.map(normalizarFila);

      const motivoImport = `Ajuste por importación (${file.name})`;

      const existentes = await cargarProductos();

      let creados = 0, actualizados = 0, errores = 0;

      for (const fila of filas) {
        const nombre = String(fila.nombre ?? '').trim();
        if (!nombre) { errores++; continue; }

        const unidad = String(fila.unidad ?? 'ud').trim() || 'ud';
        const stockMinimo = Number(fila.stock_minimo ?? 0) || 0;
        const stockActualDeseado = Number(fila.stock_actual ?? 0) || 0;

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
            await registrarMovimiento(existente.id, 'entrada', diff, motivoImport, true);
          } else if (diff < 0) {
            await registrarMovimiento(existente.id, 'salida', Math.abs(diff), motivoImport, true);
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

        <p style={introAcciones}>
          ¿Tienes pocos productos? Añádelos uno a uno con <b>"+ Añadir producto"</b>. ¿Tienes muchos (todo tu
          almacén de golpe)? Usa la plantilla y súbela con <b>"Importar CSV / Excel"</b> — es más rápido.
        </p>

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

          <button onClick={descargarPlantilla} style={btnImport}>
            📥 Descargar plantilla
          </button>
        </div>

        <p style={hintImport}>
          Si subes un producto que ya tenías dado de alta (mismo nombre), se actualizará en vez de crear uno duplicado.
        </p>

        {resultadoImport && (
          <div style={resultBox}>
            ✅ {resultadoImport.creados} creados · 🔄 {resultadoImport.actualizados} actualizados
            {resultadoImport.errores > 0 && ` · ⚠️ ${resultadoImport.errores} filas con error`}
          </div>
        )}

        {mostrarAlta && (
          <form onSubmit={handleAltaProducto} style={altaBox}>
            <div>
              <label style={campoLabel}>Nombre del producto</label>
              <input
                placeholder="ej. Cerveza 33cl"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                style={{ ...input, width: '100%' }}
                required
              />
            </div>
            <div>
              <label style={campoLabel}>Unidad</label>
              <select value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)} style={input}>
                <option style={optionStyle} value="ud">unidades</option>
                <option style={optionStyle} value="kg">kg</option>
                <option style={optionStyle} value="g">gramos</option>
                <option style={optionStyle} value="l">litros</option>
                <option style={optionStyle} value="ml">mililitros</option>
                <option style={optionStyle} value="caja">cajas</option>
                <option style={optionStyle} value="botella">botellas</option>
                <option style={optionStyle} value="barril">barriles</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={campoLabel}>Stock inicial (cuánto tienes ahora)</label>
                <input
                  type="number"
                  min="0"
                  value={nuevoInicial}
                  onChange={(e) => setNuevoInicial(e.target.value)}
                  style={{ ...input, width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={campoLabel}>Stock mínimo (para avisarte)</label>
                <input
                  type="number"
                  min="0"
                  value={nuevoMinimo}
                  onChange={(e) => setNuevoMinimo(e.target.value)}
                  style={{ ...input, width: '100%' }}
                />
              </div>
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
            <div key={p.id} style={{ ...productoRow, borderColor: bajoMinimo ? '#E0725A' : 'rgba(255,255,255,.1)', position: 'relative' }}>
              <button
                onClick={() => handleEliminarProducto(p)}
                style={btnEliminar}
                title="Eliminar este producto"
              >
                🗑️
              </button>
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
                  <div style={stepperBox}>
                    <button
                      onClick={() => registrarMovimiento(p.id, 'salida', getCantidad(p.id), null)}
                      style={stepperBtn}
                      title={`Restar ${getCantidad(p.id)} del stock`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={getCantidad(p.id)}
                      onChange={(e) => setCantidad(p.id, e.target.value)}
                      style={stepperInput}
                    />
                    <button
                      onClick={() => registrarMovimiento(p.id, 'entrada', getCantidad(p.id), null)}
                      style={stepperBtn}
                      title={`Sumar ${getCantidad(p.id)} al stock`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => abrirDetalle(p)}
                    style={btnDetalle}
                  >
                    {detalleAbierto === p.id ? 'Cerrar' : 'Detalle'}
                  </button>
                </div>
              </div>

              {detalleAbierto === p.id && (
                <div style={detalleBox}>
                  <div>
                    <label style={campoLabel}>Stock mínimo (aviso de reposición)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number" min="0" value={edMinimo}
                        onChange={(e) => setEdMinimo(e.target.value)}
                        style={{ ...input, width: 90 }}
                      />
                      <button
                        onClick={() => handleGuardarMinimo(p.id)}
                        disabled={guardandoMinimo}
                        style={{ ...btnDetalle, padding: '9px 16px', width: 'auto' }}
                      >
                        {guardandoMinimo ? 'Guardando…' : 'Guardar mínimo'}
                      </button>
                    </div>
                  </div>

                  <div style={separadorDetalle} />

                  <label style={campoLabel}>Registrar movimiento (cambia el stock actual)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={detTipo} onChange={(e) => setDetTipo(e.target.value)} style={{ ...input, flex: 1 }}>
                      <option style={optionStyle} value="entrada">Entrada</option>
                      <option style={optionStyle} value="salida">Salida</option>
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

                  <div style={separadorDetalle} />

                  <label style={campoLabel}>Anotación (no afecta al stock)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder='Ej. "Faltan dos cajas, pendiente de revisar con el proveedor"'
                      value={nuevaNota}
                      onChange={(e) => setNuevaNota(e.target.value)}
                      style={{ ...input, flex: 1 }}
                    />
                    <button
                      onClick={() => handleGuardarNota(p.id)}
                      disabled={guardandoNota}
                      style={{ ...btnDetalle, padding: '9px 16px', width: 'auto' }}
                    >
                      {guardandoNota ? 'Guardando…' : 'Guardar nota'}
                    </button>
                  </div>

                  {cargandoNotas && (
                    <p style={{ color: '#8FA79A', fontSize: 13 }}>Cargando anotaciones…</p>
                  )}
                  {!cargandoNotas && notas.length > 0 && (
                    <div style={historialLista}>
                      {notas.map((n) => (
                        <div key={n.id} style={notaFila}>
                          <span style={notaTexto}>{n.nota}</span>
                          <span style={historialFecha}>
                            {new Date(n.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => handleEliminarNota(p.id, n)}
                            style={btnEliminarMov}
                            title="Eliminar esta anotación"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={separadorDetalle} />

                  <label style={campoLabel}>Historial de movimientos</label>
                  {cargandoHistorial && (
                    <p style={{ color: '#8FA79A', fontSize: 13 }}>Cargando historial…</p>
                  )}
                  {!cargandoHistorial && historial.length === 0 && (
                    <p style={{ color: '#8FA79A', fontSize: 13 }}>Aún no hay movimientos registrados para este producto.</p>
                  )}
                  {!cargandoHistorial && historial.length > 0 && (
                    <div style={historialLista}>
                      {historial.map((m) => (
                        <div key={m.id} style={historialFila}>
                          <span style={{ ...historialTipo, color: m.tipo === 'entrada' ? '#7FC9A4' : '#E0725A' }}>
                            {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Salida'}
                          </span>
                          <span style={historialCantidad}>{m.cantidad} {p.unidad}</span>
                          <span style={historialMotivo}>{m.motivo || '—'}</span>
                          <span style={historialFecha}>
                            {new Date(m.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => handleEliminarMovimiento(p, m)}
                            style={btnEliminarMov}
                            title="Eliminar este movimiento (revierte el stock)"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
// El menú desplegable de <select> usa fondo blanco del sistema operativo (no hereda el tema oscuro),
// así que el texto de las opciones debe ser oscuro para que se lea.
const optionStyle = { color: '#15271C', background: '#fff' };
const campoLabel = {
  display: 'block', color: '#8FA79A', fontSize: 12, fontWeight: 600, marginBottom: 5,
};
const separadorDetalle = {
  height: 1, background: 'rgba(255,255,255,.08)', margin: '4px 0',
};
const historialLista = {
  display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto',
};
const historialFila = {
  display: 'grid', gridTemplateColumns: '80px 60px 1fr auto auto', gap: 10, alignItems: 'center',
  background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5,
};
const historialTipo = { fontWeight: 700, whiteSpace: 'nowrap' };
const historialCantidad = { color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' };
const historialMotivo = { color: '#B7C7BE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const historialFecha = { color: '#8FA79A', whiteSpace: 'nowrap', fontSize: 11.5 };
const btnEliminarMov = {
  width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(224,114,90,.15)',
  color: '#E0725A', fontSize: 11, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0,
};
const notaFila = {
  display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center',
  background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5,
};
const notaTexto = { color: '#EAF3EC' };
const productoRow = {
  background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.1)',
  borderRadius: 12, padding: '16px 40px 16px 16px', marginBottom: 10,
};
const btnEliminar = {
  position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 8,
  border: 'none', background: 'rgba(224,114,90,.15)', color: '#E0725A', fontSize: 13,
  cursor: 'pointer', display: 'grid', placeItems: 'center', opacity: 0.8,
};
const btnRound = {
  minWidth: 40, height: 32, padding: '0 10px', borderRadius: 16, border: 'none',
  background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
};
const stepperBox = {
  display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,.08)',
  borderRadius: 20, border: '1px solid rgba(255,255,255,.15)', overflow: 'hidden',
};
const stepperBtn = {
  width: 30, height: 32, border: 'none', background: 'transparent', color: '#fff',
  fontSize: 18, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
};
const stepperInput = {
  width: 64, height: 32, border: 'none', borderLeft: '1px solid rgba(255,255,255,.15)',
  borderRight: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: '#fff',
  fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none', MozAppearance: 'textfield',
  padding: '0 4px',
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
const introAcciones = { color: '#C7D5CC', fontSize: 14, marginBottom: 14, lineHeight: 1.5 };
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
