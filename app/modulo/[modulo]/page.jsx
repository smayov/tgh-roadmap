'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../supabaseClient';

/* ============================================================
   PÁGINA "PRÓXIMAMENTE" DE CADA MÓDULO
   Ruta: /modulo/[modulo]  (ej. /modulo/verifactu)
   - Comprueba que el usuario tiene ese módulo activo.
   - Si no lo tiene, lo manda al catálogo.
   - Muestra un "en desarrollo" con lo que traerá el módulo.
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
};

export default function ModuloPage() {
  const router = useRouter();
  const params = useParams();
  const moduloId = params?.modulo;
  const [estado, setEstado] = useState('cargando'); // cargando | ok | sin-acceso

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/acceso'); return; }

      const { data: negocio } = await supabase
        .from('negocios')
        .select('id')
        .eq('propietario', user.id)
        .maybeSingle();

      if (!negocio) { router.replace('/catalogo'); return; }

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

  // Módulo desconocido
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

  // No tiene el módulo contratado
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

  // Tiene acceso: pantalla "próximamente"
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

/* ===================== estilos ===================== */
const wrap = {
  minHeight: '100vh',
  background: '#0D3A28',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: 24,
  boxSizing: 'border-box',
};
const container = { width: '100%', maxWidth: 640, textAlign: 'center' };
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