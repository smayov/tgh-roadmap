'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { crearCheckout } from './checkout';
import { supabase } from '../supabaseClient';

/* ============================================================
   EDITA AQUI DATOS Y PRECIOS (EUROS)
   FOTOS: campo "img" de cada módulo. Hero: ver HeroPhoto abajo.
   ============================================================ */
const ANUAL_FACTOR = 10; // meses cobrados al año (12 - 2 gratis)
const DESCUENTO_PACK = 0.25; // 25% de descuento al elegir TODOS los módulos del pack. Cambia aquí el %.

// Módulos que cuentan para el descuento de "suite completa".
// Los que NO estén aquí (ej. 'stock') se cobran siempre aparte, a precio base.
// ⚠️ Debe COINCIDIR con MODULOS_PACK de checkout.js. Si cambias uno, cambia el otro.
const MODULOS_PACK_IDS = ['verifactu', 'facturacion', 'clientes', 'empleados', 'alertas'];

const MODULOS = [
  {
    id: 'verifactu', icono: '🧾', iconClass: 'fiscal', tag: 'Módulo base',
    img: 'https://images.pexels.com/photos/6927334/pexels-photo-6927334.jpeg?auto=compress&cs=tinysrgb&w=800',
    titulo: 'VeriFactu — Cumplimiento Fiscal',
    desc: 'Mantén tu restaurante legalmente protegido. Integración con la AEAT, encadenamiento SHA-256 y QR en cada ticket según el RD 1007/2023.',
    feats: ['Integración AEAT', 'Firma y hash SHA-256', 'QR por ticket', 'Importación TPV (CSV)'],
    precioMes: 27,
    detalle: {
      demo: 'ticket',
      ext: 'Cada ticket se firma y se encadena con el anterior mediante un hash SHA-256, generando una huella inalterable y un QR verificable por la AEAT. Cumples con la normativa antifraude sin cambiar tu forma de trabajar.',
      benes: ['Tickets legalmente verificables ante inspección', 'Encadenamiento inalterable de toda la facturación', 'Importación automática desde tu TPV vía CSV', 'Preparado para el vencimiento de la normativa en 2027'],
    },
  },
  {
    id: 'facturacion', icono: '📄', iconClass: 'fiscal', tag: 'Ampliación', tagClass: 'addon', requiere: 'verifactu',
    img: 'https://images.pexels.com/photos/6694535/pexels-photo-6694535.jpeg?auto=compress&cs=tinysrgb&w=800',
    titulo: 'Facturación Pro',
    desc: 'Ampliación de VeriFactu (requiere el módulo base). Presupuestos, proformas, anticipos para eventos y conversión en un clic a factura legal.',
    feats: ['Presupuestos y proformas', 'Anticipos / señales', 'Conversión en 1 clic', 'Requiere VeriFactu'],
    precioMes: 37,
    detalle: {
      demo: 'factura',
      ext: 'Crea estimados, presupuestos y proformas (sin valor fiscal, editables) y conviértelos en factura legal en un clic, reaprovechando todos los datos. Ideal para catering, eventos, bodas y clientes de empresa. La factura solo se vuelve fiscal (número, QR y registro AEAT) al confirmarla.',
      benes: ['Presupuestos y proformas con tu marca, sin valor fiscal hasta confirmar', 'Factura de anticipo para cobrar la señal de un evento', 'Conversión presupuesto → factura sin volver a teclear nada', 'Seguimiento del estado: enviado, aceptado, facturado'],
    },
  },
  {
    id: 'clientes', icono: '👥', iconClass: 'crm', tag: 'Módulo',
    img: 'https://images.pexels.com/photos/6684786/pexels-photo-6684786.jpeg?auto=compress&cs=tinysrgb&w=800',
    titulo: 'Gestión de Clientes',
    desc: 'CRM pensado para hostelería: fichas de cliente, historial de consumo, reservas, fidelización y campañas de marketing segmentadas.',
    feats: ['Fichas y historial', 'Reservas', 'Fidelización', 'Campañas / marketing'],
    precioMes: 24,
    detalle: {
      demo: 'fidelidad',
      ext: 'Conoce a tus clientes: qué consumen, cada cuánto vuelven y qué les gusta. Crea programas de fidelización automáticos y campañas segmentadas que aumentan la repetición de visita.',
      benes: ['Ficha completa con historial de consumo', 'Programa de puntos y recompensas automático', 'Reservas integradas con la operativa', 'Campañas por segmento (cumpleaños, inactivos, VIP)'],
    },
  },
  {
    id: 'stock', icono: '📦', iconClass: 'stock', tag: 'Módulo',
    img: 'https://images.pexels.com/photos/4483773/pexels-photo-4483773.jpeg?auto=compress&cs=tinysrgb&w=800',
    titulo: 'Control de Stock',
    desc: 'Controla tu almacén sin complicaciones: altas y bajas de producto, alertas de stock mínimo y visibilidad de lo que tienes en cada momento.',
    feats: ['Altas y bajas manuales', 'Alertas de stock mínimo', 'Inventario por producto', 'Historial de movimientos'],
    precioMes: 22,
    detalle: {
      demo: 'stock',
      ext: 'Registra entradas y salidas de producto de forma manual y ten siempre a mano cuánto te queda de cada referencia. El sistema te avisa cuando un producto baja de su umbral mínimo, para que nunca te quedes sin stock en el momento crítico.',
      benes: ['Visibilidad en tiempo real de existencias por producto', 'Alertas automáticas de stock mínimo', 'Historial de movimientos (entradas/salidas) por fecha', 'Base lista para escalar a pedidos automáticos o consumo por receta más adelante'],
    },
  },
  {
    id: 'empleados', icono: '🕒', iconClass: 'emp', tag: 'Módulo',
    img: 'https://images.pexels.com/photos/30120987/pexels-photo-30120987.jpeg?auto=compress&cs=tinysrgb&w=800',
    titulo: 'Gestión de Empleados',
    desc: 'Cumple con el registro de jornada obligatorio y gestiona a tu equipo desde un solo sitio: fichajes, turnos, ausencias y control de horas.',
    feats: ['Fichajes / registro de jornada', 'Turnos y cuadrantes', 'Vacaciones y ausencias', 'Control de horas'],
    precioMes: 31,
    detalle: {
      demo: 'fichaje',
      ext: 'El registro de jornada es obligatorio en España. Tu equipo ficha entrada y salida desde el móvil o el TPV, y tú tienes el control de horas, turnos y ausencias al día, listo ante cualquier inspección.',
      benes: ['Cumples el registro de jornada legal', 'Fichaje rápido desde móvil o TPV', 'Cuadrantes de turnos y control de ausencias', 'Informe de horas trabajadas por empleado'],
    },
  },
  {
    id: 'alertas', icono: '🌦️', iconClass: 'alert', tag: 'Add-on', tagClass: 'addon',
    img: 'https://images.pexels.com/photos/1539116/pexels-photo-1539116.jpeg?auto=compress&cs=tinysrgb&w=800',
    titulo: 'Alertas que afectan a tu negocio',
    desc: 'Avisos en tiempo real de factores externos que impactan tu afluencia y operativa: clima, obras en la zona, cortes de calle y eventos cercanos.',
    feats: ['Clima (lluvia, calor, temporal)', 'Obras y cortes de calle', 'Eventos en la zona', 'Avisos automáticos'],
    precioMes: 10,
    detalle: {
      demo: 'alertas',
      ext: 'Anticípate a lo que pasa fuera de tu local. Recibe avisos automáticos cuando el clima, unas obras o un evento cercano van a cambiar tu afluencia, para que ajustes personal, stock y promociones a tiempo.',
      benes: ['Previsión de caídas de afluencia por clima', 'Aviso de obras o cortes que afectan el acceso', 'Detección de eventos que traen clientes', 'Recomendaciones para ajustar personal y stock'],
    },
  },
];

