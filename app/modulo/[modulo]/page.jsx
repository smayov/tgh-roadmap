'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  const [negocioNombre, setNegocioNombre] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/acceso'); return; }
      setUserId(user.id);

      const { data: negocio } = await supabase
        .from('negocios')
        .select('id, nombre')
        .eq('propietario', user.id)
        .maybeSingle();

      if (!negocio) { router.replace('/catalogo'); return; }
      setNegocioId(negocio.id);
      setNegocioNombre(negocio.nombre || '');

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
          <PanelStock negocioId={negocioId} negocioNombre={negocioNombre} userId={userId} info={info} />
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
  { keywords: ['manzana'], emoji: '🍏' },
  { keywords: ['naranja'], emoji: '🍊' },
  { keywords: ['platano', 'plátano'], emoji: '🍌' },
  { keywords: ['fruta'], emoji: '🍓' },
  { keywords: ['limon', 'limón'], emoji: '🍋' },
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
function PanelStock({ negocioId, negocioNombre, userId, info }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('ud');
  const [nuevoMinimo, setNuevoMinimo] = useState('0');
  const [nuevoInicial, setNuevoInicial] = useState('0');
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [guardandoAlta, setGuardandoAlta] = useState(false);

  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [detTipo, setDetTipo] = useState('entrada');
  const [detCantidad, setDetCantidad] = useState('1');
  const [detMotivo, setDetMotivo] = useState('');
  const [guardandoMov, setGuardandoMov] = useState(false);
  const [edMinimo, setEdMinimo] = useState('0');
  const [edCosto, setEdCosto] = useState('');
  const [guardandoCosto, setGuardandoCosto] = useState(false);
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
  const [pestana, setPestana] = useState('inventario'); // 'inventario' | 'informes'

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
      costo_unitario: nuevoCosto === '' ? null : Number(nuevoCosto),
    });

    setGuardandoAlta(false);
    if (error) { setError(error.message); return; }

    setNuevoNombre('');
    setNuevaUnidad('ud');
    setNuevoMinimo('0');
    setNuevoInicial('0');
    setNuevoCosto('');
    setMostrarAlta(false);
    await cargarProductos();
  }

  async function handleGuardarDetalle(producto_id) {
    setGuardandoMov(true);
    await registrarMovimiento(producto_id, detTipo, detCantidad, detMotivo);
    setGuardandoMov(false);
    setDetMotivo('');
    // El panel de Detalle se queda abierto (no se cierra solo) para que veas
    // el movimiento reflejado al instante en el historial de abajo.
    // La cantidad tampoco se resetea a 1: se mantiene el último valor usado.
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

  async function handleGuardarCosto(producto_id) {
    setGuardandoCosto(true);
    const { error } = await supabase
      .from('productos')
      .update({ costo_unitario: edCosto === '' ? null : Number(edCosto) })
      .eq('id', producto_id);
    setGuardandoCosto(false);
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
    setEdCosto(p.costo_unitario != null ? String(p.costo_unitario) : '');
    cargarHistorial(p.id);
    cargarNotas(p.id);
  }

  function descargarPlantilla() {
    const datos = [
      { Nombre: 'Cerveza 33cl', Unidad: 'ud', 'Stock actual': 24, 'Stock mínimo': 6, 'Precio de coste': 0.85 },
      { Nombre: 'Aceite de oliva', Unidad: 'l', 'Stock actual': 5, 'Stock mínimo': 2, 'Precio de coste': 3.20 },
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
      const detalleCreados = [];
      const detalleActualizados = [];
      const detalleErrores = [];

      for (const fila of filas) {
        const nombre = String(fila.nombre ?? '').trim();
        if (!nombre) { errores++; detalleErrores.push('Una fila sin nombre de producto'); continue; }

        const unidad = String(fila.unidad ?? 'ud').trim() || 'ud';
        const stockMinimo = Number(fila.stock_minimo ?? 0) || 0;
        const stockActualDeseado = Number(fila.stock_actual ?? 0) || 0;

        // Coste: aceptamos varios nombres de columna posibles
        const costoRaw = fila.costo_unitario ?? fila.costo ?? fila.coste ??
          fila.precio_de_coste ?? fila.precio_coste ?? '';
        const tieneCosto = String(costoRaw).trim() !== '';
        const costoUnitario = tieneCosto ? Number(costoRaw) : null;

        const existente = existentes.find(
          (p) => p.nombre.trim().toLowerCase() === nombre.toLowerCase()
        );

        if (existente) {
          const cambiosUpdate = { unidad, stock_minimo: stockMinimo };
          if (tieneCosto) cambiosUpdate.costo_unitario = costoUnitario;

          const { error: errUpd } = await supabase
            .from('productos')
            .update(cambiosUpdate)
            .eq('id', existente.id);

          if (errUpd) { errores++; detalleErrores.push(`${nombre}: ${errUpd.message}`); continue; }

          const diff = stockActualDeseado - existente.stock_actual;
          if (diff > 0) {
            await registrarMovimiento(existente.id, 'entrada', diff, motivoImport, true);
          } else if (diff < 0) {
            await registrarMovimiento(existente.id, 'salida', Math.abs(diff), motivoImport, true);
          }
          actualizados++;
          detalleActualizados.push({
            nombre, unidad,
            antes: existente.stock_actual,
            despues: stockActualDeseado,
            diff,
          });
        } else {
          const { error: errIns } = await supabase.from('productos').insert({
            negocio_id: negocioId,
            nombre,
            unidad,
            stock_minimo: stockMinimo,
            stock_actual: stockActualDeseado,
            costo_unitario: costoUnitario,
          });
          if (errIns) { errores++; detalleErrores.push(`${nombre}: ${errIns.message}`); continue; }
          creados++;
          detalleCreados.push({ nombre, unidad, stock: stockActualDeseado });
        }
      }

      setResultadoImport({ creados, actualizados, errores, detalleCreados, detalleActualizados, detalleErrores });
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

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={tabsWrap}>
          <button
            onClick={() => setPestana('inventario')}
            style={{ ...tabBtn, ...(pestana === 'inventario' ? tabBtnActivo : {}) }}
          >
            📋 Inventario
          </button>
          <button
            onClick={() => setPestana('informes')}
            style={{ ...tabBtn, ...(pestana === 'informes' ? tabBtnActivo : {}) }}
          >
            📊 Informes
          </button>
        </div>
      </div>

      {pestana === 'informes' ? (
        <Informes negocioId={negocioId} negocioNombre={negocioNombre} productos={productos} />
      ) : (
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
          La plantilla incluye una columna de "Precio de coste" opcional, para cargar tus precios de golpe.
        </p>

        {resultadoImport && (
          <div style={resultBox}>
            <div style={{ marginBottom: resultadoImport.detalleCreados.length || resultadoImport.detalleActualizados.length ? 10 : 0 }}>
              ✅ {resultadoImport.creados} creados · 🔄 {resultadoImport.actualizados} actualizados
              {resultadoImport.errores > 0 && ` · ⚠️ ${resultadoImport.errores} filas con error`}
            </div>

            {resultadoImport.detalleCreados.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {resultadoImport.detalleCreados.map((d, i) => (
                  <div key={i} style={importDetalleFila}>
                    <span style={{ color: '#7FC9A4' }}>+ nuevo</span> {d.nombre} — {d.stock} {d.unidad}
                  </div>
                ))}
              </div>
            )}

            {resultadoImport.detalleActualizados.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {resultadoImport.detalleActualizados.map((d, i) => (
                  <div key={i} style={importDetalleFila}>
                    <span style={{ color: d.diff > 0 ? '#7FC9A4' : d.diff < 0 ? '#E0A92A' : '#8FA79A' }}>
                      {d.diff > 0 ? '↑' : d.diff < 0 ? '↓' : '='}
                    </span>{' '}
                    {d.nombre} — {d.antes} → {d.despues} {d.unidad}
                    {d.diff !== 0 && ` (${d.diff > 0 ? '+' : ''}${d.diff})`}
                  </div>
                ))}
              </div>
            )}

            {resultadoImport.detalleErrores.length > 0 && (
              <div>
                {resultadoImport.detalleErrores.map((msg, i) => (
                  <div key={i} style={{ ...importDetalleFila, color: '#E0725A' }}>⚠️ {msg}</div>
                ))}
              </div>
            )}
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
            <div>
              <label style={campoLabel}>Precio de coste por unidad (€)</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ej. 0.85"
                  value={nuevoCosto}
                  onChange={(e) => setNuevoCosto(e.target.value)}
                  style={{ ...input, width: 100, flexShrink: 0 }}
                />
                <span style={costoHint}>
                  Opcional — puedes dejarlo en blanco ahora y añadirlo más adelante cuando te llegue la factura del proveedor.
                </span>
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

                  <div>
                    <label style={campoLabel}>Precio de coste por unidad (€)</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number" min="0" step="0.01" value={edCosto}
                        placeholder="ej. 0.85"
                        onChange={(e) => setEdCosto(e.target.value)}
                        style={{ ...input, width: 90 }}
                      />
                      <button
                        onClick={() => handleGuardarCosto(p.id)}
                        disabled={guardandoCosto}
                        style={{ ...btnDetalle, padding: '9px 16px', width: 'auto' }}
                      >
                        {guardandoCosto ? 'Guardando…' : 'Guardar precio'}
                      </button>
                      <span style={costoHint}>
                        Opcional — puedes ponerlo cuando te llegue la factura del proveedor.
                      </span>
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
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

/* ============================================================
   INFORMES — vista de solo lectura con los indicadores del inventario
   ============================================================ */
function Informes({ negocioId, negocioNombre, productos }) {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [periodo, setPeriodo] = useState(30); // días

  useEffect(() => {
    (async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from('movimientos_stock')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (!error) setMovimientos(data || []);
      setCargando(false);
    })();
  }, [negocioId]);

  if (cargando) {
    return <p style={{ color: '#B7C7BE', textAlign: 'center' }}>Cargando informes…</p>;
  }

  const cutoff = Date.now() - periodo * 24 * 60 * 60 * 1000;

  // 1. Productos bajo mínimo
  const bajoMinimo = productos.filter((p) => p.stock_actual <= p.stock_minimo);

  // 2. Entradas vs salidas en el periodo
  const movsPeriodo = movimientos.filter((m) => new Date(m.created_at).getTime() >= cutoff);
  const totalEntradas = movsPeriodo.filter((m) => m.tipo === 'entrada').reduce((t, m) => t + Number(m.cantidad), 0);
  const totalSalidas = movsPeriodo.filter((m) => m.tipo === 'salida').reduce((t, m) => t + Number(m.cantidad), 0);

  // 3. Última fecha de movimiento por producto → detectar inactividad
  const ultimaFechaPorProducto = {};
  movimientos.forEach((m) => {
    const actual = ultimaFechaPorProducto[m.producto_id];
    if (!actual || new Date(m.created_at) > new Date(actual)) {
      ultimaFechaPorProducto[m.producto_id] = m.created_at;
    }
  });
  const sinMovimiento = productos.filter((p) => {
    const ultima = ultimaFechaPorProducto[p.id];
    if (!ultima) return true;
    return new Date(ultima).getTime() < cutoff;
  });

  // 4. Valor total del inventario (solo productos con precio de coste puesto)
  const productosConCosto = productos.filter((p) => p.costo_unitario != null);
  const valorTotal = productosConCosto.reduce((t, p) => t + p.stock_actual * p.costo_unitario, 0);

  // 5. Historial de importaciones (derivado de los motivos "Ajuste por importación (archivo)")
  const importaciones = {};
  movimientos.forEach((m) => {
    const match = m.motivo && m.motivo.match(/^Ajuste por importación \((.+)\)$/);
    if (match) {
      const archivo = match[1];
      if (!importaciones[archivo]) importaciones[archivo] = { archivo, movimientos: 0, ultima: m.created_at };
      importaciones[archivo].movimientos++;
      if (new Date(m.created_at) > new Date(importaciones[archivo].ultima)) {
        importaciones[archivo].ultima = m.created_at;
      }
    }
  });
  const listaImportaciones = Object.values(importaciones).sort(
    (a, b) => new Date(b.ultima) - new Date(a.ultima)
  );

  // 6. Candidatos a dejar de comprar: productos con stock pero SIN ninguna
  //    salida en el periodo (no se han vendido/consumido), ordenados por
  //    cuánto capital tienes parado en ellos.
  const salidasPorProducto = {};
  movsPeriodo.forEach((m) => {
    if (m.tipo === 'salida') {
      salidasPorProducto[m.producto_id] = (salidasPorProducto[m.producto_id] || 0) + Number(m.cantidad);
    }
  });
  const candidatosDejarDeComprar = productos
    .filter((p) => p.stock_actual > 0 && !salidasPorProducto[p.id])
    .map((p) => ({
      ...p,
      capitalInmovilizado: p.costo_unitario != null ? p.stock_actual * p.costo_unitario : null,
    }))
    .sort((a, b) => (b.capitalInmovilizado ?? -1) - (a.capitalInmovilizado ?? -1));

  // 7. Mermas y pérdidas: salidas cuyo motivo indica rotura, caducidad, merma...
  const PALABRAS_MERMA = ['merma', 'rotura', 'roto', 'caduc', 'perdid', 'estropead', 'desperdici'];
  function esMerma(motivo) {
    if (!motivo) return false;
    const m = motivo.toLowerCase();
    return PALABRAS_MERMA.some((k) => m.includes(k));
  }
  const mermasPorProducto = {};
  movsPeriodo.forEach((m) => {
    if (m.tipo === 'salida' && esMerma(m.motivo)) {
      if (!mermasPorProducto[m.producto_id]) mermasPorProducto[m.producto_id] = 0;
      mermasPorProducto[m.producto_id] += Number(m.cantidad);
    }
  });
  const listaMermas = Object.entries(mermasPorProducto)
    .map(([producto_id, cantidad]) => {
      const p = productos.find((pp) => pp.id === producto_id);
      if (!p) return null;
      const valor = p.costo_unitario != null ? cantidad * p.costo_unitario : null;
      return { nombre: p.nombre, unidad: p.unidad, cantidad, valor };
    })
    .filter(Boolean)
    .sort((a, b) => (b.valor ?? b.cantidad) - (a.valor ?? a.cantidad));
  const valorTotalMermas = listaMermas.reduce((t, m) => t + (m.valor || 0), 0);

  async function cargarImagenBase64(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function descargarInformePDF() {
    const doc = new jsPDF();
    const VERDE = [13, 58, 40];   // #0D3A28

    // --- Cabecera con membrete ---
    doc.setFillColor(...VERDE);
    doc.rect(0, 0, 210, 32, 'F');

    // Logo real (public/logo-tgh.png). Si falla la carga, seguimos sin logo, sin romper el PDF.
    try {
      const logoBase64 = await cargarImagenBase64('/logo-tgh.png');
      doc.addImage(logoBase64, 'PNG', 14, 6, 20, 20);
    } catch (e) {
      // sin logo, no pasa nada
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Tu Gestor Hostelero', 39, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Informe de Cierre de Inventario · Módulo de Stock', 39, 22);

    // --- Datos del negocio y fecha ---
    doc.setTextColor(20, 39, 28);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(negocioNombre || 'Tu negocio', 14, 44);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Fecha del informe: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 50);

    // --- Tabla de inventario ---
    const filas = productos.map((p) => [
      p.nombre,
      p.unidad,
      String(p.stock_actual),
      p.costo_unitario != null ? `${Number(p.costo_unitario).toFixed(2)} €` : '—',
      p.costo_unitario != null ? `${(p.stock_actual * p.costo_unitario).toFixed(2)} €` : '—',
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['Producto', 'Unidad', 'Stock actual', 'Coste / ud', 'Valor total']],
      body: filas,
      headStyles: { fillColor: VERDE, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [243, 241, 231] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });

    // --- Totales ---
    const finalY = doc.lastAutoTable.finalY || 60;
    doc.setDrawColor(...VERDE);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 6, 196, finalY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...VERDE);
    doc.text(`Valor total del inventario: ${valorTotal.toFixed(2)} €`, 14, finalY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 100, 95);
    doc.text(
      `${productosConCosto.length} de ${productos.length} productos con precio de coste registrado.`,
      14, finalY + 20
    );

    // --- Pie de página ---
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 145);
    doc.text('Generado automáticamente por Tu Gestor Hostelero — tugestorhostelero.es', 14, 287);

    const fechaArchivo = new Date().toISOString().slice(0, 10);
    const nombreSeguro = (negocioNombre || 'negocio').replace(/[^a-z0-9]+/gi, '_');
    doc.save(`inventario_${nombreSeguro}_${fechaArchivo}.pdf`);
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'left' }}>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setPeriodo(d)}
            style={{ ...btnDetalle, ...(periodo === d ? tabBtnActivo : {}) }}
          >
            {d} días
          </button>
        ))}
      </div>

      {/* Valor del inventario */}
      <div style={informeCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={informeTitulo}>💶 Valor del inventario</div>
          <button onClick={descargarInformePDF} style={btnPdf} title="Descargar informe de cierre en PDF">
            🖨️ Descargar PDF
          </button>
        </div>
        {productosConCosto.length === 0 ? (
          <p style={informeVacio}>Aún no has puesto precio de coste a ningún producto (edítalo desde "Detalle").</p>
        ) : (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{valorTotal.toFixed(2)} €</div>
            <p style={{ color: '#8FA79A', fontSize: 13, marginTop: 4 }}>
              {productosConCosto.length} de {productos.length} productos con precio puesto
            </p>
          </>
        )}
      </div>

      {/* Bajo mínimo */}
      <div style={informeCard}>
        <div style={informeTitulo}>🔴 Por debajo del mínimo ({bajoMinimo.length})</div>
        {bajoMinimo.length === 0 ? (
          <p style={informeVacio}>Ningún producto está bajo mínimos ahora mismo. 👍</p>
        ) : bajoMinimo.map((p) => (
          <div key={p.id} style={informeFila}>
            <span>{p.nombre}</span>
            <span style={{ color: '#E0725A' }}>{p.stock_actual} / mín. {p.stock_minimo} {p.unidad}</span>
          </div>
        ))}
      </div>

      {/* Entradas vs salidas */}
      <div style={informeCard}>
        <div style={informeTitulo}>📊 Movimientos en los últimos {periodo} días</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <span style={{ color: '#7FC9A4', fontWeight: 700, fontSize: 22 }}>↑ {totalEntradas}</span>
            <div style={{ color: '#8FA79A', fontSize: 12 }}>entradas</div>
          </div>
          <div>
            <span style={{ color: '#E0725A', fontWeight: 700, fontSize: 22 }}>↓ {totalSalidas}</span>
            <div style={{ color: '#8FA79A', fontSize: 12 }}>salidas</div>
          </div>
        </div>
      </div>

      {/* Sin movimiento reciente */}
      <div style={informeCard}>
        <div style={informeTitulo}>💤 Sin movimiento en {periodo} días ({sinMovimiento.length})</div>
        {sinMovimiento.length === 0 ? (
          <p style={informeVacio}>Todos tus productos han tenido actividad reciente.</p>
        ) : sinMovimiento.map((p) => (
          <div key={p.id} style={informeFila}>
            <span>{p.nombre}</span>
            <span style={{ color: '#8FA79A' }}>
              {ultimaFechaPorProducto[p.id]
                ? 'último: ' + new Date(ultimaFechaPorProducto[p.id]).toLocaleDateString('es-ES')
                : 'nunca'}
            </span>
          </div>
        ))}
      </div>

      {/* Candidatos a dejar de comprar */}
      <div style={informeCard}>
        <div style={informeTitulo}>🐌 Candidatos a dejar de comprar ({candidatosDejarDeComprar.length})</div>
        <p style={{ ...informeVacio, marginBottom: candidatosDejarDeComprar.length ? 10 : 0 }}>
          Productos con stock que no han tenido ninguna salida en los últimos {periodo} días.
        </p>
        {candidatosDejarDeComprar.length === 0 ? (
          <p style={informeVacio}>Todo tu inventario se está consumiendo con normalidad. 👍</p>
        ) : candidatosDejarDeComprar.map((p) => (
          <div key={p.id} style={informeFila}>
            <span>{p.nombre}</span>
            <span style={{ color: '#E0A92A' }}>
              {p.stock_actual} {p.unidad} parados
              {p.capitalInmovilizado != null && ` · ${p.capitalInmovilizado.toFixed(2)} € inmovilizados`}
            </span>
          </div>
        ))}
      </div>

      {/* Mermas y pérdidas */}
      <div style={informeCard}>
        <div style={informeTitulo}>🗑️ Mermas y pérdidas en {periodo} días</div>
        {listaMermas.length === 0 ? (
          <div style={informeVacio}>
            <p style={{ marginBottom: 6 }}>No se ha detectado ninguna merma en este periodo.</p>
            <p style={{ fontSize: 12, color: '#5C6B61' }}>
              Esto solo incluye salidas cuyo motivo mencione palabras como "merma", "rotura" o "caducado".
              Si tuviste alguna pérdida pero no la escribiste así, no aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            {valorTotalMermas > 0 && (
              <div style={{ fontSize: 20, fontWeight: 800, color: '#E0725A', marginBottom: 10 }}>
                {valorTotalMermas.toFixed(2)} € perdidos
              </div>
            )}
            {listaMermas.map((m, i) => (
              <div key={i} style={informeFila}>
                <span>{m.nombre}</span>
                <span style={{ color: '#E0725A' }}>
                  {m.cantidad} {m.unidad}
                  {m.valor != null && ` · ${m.valor.toFixed(2)} €`}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Historial de importaciones */}
      <div style={informeCard}>
        <div style={informeTitulo}>📥 Historial de importaciones</div>
        {listaImportaciones.length === 0 ? (
          <p style={informeVacio}>Aún no has importado ningún archivo.</p>
        ) : listaImportaciones.map((imp, i) => (
          <div key={i} style={informeFila}>
            <span>{imp.archivo}</span>
            <span style={{ color: '#8FA79A' }}>
              {imp.movimientos} ajuste(s) · {new Date(imp.ultima).toLocaleDateString('es-ES')}
            </span>
          </div>
        ))}
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
const costoHint = {
  color: '#8FA79A', fontSize: 12.5, lineHeight: 1.4,
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

/* --- pestañas Inventario / Informes --- */
const tabsWrap = {
  display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,.1)', paddingBottom: 4,
};
const tabBtn = {
  padding: '9px 16px', borderRadius: '10px 10px 0 0', border: 'none', background: 'transparent',
  color: '#8FA79A', fontSize: 14, fontWeight: 700, cursor: 'pointer',
};
const tabBtnActivo = {
  background: '#BCE05A', color: '#0D3A28',
};

/* --- tarjetas de informes --- */
const informeCard = {
  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 14, padding: '18px 20px', marginBottom: 14,
};
const informeTitulo = {
  color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 12,
};
const informeFila = {
  display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5,
  color: '#EAF3EC', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)',
};
const informeVacio = {
  color: '#8FA79A', fontSize: 13.5,
};
const btnPdf = {
  flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: 'none',
  background: '#BCE05A', color: '#0D3A28', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
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
const importDetalleFila = {
  color: '#C7D5CC', fontSize: 13, padding: '3px 0',
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