const ALERTAS_POOL = [
  { c: 'al-obra', t: '🚧 Obras en la calle contigua durante 2 semanas · acceso reducido' },
  { c: 'al-event', t: '🎶 Concierto a 300 m el sábado · pico de afluencia previsto ↑' },
  { c: 'al-heat', t: '🔥 Ola de calor (38°) · refuerza terraza y bebidas frías' },
  { c: 'al-rain', t: '🌧️ Tormenta esta tarde · prepara recogida de terraza' },
  { c: 'al-event', t: '⚽ Partido en el bar de enfrente · clientes de paso ↑' },
];

const fmt = (n) => new Intl.NumberFormat('es-ES').format(n);
const priceFor = (m, cycle) => (cycle === 'month' ? m.precioMes : m.precioMes * ANUAL_FACTOR);

/* ---------- Foto con respaldo si falla la carga ---------- */
function Photo({ m }) {
  const [err, setErr] = useState(false);
  return (
    <div className={'m-photo' + (err || !m.img ? ' noimg' : '')} data-emoji={m.icono}>
      {!err && m.img && (
        <img src={m.img} alt={m.titulo} loading="lazy" onError={() => setErr(true)} />
      )}
      <span className={'m-badge ' + (m.tagClass || '')}>{m.tag}</span>
    </div>
  );
}

function HeroPhoto() {
  const [err, setErr] = useState(false);
  if (err) return null; // se ve el degradado de fondo de .hero-img
  return (
    <img
      src="https://images.pexels.com/photos/31517300/pexels-photo-31517300.jpeg?auto=compress&cs=tinysrgb&w=1000"
      alt="Interior de restaurante acogedor"
      loading="lazy"
      onError={() => setErr(true)}
    />
  );
}

/* ---------- Demos interactivas ---------- */
function TicketDemo() {
  const [hash, setHash] = useState('pulsa para generar');
  const gen = () => {
    const hex = '0123456789abcdef';
    let h = '';
    for (let i = 0; i < 40; i++) h += hex[Math.floor(Math.random() * 16)];
    setHash(h);
  };
  return (
    <div className="demo">
      <div className="demo-label">Demo · ticket verificado</div>
      <div className="ticket">
        <div className="t-head">RESTAURANTE EJEMPLO<br /><small>NIF B00000000</small></div>
        <div className="t-line"><span>2x Menú del día</span><span>25,00 €</span></div>
        <div className="t-line"><span>1x Café</span><span>1,50 €</span></div>
        <div className="t-tot"><span>TOTAL</span><span>26,50 €</span></div>
        <div className="t-qr" />
        <div className="t-hash">Huella SHA-256:<br /><code>{hash}</code></div>
      </div>
      <button className="demo-btn" onClick={gen}>Generar ticket verificado</button>
    </div>
  );
}

function FidelidadDemo() {
  const [v, setV] = useState(3);
  const next = () => setV((p) => (p >= 5 ? 1 : p + 1));
  return (
    <div className="demo">
      <div className="demo-label">Demo · fidelización</div>
      <div className="client-card">
        <div className="cc-name">Laura · clienta</div>
        <div className="cc-visits">Visitas registradas: <b>{v}</b> / 5</div>
        <div className="cc-bar"><span style={{ width: (v / 5) * 100 + '%' }} /></div>
        <div className="cc-reward">
          {v >= 5 ? '🎉 ¡Café gratis desbloqueado!' : `${5 - v} visita(s) más para un café gratis ☕`}
        </div>
      </div>
      <button className="demo-btn" onClick={next}>Registrar visita</button>
    </div>
  );
}

function FichajeDemo() {
  const [inTurno, setInTurno] = useState(false);
  const [log, setLog] = useState([]);
  const fichar = () => {
    const t = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    setLog((l) => [{ tipo: inTurno ? 'Salida' : 'Entrada', t }, ...l]);
    setInTurno((x) => !x);
  };
  return (
    <div className="demo">
      <div className="demo-label">Demo · fichaje</div>
      <div><span className={'ficha-status' + (inTurno ? ' in' : '')}>{inTurno ? 'En turno' : 'Fuera de turno'}</span></div>
      <button className="demo-btn" onClick={fichar}>{inTurno ? 'Fichar salida' : 'Fichar entrada'}</button>
      <ul className="ficha-log">
        {log.map((e, i) => (<li key={i}><span>{e.tipo}</span><span>{e.t}</span></li>))}
      </ul>
    </div>
  );
}

function AlertasDemo() {
  const [list, setList] = useState([
    { c: 'al-rain', t: '🌧️ Lluvia intensa prevista 18:00–21:00 · afluencia estimada ↓ 30%' },
  ]);
  const add = () => setList((l) => [ALERTAS_POOL[Math.floor(Math.random() * ALERTAS_POOL.length)], ...l]);
  return (
    <div className="demo">
      <div className="demo-label">Demo · alertas en vivo</div>
      <ul className="alert-list">
        {list.map((a, i) => (<li key={i} className={a.c}>{a.t}</li>))}
      </ul>
      <button className="demo-btn" onClick={add}>Simular nueva alerta</button>
    </div>
  );
}

function FacturaDemo() {
  const [factura, setFactura] = useState(false);
  return (
    <div className="demo">
      <div className="demo-label">Demo · presupuesto → factura</div>
      <div className="ticket">
        <div className="t-head">{factura ? 'FACTURA A-2026/001' : 'PRESUPUESTO P-014'}<br /><small>{factura ? 'Documento fiscal · VeriFactu' : 'Sin valor fiscal · editable'}</small></div>
        <div className="t-line"><span>Menú evento (40 pax)</span><span>1.200,00 €</span></div>
        <div className="t-line"><span>Bebidas y café</span><span>320,00 €</span></div>
        <div className="t-tot"><span>TOTAL</span><span>1.520,00 €</span></div>
        {factura && <div className="t-qr" />}
        {factura && <div className="t-hash">Huella SHA-256:<br /><code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4</code></div>}
      </div>
      <button className="demo-btn" onClick={() => setFactura((x) => !x)}>
        {factura ? '← Volver a presupuesto' : 'Convertir en factura'}
      </button>
    </div>
  );
}

function StockDemo() {
  const [stock, setStock] = useState(24);
  const minimo = 10;
  return (
    <div className="demo">
      <div className="demo-label">Demo · control de stock</div>
      <div className="client-card">
        <div className="cc-name">Cerveza 33cl</div>
        <div className="cc-visits">Stock actual: <b>{stock}</b> ud · mínimo {minimo}</div>
        <div className="cc-bar"><span style={{ width: Math.min((stock / (minimo * 3)) * 100, 100) + '%', background: stock <= minimo ? '#c0492a' : undefined }} /></div>
        <div className="cc-reward" style={{ color: stock <= minimo ? '#c0492a' : undefined }}>
          {stock <= minimo ? '⚠️ Por debajo del mínimo, hay que reponer' : 'Stock saludable'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className="demo-btn" onClick={() => setStock((s) => Math.max(s - 1, 0))}>−1 (venta)</button>
        <button className="demo-btn" onClick={() => setStock((s) => s + 12)}>+12 (reposición)</button>
      </div>
    </div>
  );
}

function Demo({ m }) {
  switch (m.detalle.demo) {
    case 'ticket': return <TicketDemo />;
    case 'fidelidad': return <FidelidadDemo />;
    case 'fichaje': return <FichajeDemo />;
    case 'alertas': return <AlertasDemo />;
    case 'factura': return <FacturaDemo />;
    case 'stock': return <StockDemo />;
    default: return null;
  }
}

/* ============================================================
   PANEL DE SALUD FINANCIERA (arriba de la página, incluido y gratis)
   EDITA AQUÍ los números de ejemplo. Luego saldrán de tus módulos.
   ============================================================ */
const SALUD = {
  negocio: 'La Tasca de Santi',
  estado: 'verde', // 'verde' | 'amarillo' | 'rojo'
  mensaje: 'Vas bien: ventas al alza y costes controlados',
  ventas: 12400, ventasVar: 8, ticketMedio: 18.5, mejorDia: 'Sábado',
  costePersonal: 34, materiaPrima: 30, costePrincipal: 64,
  beneficio: 2100, equilibrio: 9800, disponible: 7250,
  mostrarReservas: true, reservas: 14, comensales: 38, ocupacion: 78,
};
const SF_SEM = {
  verde:    { etiqueta: 'Verde',    icono: '✓', bg: 'rgba(46,158,107,.12)', borde: '#2E9E6B', color: '#1A6A48' },
  amarillo: { etiqueta: 'Atención', icono: '!', bg: 'rgba(224,169,42,.14)', borde: '#E0A92A', color: '#8a6a14' },
  rojo:     { etiqueta: 'Alerta',   icono: '!', bg: 'rgba(224,97,42,.12)',  borde: '#E0612A', color: '#a8401d' },
};

function SaludPanel() {
  const d = SALUD;
  const s = SF_SEM[d.estado] || SF_SEM.verde;
  const sube = d.ventasVar >= 0;
  const ticket = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(d.ticketMedio);
  return (
    <section className="sf-panel" id="panel">
      <div className="sf-cover">
        <img src="https://images.pexels.com/photos/26743048/pexels-photo-26743048.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Billetes de euro y gráficas de crecimiento sobre una mesa" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>
      <div className="sf-panel-head">
        <div>
          <h2>Salud financiera</h2>
          <p>Hola, {d.negocio} · resumen de este mes</p>
        </div>
        <span className="sf-incluido">Incluido · sin coste</span>
      </div>

      <div className="sf-health" style={{ background: s.bg, borderColor: s.borde }}>
        <span className="sf-health-icon" style={{ background: s.borde }}>{s.icono}</span>
        <div className="sf-health-text">
          <span className="sf-health-label" style={{ color: s.color }}>Salud del negocio</span>
          <strong style={{ color: s.color }}>{d.mensaje}</strong>
        </div>
        <span className="sf-pill" style={{ color: s.color, borderColor: s.borde }}>{s.etiqueta}</span>
      </div>

      <div className="sf-grid">
        <div className="sf-card">
          <div className="sf-card-head"><span className="sf-emoji">💶</span> Ingresos</div>
          <div className="sf-big">{fmt(d.ventas)} €
            <span className={'sf-var ' + (sube ? 'up' : 'down')}>{sube ? '↑' : '↓'} {Math.abs(d.ventasVar)}% vs mes pasado</span>
          </div>
          <div className="sf-rows">
            <div className="sf-row"><span>Ticket medio</span><b>{ticket} €</b></div>
            <div className="sf-row"><span>Mejor día</span><b>{d.mejorDia}</b></div>
          </div>
        </div>

        <div className="sf-card">
          <div className="sf-card-head"><span className="sf-emoji">🧾</span> Costes</div>
          <div className="sf-rows">
            <div className="sf-row"><span>Coste de personal</span><b className={d.costePersonal > 32 ? 'warn' : ''}>{d.costePersonal}%{d.costePersonal > 32 ? ' · algo alto' : ''}</b></div>
            <div className="sf-row"><span>Materia prima</span><b>{d.materiaPrima}%</b></div>
          </div>
          <div className="sf-barwrap">
            <div className="sf-row"><span>Coste principal</span><b>{d.costePrincipal}%</b></div>
            <div className="sf-bar"><span style={{ width: d.costePrincipal + '%', background: '#BA7517' }} /></div>
          </div>
        </div>

        <div className="sf-card">
          <div className="sf-card-head"><span className="sf-emoji">📈</span> Rentabilidad y tesorería</div>
          <div className="sf-big">{fmt(d.beneficio)} €<span className="sf-sub">beneficio estimado</span></div>
          <div className="sf-rows">
            <div className="sf-row"><span>Punto de equilibrio</span><b>{fmt(d.equilibrio)} €</b></div>
            <div className="sf-row"><span>Dinero disponible</span><b>{fmt(d.disponible)} €</b></div>
          </div>
        </div>

        {d.mostrarReservas && (
          <div className="sf-card">
            <div className="sf-card-head"><span className="sf-emoji">📅</span> Reservas y ocupación</div>
            <div className="sf-mini">
              <div className="sf-mini-box"><span>Reservas hoy</span><b>{d.reservas}</b></div>
              <div className="sf-mini-box"><span>Comensales</span><b>{d.comensales}</b></div>
            </div>
            <div className="sf-barwrap">
              <div className="sf-row"><span>Ocupación prevista</span><b>{d.ocupacion}%</b></div>
              <div className="sf-bar"><span style={{ width: d.ocupacion + '%', background: '#199E94' }} /></div>
            </div>
          </div> 
        )}
      </div>
    </section>
  );
}

/* ============================================================
   PÁGINA
   ============================================================ */
export default function CatalogoPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState('month');
  const [selected, setSelected] = useState({});
  const [open, setOpen] = useState({});
  const [negocioId, setNegocioId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/acceso'); return; }
      const { data } = await supabase
        .from('negocios')
        .select('id')
        .eq('propietario', user.id)
        .single();
      if (data) setNegocioId(data.id);
    })();
  }, []);
const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/acceso');
  };
  const toggleSel = (id) =>
    setSelected((s) => {
      const next = { ...s, [id]: !s[id] };
      const mod = MODULOS.find((m) => m.id === id);
      // Al añadir una ampliación (Facturación Pro), se activa también su módulo base (VeriFactu).
      if (next[id] && mod?.requiere) next[mod.requiere] = true;
      // Al quitar un módulo, se quitan las ampliaciones que lo necesitan.
      if (!next[id]) MODULOS.forEach((m) => { if (m.requiere === id) next[m.id] = false; });
      return next;
    });
  const toggleOpen = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const selIds = MODULOS.filter((m) => selected[m.id]);

  // Separamos la selección: módulos que cuentan para el pack, y los que quedan fuera (ej. Stock)
  const selPack = selIds.filter((m) => MODULOS_PACK_IDS.includes(m.id));
  const selFuera = selIds.filter((m) => !MODULOS_PACK_IDS.includes(m.id));
  const allSelPack = selPack.length === MODULOS_PACK_IDS.length && selPack.length > 0;

  const subtotalPack = selPack.reduce((t, m) => t + priceFor(m, cycle), 0);
  const descuento = allSelPack ? Math.round(subtotalPack * DESCUENTO_PACK) : 0;
  const subtotalFuera = selFuera.reduce((t, m) => t + priceFor(m, cycle), 0);
  const total = subtotalPack - descuento + subtotalFuera;

  const solicitar = () => {
    if (selIds.length === 0) { alert('Selecciona al menos un módulo para continuar.'); return; }
    const names = selIds.map((m) => m.titulo.split('—')[0].trim()).join(', ');
    // TODO: aquí conecta tu formulario / email / WhatsApp / pasarela de pago.
    alert('Solicitud de implementación:\n\n' + names);
  };
const pagar = async () => {
    if (selIds.length === 0) { alert('Selecciona al menos un módulo para continuar.'); return; }
    const res = await crearCheckout(selIds.map((m) => m.id), cycle, negocioId);
    if (res?.url) { window.location.href = res.url; }
    else { alert(res?.error || 'No se pudo iniciar el pago.'); }
  };
  return (
    <div className="tgh-root">
      <style>{STYLES}</style>

      <div className="tgh-wrap">
        <nav>
          <div className="brand"><span className="mark">◆</span> Tu Gestor Hostelero</div>
          <div className="navlinks">
            <a href="/panel">Mi panel</a>
            <a href="#config">Módulos</a>
            <a href="#config">Precios</a>
            <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }}>Cerrar sesión</button>
          </div>
        </nav>

        <SaludPanel />

        <section className="hero">
          <div>
            <span className="eyebrow"><span className="dot" /> Suite modular para hostelería</span>
            <h1>Elige lo que <em>tu negocio</em> necesita.</h1>
            <p className="lead">Activa solo los módulos que te interesan, descúbrelos con su demo y conoce tu coste al instante.</p>
          </div>
          <div className="hero-img"><HeroPhoto /></div>
        </section>

        <section className="config" id="config">
          <div>
            <div className="section-title">
              <h2>Configura tu suite</h2>
              <div className="billing">
                <button className={cycle === 'month' ? 'active' : ''} onClick={() => setCycle('month')}>Mensual</button>
                <button className={cycle === 'year' ? 'active' : ''} onClick={() => setCycle('year')}>Anual · 2 meses gratis</button>
              </div>
            </div>

            <p className="config-intro">
              Activa solo los módulos que necesites. El panel de <b>Salud Financiera</b> está incluido en todos los planes, sin coste.
            </p>

            <div className="cards">
              {MODULOS.map((m) => (
                <div className={'module' + (selected[m.id] ? ' selected' : '')} key={m.id}>
                  <Photo m={m} />
                  <div className="m-body">
                    <div className="m-top">
                      <div className="m-head">
                        <div className={'m-icon ' + m.iconClass}>{m.icono}</div>
                        <div><div className="m-title">{m.titulo}</div></div>
                      </div>
                      <div className="m-price">
                        <span className="amt">{fmt(priceFor(m, cycle))} €</span>
                        <span className="per">{cycle === 'month' ? '/mes' : '/año'}</span>
                        <span className="iva">+ 21% IVA</span>
                      </div>
                    </div>
                    <p className="m-desc">{m.desc}</p>
                    <div className="m-feats">{m.feats.map((f, i) => (<span className="feat" key={i}>{f}</span>))}</div>
                    <div className="m-actions">
                      <button className="btn-add" onClick={() => toggleSel(m.id)}>
                        {selected[m.id] ? 'Quitar ✓' : 'Añadir al presupuesto'}
                      </button>
                      <button className={'btn-detail' + (open[m.id] ? ' open' : '')} onClick={() => toggleOpen(m.id)}>
                        Ver detalles <span className="car">▾</span>
                      </button>
                    </div>
                    <div className={'m-detail' + (open[m.id] ? ' open' : '')}>
                      <div className="m-detail-inner">
                        <p className="det-ext">{m.detalle.ext}</p>
                        <ul className="det-benes">{m.detalle.benes.map((b, i) => (<li key={i}>{b}</li>))}</ul>
                        <Demo m={m} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="summary">
              <h3>Tu presupuesto</h3>
              <div className="sub">Resumen de lo que has seleccionado</div>
              <div className="sumlist">
                {selIds.length === 0
                  ? <div className="empty">Aún no has añadido ningún módulo.</div>
                  : selIds.map((m) => (
                      <div className="sumrow" key={m.id}>
                        <span>{m.titulo.split('—')[0].trim()}</span>
                        <span>{fmt(priceFor(m, cycle))} €</span>
                      </div>
                    ))}
              </div>
              {selPack.length > 0 && !allSelPack && (
                <div className="pack-hint">Añade los {MODULOS_PACK_IDS.length} módulos del pack y ahorra un {Math.round(DESCUENTO_PACK * 100)}%.</div>
              )}
              {allSelPack && (
                <div className="sumrow pack"><span>Pack de 5 módulos (−{Math.round(DESCUENTO_PACK * 100)}%)</span><span>−{fmt(descuento)} €</span></div>
              )}
              <div className="total">
                <div><div className="lbl">Total · sin IVA</div></div>
                <div className="big">{fmt(total)} €<small>{cycle === 'month' ? '/mes' : '/año'}</small></div>
              </div>
              <div className="iva-note">Se añade el 21% de IVA en el pago.</div>
              <button className="cta" onClick={pagar}>Contratar ahora</button>
              
              <button className="reset" onClick={() => setSelected({})}>Reiniciar selección</button>
            </div>
          </aside>
        </section>
      </div>

      <footer className="tgh-footer">Tu Gestor Hostelero — Suite modular para el sector hostelero · Precios sin IVA · se añade el 21% en el pago</footer>
    </div>
  );
}

/* ============================================================
   ESTILOS (aislados bajo .tgh-root para no chocar con tu proyecto)
   ============================================================ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');

.tgh-root{
  --bg:#F3F1E7; --paper:#FBFAF4; --card:#FFFFFF;
  --ink:#15271C; --green-900:#0D3A28; --green-700:#1A6A48;
  --green-500:#2E9E6B; --lime:#BCE05A; --teal:#199E94;
  --muted:#5C6B61; --line:#E2E0D2;
  --shadow:0 18px 50px -22px rgba(13,58,40,.45);
  font-family:'Hanken Grotesk',sans-serif; color:var(--ink); line-height:1.55;
  -webkit-font-smoothing:antialiased; background:var(--bg);
  background-image:radial-gradient(circle at 12% -5%,rgba(46,158,107,.10),transparent 45%),radial-gradient(circle at 95% 8%,rgba(25,158,148,.10),transparent 42%);
}
.tgh-root *{box-sizing:border-box;margin:0;padding:0}
.tgh-root h1,.tgh-root h2,.tgh-root h3{font-family:'Bricolage Grotesque',sans-serif;letter-spacing:-.02em;line-height:1.05}
.tgh-wrap{max-width:1180px;margin:0 auto;padding:0 24px}

.tgh-root nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.tgh-root .brand{display:flex;align-items:center;gap:11px;font-family:'Bricolage Grotesque';font-weight:800;font-size:1.18rem}
.tgh-root .brand .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--green-700),var(--green-500));display:grid;place-items:center;color:#fff;box-shadow:var(--shadow)}
.tgh-root .navlinks{display:flex;gap:26px;font-weight:500;font-size:.95rem}
.tgh-root .navlinks a{color:var(--muted);text-decoration:none;transition:color .2s}
.tgh-root .navlinks a:hover{color:var(--green-700)}
@media(max-width:720px){
  .tgh-root nav{flex-wrap:wrap;justify-content:center}
  .tgh-root .brand{width:100%;justify-content:center;text-align:center;white-space:nowrap;font-size:1rem}
  .tgh-root .navlinks{display:flex;flex-wrap:wrap;gap:14px;font-size:.8rem;justify-content:center;width:100%;margin-top:10px}
}
.tgh-root .hero{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center;padding:30px 0 10px}
@media(max-width:860px){.tgh-root .hero{grid-template-columns:1fr}}
.tgh-root .eyebrow{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.8rem;text-transform:uppercase;letter-spacing:.16em;color:var(--green-700);background:rgba(46,158,107,.12);padding:7px 14px;border-radius:100px}
.tgh-root .eyebrow .dot{width:7px;height:7px;border-radius:50%;background:var(--lime)}
.tgh-root .hero h1{font-size:clamp(2.3rem,5.5vw,3.8rem);font-weight:800;margin:20px 0 16px}
.tgh-root .hero h1 em{font-style:normal;color:var(--green-700)}
.tgh-root .hero p.lead{font-size:1.15rem;color:var(--muted);max-width:48ch}
.tgh-root .hero-img{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:5/4;box-shadow:var(--shadow);background:linear-gradient(135deg,var(--green-700),var(--teal))}
.tgh-root .hero-img img{width:100%;height:100%;object-fit:cover;display:block}

.tgh-root .config{display:grid;grid-template-columns:1fr 360px;gap:34px;align-items:start;padding:42px 0 90px}
@media(max-width:920px){.tgh-root .config{grid-template-columns:1fr}}
.tgh-root .section-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:8px}
.tgh-root .section-title h2{font-size:1.7rem;font-weight:700}
.tgh-root .billing{display:inline-flex;background:var(--paper);border:1px solid var(--line);border-radius:100px;padding:4px}
.tgh-root .billing button{border:none;background:none;font-family:inherit;font-weight:600;font-size:.84rem;color:var(--muted);padding:7px 15px;border-radius:100px;cursor:pointer;transition:.2s}
.tgh-root .billing button.active{background:var(--green-700);color:#fff}

.tgh-root .cards{display:flex;flex-direction:column;gap:22px}
.tgh-root .module{position:relative;background:var(--card);border:1.5px solid var(--line);border-radius:22px;overflow:hidden;transition:border-color .22s,box-shadow .22s,transform .22s}
.tgh-root .module:hover{border-color:var(--green-500);box-shadow:var(--shadow);transform:translateY(-2px)}
.tgh-root .module.selected{border-color:var(--green-700);box-shadow:var(--shadow)}
.tgh-root .m-photo{position:relative;height:180px;overflow:hidden;background:linear-gradient(135deg,var(--green-700),var(--teal))}
.tgh-root .m-photo img{width:100%;height:100%;object-fit:cover;display:block}
.tgh-root .m-photo.noimg::after{content:attr(data-emoji);position:absolute;inset:0;display:grid;place-items:center;font-size:3.4rem;opacity:.5}
.tgh-root .m-badge{position:absolute;top:14px;left:14px;background:rgba(255,255,255,.92);color:var(--green-900);font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:6px 12px;border-radius:8px}
.tgh-root .m-badge.addon{background:var(--lime)}
.tgh-root .m-body{padding:22px 24px 22px}
.tgh-root .m-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.tgh-root .m-head{display:flex;gap:14px}
.tgh-root .m-icon{flex:none;width:50px;height:50px;border-radius:13px;display:grid;place-items:center;font-size:1.45rem;background:rgba(46,158,107,.12)}
.tgh-root .m-icon.fiscal{background:rgba(26,106,72,.14)} .tgh-root .m-icon.crm{background:rgba(25,158,148,.14)}
.tgh-root .m-icon.emp{background:rgba(26,106,72,.10)} .tgh-root .m-icon.alert{background:rgba(188,224,90,.30)}
.tgh-root .m-title{font-family:'Bricolage Grotesque';font-weight:700;font-size:1.26rem}
.tgh-root .m-price{text-align:right;flex:none}
.tgh-root .m-price .amt{font-family:'Bricolage Grotesque';font-weight:800;font-size:1.6rem;color:var(--green-900)}
.tgh-root .m-price .per{display:block;font-size:.77rem;color:var(--muted);font-weight:600}
.tgh-root .m-price .iva{display:block;font-size:.66rem;color:var(--muted);font-weight:600;margin-top:2px}
.tgh-root .config-intro{margin:-4px 0 24px;color:var(--muted);font-size:1rem;max-width:62ch}
.tgh-root .config-intro b{color:var(--green-700);font-weight:700}
.tgh-root .m-desc{color:var(--muted);margin:14px 0 14px;font-size:.99rem}
.tgh-root .m-feats{display:flex;flex-wrap:wrap;gap:8px}
.tgh-root .feat{font-size:.81rem;font-weight:500;background:var(--paper);border:1px solid var(--line);padding:5px 11px;border-radius:8px}
.tgh-root .m-actions{display:flex;gap:10px;margin-top:18px}
.tgh-root .btn-add{flex:1;border:none;background:var(--green-700);color:#fff;font-family:'Bricolage Grotesque';font-weight:700;font-size:.95rem;padding:12px;border-radius:12px;cursor:pointer;transition:.2s}
.tgh-root .btn-add:hover{background:var(--green-900)}
.tgh-root .module.selected .btn-add{background:var(--lime);color:var(--green-900)}
.tgh-root .btn-detail{border:1.5px solid var(--line);background:none;color:var(--green-700);font-family:inherit;font-weight:600;font-size:.92rem;padding:12px 16px;border-radius:12px;cursor:pointer;transition:.2s;white-space:nowrap}
.tgh-root .btn-detail:hover{border-color:var(--green-500);background:var(--paper)}
.tgh-root .btn-detail .car{display:inline-block;transition:transform .3s}
.tgh-root .btn-detail.open .car{transform:rotate(180deg)}
.tgh-root .m-detail{max-height:0;overflow:hidden;transition:max-height .45s ease}
.tgh-root .m-detail.open{max-height:1400px}
.tgh-root .m-detail-inner{padding-top:20px;margin-top:20px;border-top:1px dashed var(--line)}
.tgh-root .det-ext{font-size:.97rem;color:var(--ink);margin-bottom:14px}
.tgh-root .det-benes{list-style:none;display:grid;gap:8px;margin-bottom:18px}
.tgh-root .det-benes li{display:flex;gap:10px;font-size:.93rem;color:var(--muted)}
.tgh-root .det-benes li::before{content:"✓";color:var(--green-500);font-weight:800}

.tgh-root .demo{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:18px}
.tgh-root .demo-label{font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:12px}
.tgh-root .demo-btn{margin-top:14px;border:none;background:var(--green-900);color:#EAF3EC;font-family:'Bricolage Grotesque';font-weight:700;font-size:.88rem;padding:10px 16px;border-radius:10px;cursor:pointer;transition:.2s}
.tgh-root .demo-btn:hover{background:var(--green-700)}
.tgh-root .ticket{background:#fff;border:1px dashed #c9c5b3;border-radius:10px;padding:16px;font-family:ui-monospace,monospace;font-size:.82rem;max-width:280px}
.tgh-root .t-head{text-align:center;font-weight:700;margin-bottom:10px;line-height:1.3}
.tgh-root .t-line,.tgh-root .t-tot{display:flex;justify-content:space-between;padding:3px 0}
.tgh-root .t-tot{border-top:1px solid #ddd;margin-top:6px;padding-top:6px;font-weight:700}
.tgh-root .t-qr{margin:12px auto 6px;width:64px;height:64px;background:repeating-conic-gradient(var(--ink) 0 25%,#fff 0 50%) 0/12px 12px;border:3px solid var(--ink);border-radius:6px}
.tgh-root .t-hash{text-align:center;font-size:.7rem;color:var(--muted);word-break:break-all}
.tgh-root .t-hash code{color:var(--green-700)}
.tgh-root .client-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;max-width:300px}
.tgh-root .cc-name{font-weight:700;margin-bottom:4px}
.tgh-root .cc-visits{font-size:.88rem;color:var(--muted);margin-bottom:10px}
.tgh-root .cc-bar{height:9px;background:#eee;border-radius:6px;overflow:hidden;margin-bottom:10px}
.tgh-root .cc-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--green-500),var(--lime));transition:width .4s}
.tgh-root .cc-reward{font-size:.85rem;font-weight:600;color:var(--green-700)}
.tgh-root .ficha-status{display:inline-block;font-weight:700;padding:6px 14px;border-radius:100px;background:#eee;color:var(--muted);margin-bottom:6px;transition:.3s}
.tgh-root .ficha-status.in{background:rgba(46,158,107,.18);color:var(--green-700)}
.tgh-root .ficha-log{list-style:none;margin-top:12px;display:grid;gap:5px;font-size:.84rem;color:var(--muted);max-height:120px;overflow:auto}
.tgh-root .ficha-log li{display:flex;justify-content:space-between;background:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 10px}
.tgh-root .alert-list{list-style:none;display:grid;gap:8px}
.tgh-root .alert-list li{font-size:.86rem;font-weight:500;padding:10px 12px;border-radius:10px;border-left:4px solid;background:#fff}
.tgh-root .al-rain{border-color:var(--teal)} .tgh-root .al-obra{border-color:#e0a92a} .tgh-root .al-event{border-color:var(--green-500)} .tgh-root .al-heat{border-color:#e0612a}

.tgh-root .summary{position:sticky;top:24px;background:var(--green-900);color:#EAF3EC;border-radius:24px;padding:30px 28px;box-shadow:var(--shadow);overflow:hidden}
.tgh-root .summary::after{content:"";position:absolute;width:220px;height:220px;right:-70px;top:-70px;border-radius:50%;background:radial-gradient(circle,rgba(188,224,90,.22),transparent 70%)}
.tgh-root .summary h3{font-size:1.25rem;font-weight:700;margin-bottom:4px}
.tgh-root .summary .sub{font-size:.86rem;color:rgba(234,243,236,.6);margin-bottom:22px}
.tgh-root .sumlist{display:flex;flex-direction:column;gap:2px;min-height:46px}
.tgh-root .sumrow{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.10);font-size:.95rem}
.tgh-root .sumrow span:last-child{font-weight:700;font-family:'Bricolage Grotesque'}
.tgh-root .empty{font-size:.92rem;color:rgba(234,243,236,.5);padding:14px 0}
.tgh-root .sumrow.pack span{color:var(--lime)}
.tgh-root .pack-hint{font-size:.82rem;font-weight:600;color:var(--lime);padding:12px 0 0}
.tgh-root .iva-note{font-size:.78rem;color:rgba(234,243,236,.6);margin-top:10px;text-align:center}
.tgh-root .total{display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding-top:18px;border-top:2px solid rgba(188,224,90,.4)}
.tgh-root .total .lbl{font-size:.95rem;color:rgba(234,243,236,.75)}
.tgh-root .total .big{font-family:'Bricolage Grotesque';font-weight:800;font-size:2.3rem;line-height:1;color:#fff}
.tgh-root .total .big small{font-size:.9rem;font-weight:600;color:rgba(234,243,236,.6)}
.tgh-root .cta{display:block;width:100%;text-align:center;margin-top:22px;background:var(--lime);color:var(--green-900);font-family:'Bricolage Grotesque';font-weight:800;font-size:1.02rem;border:none;border-radius:14px;padding:15px;cursor:pointer;transition:.2s}
.tgh-root .cta:hover{transform:translateY(-2px);box-shadow:0 14px 30px -10px rgba(188,224,90,.6)}
.tgh-root .reset{display:block;width:100%;margin-top:10px;background:none;border:none;color:rgba(234,243,236,.6);font-family:inherit;font-size:.85rem;cursor:pointer;text-decoration:underline}
.tgh-footer{border-top:1px solid var(--line);padding:30px 0;color:var(--muted);font-size:.88rem;text-align:center;max-width:1180px;margin:0 auto}

/* ---- Panel de Salud Financiera (arriba de la página) ---- */
.tgh-root .sf-panel{padding:24px 0 6px}
.tgh-root .sf-cover{position:relative;height:180px;border-radius:18px;overflow:hidden;margin-bottom:18px;background:linear-gradient(135deg,var(--green-700),var(--teal))}
.tgh-root .sf-cover img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.tgh-root .sf-panel-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.tgh-root .sf-panel-head h2{font-size:1.7rem;font-weight:700}
.tgh-root .sf-panel-head p{color:var(--muted);font-size:.95rem;margin-top:2px}
.tgh-root .sf-incluido{font-size:.72rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--green-900);background:var(--lime);padding:6px 12px;border-radius:100px}
.tgh-root .sf-health{display:flex;align-items:center;gap:14px;border:1.5px solid;border-radius:18px;padding:16px 20px;margin-bottom:16px}
.tgh-root .sf-health-icon{flex:none;width:36px;height:36px;border-radius:50%;color:#fff;display:grid;place-items:center;font-weight:800;font-size:1.15rem}
.tgh-root .sf-health-text{flex:1;display:flex;flex-direction:column;gap:2px}
.tgh-root .sf-health-label{font-size:.82rem;font-weight:600}
.tgh-root .sf-health-text strong{font-size:1.06rem;font-weight:700}
.tgh-root .sf-pill{flex:none;font-size:.78rem;font-weight:700;border:1.5px solid;border-radius:100px;padding:5px 14px}
.tgh-root .sf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
.tgh-root .sf-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px 22px;box-shadow:var(--shadow)}
.tgh-root .sf-card-head{display:flex;align-items:center;gap:9px;font-family:'Bricolage Grotesque';font-weight:700;font-size:1.04rem;margin-bottom:14px}
.tgh-root .sf-emoji{font-size:1.12rem}
.tgh-root .sf-big{font-family:'Bricolage Grotesque';font-weight:800;font-size:1.7rem;color:var(--green-900);display:flex;flex-wrap:wrap;align-items:baseline;gap:10px}
.tgh-root .sf-sub{font-size:.84rem;font-weight:600;color:var(--muted)}
.tgh-root .sf-var{font-size:.82rem;font-weight:700}
.tgh-root .sf-var.up{color:var(--green-500)} .tgh-root .sf-var.down{color:#c0492a}
.tgh-root .sf-rows{margin-top:14px;display:flex;flex-direction:column;gap:9px}
.tgh-root .sf-row{display:flex;justify-content:space-between;align-items:center;font-size:.92rem;color:var(--muted)}
.tgh-root .sf-row b{color:var(--ink);font-weight:700}
.tgh-root .sf-row b.warn{color:#b08a1a}
.tgh-root .sf-barwrap{margin-top:14px}
.tgh-root .sf-bar{height:7px;background:#ECEADD;border-radius:5px;overflow:hidden;margin-top:7px}
.tgh-root .sf-bar span{display:block;height:100%;border-radius:5px}
.tgh-root .sf-mini{display:flex;gap:12px;margin-bottom:6px}
.tgh-root .sf-mini-box{flex:1;background:#F7F5EC;border-radius:12px;padding:11px 14px}
.tgh-root .sf-mini-box span{display:block;font-size:.8rem;color:var(--muted)}
.tgh-root .sf-mini-box b{font-family:'Bricolage Grotesque';font-weight:800;font-size:1.35rem;color:var(--green-900)}
.tgh-root .stock{background-color:#ccfbf1;color:#0d9488}
`;
