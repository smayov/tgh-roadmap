'use client';

// auditoria-seguridad-tgh.jsx
// Herramienta interna de Gescobit para auditar operativa/seguridad de
// clientes potenciales. Dos modos:
//  - Gescobit (autenticado, Supabase con sesión + RLS): asistente de 7 pasos.
//  - Cliente (sin cuenta, código de 6 caracteres): página única con los
//    campos "azules" (datos_negocio, operativa, seguridad), servida por
//    /api/auditoria/cliente.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { calcularNivelRiesgo, calcularPuntuacionRiesgo } from '@/lib/auditoria';

const PASOS = [
  { id: 'datos_negocio', titulo: 'Datos', tipo: 'azul' },
  { id: 'alcance', titulo: 'Alcance', tipo: 'verde' },
  { id: 'operativa', titulo: 'Operativa', tipo: 'azul' },
  { id: 'seguridad', titulo: 'Seguridad', tipo: 'azul' },
  { id: 'matriz_hallazgos', titulo: 'Hallazgos', tipo: 'verde' },
  { id: 'plan_mejora', titulo: 'Plan de mejora', tipo: 'verde' },
  { id: 'resumen', titulo: 'Resumen y firma', tipo: 'verde' },
];

const COLOR_RIESGO = { alto: '#DC4C3F', medio: '#D9A83E', bajo: '#3E9B6F' };

const AREAS_ALCANCE = ['Caja', 'Accesos', 'Cámaras', 'Datos de clientes', 'Personal', 'Proveedores'];
const CATEGORIAS_HALLAZGO = ['Acceso físico', 'Caja y efectivo', 'Videovigilancia', 'Datos y RGPD', 'Personal', 'Continuidad de negocio'];

// ============================================================
// Campos de formulario reutilizables
// ============================================================
function Campo({ label, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
      />
    </label>
  );
}

function CampoTextarea({ label, value, onChange, placeholder, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
      />
    </label>
  );
}

function CampoSelect({ label, value, onChange, opciones, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
      >
        <option value="">Selecciona…</option>
        {opciones.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function CampoSiNo({ label, value, onChange, className = '' }) {
  return (
    <div className={`flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 ${className}`}>
      <span className="text-sm text-stone-700">{label}</span>
      <div className="flex gap-1">
        {['si', 'no'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-md px-3 py-1 text-xs font-medium ${
              value === opt ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
            }`}
          >
            {opt === 'si' ? 'Sí' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Medidor de riesgo en vivo
// ============================================================
function MedidorRiesgo({ hallazgos }) {
  const puntuacion = calcularPuntuacionRiesgo(hallazgos);
  const nivel = calcularNivelRiesgo(hallazgos);
  const color = nivel ? COLOR_RIESGO[nivel] : '#B8B2A5';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3">
      <div className="relative h-14 w-14 shrink-0">
        <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EDE9E1" strokeWidth="4" />
          <circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${(puntuacion / 100) * 97.4} 97.4`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-stone-700">
          {puntuacion}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-400">Nivel de riesgo</p>
        <p className="text-sm font-semibold" style={{ color }}>
          {nivel ? nivel.charAt(0).toUpperCase() + nivel.slice(1) : 'Sin datos aún'}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Paso 1 — Datos del negocio (azul, compartido con el cliente)
// ============================================================
function CamposDatosNegocio({ valor, onChange }) {
  const set = (campo) => (v) => onChange({ ...valor, [campo]: v });
  return (
    <div className="grid grid-cols-2 gap-4">
      <Campo label="Nombre del negocio" value={valor.nombre} onChange={set('nombre')} className="col-span-2" />
      <CampoSelect
        label="Tipo de negocio" value={valor.tipo} onChange={set('tipo')}
        opciones={['Bar', 'Restaurante', 'Hotel', 'Otro']}
      />
      <Campo label="Nº de empleados" type="number" value={valor.num_empleados} onChange={set('num_empleados')} />
      <Campo label="Dirección" value={valor.direccion} onChange={set('direccion')} className="col-span-2" />
      <Campo label="Persona de contacto" value={valor.contacto_nombre} onChange={set('contacto_nombre')} />
      <Campo label="Teléfono" value={valor.contacto_telefono} onChange={set('contacto_telefono')} />
      <Campo label="Email" type="email" value={valor.contacto_email} onChange={set('contacto_email')} className="col-span-2" />
    </div>
  );
}

// ============================================================
// Paso 2 — Alcance (verde, solo Gescobit)
// ============================================================
function CamposAlcance({ valor, onChange }) {
  const areas = valor.areas || [];
  const toggleArea = (area) => {
    const nuevas = areas.includes(area) ? areas.filter((a) => a !== area) : [...areas, area];
    onChange({ ...valor, areas: nuevas });
  };
  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-xs font-medium text-stone-500">Áreas a auditar</span>
        <div className="flex flex-wrap gap-2">
          {AREAS_ALCANCE.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                areas.includes(area) ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo label="Fecha de la visita" type="date" value={valor.fecha_visita} onChange={(v) => onChange({ ...valor, fecha_visita: v })} />
        <Campo label="Auditor responsable" value={valor.auditor} onChange={(v) => onChange({ ...valor, auditor: v })} />
      </div>
    </div>
  );
}

// ============================================================
// Paso 3 — Operativa (azul, compartido con el cliente)
// ============================================================
function CamposOperativa({ valor, onChange }) {
  const set = (campo) => (v) => onChange({ ...valor, [campo]: v });
  return (
    <div className="grid grid-cols-2 gap-4">
      <Campo label="Horario de apertura" type="time" value={valor.horario_apertura} onChange={set('horario_apertura')} />
      <Campo label="Horario de cierre" type="time" value={valor.horario_cierre} onChange={set('horario_cierre')} />
      <CampoTextarea
        label="Procedimiento de apertura/cierre" value={valor.procedimiento_apertura_cierre}
        onChange={set('procedimiento_apertura_cierre')} className="col-span-2"
      />
      <CampoSelect
        label="Gestión de caja" value={valor.gestion_caja} onChange={set('gestion_caja')}
        opciones={['Solo efectivo', 'Solo tarjeta', 'Mixto']}
      />
      <CampoSelect
        label="Control de inventario" value={valor.control_inventario} onChange={set('control_inventario')}
        opciones={['Manual', 'Software', 'Sin control']}
      />
      <Campo
        label="Software de gestión que usan" value={valor.software_gestion} onChange={set('software_gestion')}
        placeholder="TGH, otro, ninguno…" className="col-span-2"
      />
    </div>
  );
}

// ============================================================
// Paso 4 — Seguridad (azul, compartido con el cliente)
// ============================================================
function CamposSeguridad({ valor, onChange }) {
  const set = (campo) => (v) => onChange({ ...valor, [campo]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <CampoSiNo label="Alarma instalada" value={valor.alarma} onChange={set('alarma')} />
        <CampoSiNo label="Cámaras de videovigilancia" value={valor.camaras} onChange={set('camaras')} />
        <CampoSiNo label="Control de accesos" value={valor.control_accesos} onChange={set('control_accesos')} />
        <CampoSiNo label="Caja fuerte" value={valor.caja_fuerte} onChange={set('caja_fuerte')} />
        <CampoSiNo label="Seguro del negocio" value={valor.seguro_negocio} onChange={set('seguro_negocio')} />
        <CampoSiNo label="Copias de seguridad de datos" value={valor.copias_seguridad} onChange={set('copias_seguridad')} />
        <CampoSiNo label="Consentimientos RGPD de clientes" value={valor.consentimientos_rgpd} onChange={set('consentimientos_rgpd')} />
      </div>
      {valor.camaras === 'si' && (
        <Campo label="Número de cámaras" type="number" value={valor.num_camaras} onChange={set('num_camaras')} />
      )}
      <CampoTextarea label="Protocolo ante robo o incidente" value={valor.protocolo_robo} onChange={set('protocolo_robo')} />
    </div>
  );
}

// ============================================================
// Paso 5 — Matriz de hallazgos (verde, lista dinámica)
// ============================================================
function MatrizHallazgos({ valor, onChange }) {
  const hallazgos = valor || [];

  const anadir = () => {
    onChange([...hallazgos, { id: crypto.randomUUID(), categoria: CATEGORIAS_HALLAZGO[0], hallazgo: '', nivel: 'bajo', notas: '' }]);
  };
  const actualizar = (id, campo, v) => {
    onChange(hallazgos.map((h) => (h.id === id ? { ...h, [campo]: v } : h)));
  };
  const eliminar = (id) => onChange(hallazgos.filter((h) => h.id !== id));

  return (
    <div className="space-y-3">
      {hallazgos.length === 0 && <p className="text-sm text-stone-400">Sin hallazgos registrados todavía.</p>}
      {hallazgos.map((h) => (
        <div key={h.id} className="rounded-md border border-stone-200 p-3">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <CampoSelect label="Categoría" value={h.categoria} onChange={(v) => actualizar(h.id, 'categoria', v)} opciones={CATEGORIAS_HALLAZGO} />
            <CampoSelect label="Nivel" value={h.nivel} onChange={(v) => actualizar(h.id, 'nivel', v)} opciones={['bajo', 'medio', 'alto']} />
          </div>
          <Campo label="Hallazgo" value={h.hallazgo} onChange={(v) => actualizar(h.id, 'hallazgo', v)} className="mb-2" />
          <CampoTextarea label="Notas" value={h.notas} onChange={(v) => actualizar(h.id, 'notas', v)} />
          <button type="button" onClick={() => eliminar(h.id)} className="mt-2 text-xs text-red-600">Eliminar</button>
        </div>
      ))}
      <button type="button" onClick={anadir} className="w-full rounded-md border border-dashed border-stone-300 py-2 text-sm text-stone-500 hover:bg-stone-50">
        + Añadir hallazgo
      </button>
    </div>
  );
}

// ============================================================
// Paso 6 — Plan de mejora (verde, lista dinámica)
// ============================================================
function PlanMejora({ valor, onChange }) {
  const acciones = valor || [];

  const anadir = () => {
    onChange([...acciones, { id: crypto.randomUUID(), accion: '', prioridad: 'media', plazo: '', responsable: '' }]);
  };
  const actualizar = (id, campo, v) => {
    onChange(acciones.map((a) => (a.id === id ? { ...a, [campo]: v } : a)));
  };
  const eliminar = (id) => onChange(acciones.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      {acciones.length === 0 && <p className="text-sm text-stone-400">Sin acciones registradas todavía.</p>}
      {acciones.map((a) => (
        <div key={a.id} className="rounded-md border border-stone-200 p-3">
          <Campo label="Acción" value={a.accion} onChange={(v) => actualizar(a.id, 'accion', v)} className="mb-2" />
          <div className="grid grid-cols-3 gap-2">
            <CampoSelect label="Prioridad" value={a.prioridad} onChange={(v) => actualizar(a.id, 'prioridad', v)} opciones={['baja', 'media', 'alta']} />
            <Campo label="Plazo" value={a.plazo} onChange={(v) => actualizar(a.id, 'plazo', v)} placeholder="2 semanas…" />
            <Campo label="Responsable" value={a.responsable} onChange={(v) => actualizar(a.id, 'responsable', v)} />
          </div>
          <button type="button" onClick={() => eliminar(a.id)} className="mt-2 text-xs text-red-600">Eliminar</button>
        </div>
      ))}
      <button type="button" onClick={anadir} className="w-full rounded-md border border-dashed border-stone-300 py-2 text-sm text-stone-500 hover:bg-stone-50">
        + Añadir acción
      </button>
    </div>
  );
}

// ============================================================
// Paso 7 — Resumen y firma
// ============================================================
function ResumenYFirma({ resumen, firma, onChangeResumen, onChangeFirma, nivelRiesgo }) {
  return (
    <div className="space-y-4">
      <CampoTextarea label="Resumen ejecutivo" value={resumen.resumen_ejecutivo} onChange={(v) => onChangeResumen({ ...resumen, resumen_ejecutivo: v })} />
      {nivelRiesgo && (
        <p className="text-sm text-stone-600">
          Nivel de riesgo global: <strong style={{ color: COLOR_RIESGO[nivelRiesgo] }}>{nivelRiesgo}</strong>
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-4">
        <div>
          <p className="mb-2 text-xs font-medium text-stone-500">Firma del cliente</p>
          <Campo label="Nombre" value={firma.cliente_nombre} onChange={(v) => onChangeFirma({ ...firma, cliente_nombre: v })} className="mb-2" />
          <Campo label="Fecha" type="date" value={firma.cliente_fecha} onChange={(v) => onChangeFirma({ ...firma, cliente_fecha: v })} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-stone-500">Firma de Gescobit</p>
          <Campo label="Nombre" value={firma.gescobit_nombre} onChange={(v) => onChangeFirma({ ...firma, gescobit_nombre: v })} className="mb-2" />
          <Campo label="Fecha" type="date" value={firma.gescobit_fecha} onChange={(v) => onChangeFirma({ ...firma, gescobit_fecha: v })} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Modo Gescobit — asistente de 7 pasos
// ============================================================
function AsistenteGescobit() {
  const supabase = createClientComponentClient();
  const [auditoriaId, setAuditoriaId] = useState(null);
  const [datos, setDatos] = useState({
    datos_negocio: {}, alcance: {}, operativa: {}, seguridad: {},
    matriz_hallazgos: [], plan_mejora: [], resumen: {}, firma: {},
  });
  const [pasoActual, setPasoActual] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const [error, setError] = useState(null);

  // Crea el borrador en cuanto se entra a la herramienta.
  useEffect(() => {
    async function crearBorrador() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('auditorias')
        .insert({ created_by: user.id })
        .select()
        .single();

      if (error) { setError('No se pudo iniciar la auditoría.'); return; }
      setAuditoriaId(data.id);
    }
    crearBorrador();
  }, [supabase]);

  const guardarPaso = useCallback(async (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    if (!auditoriaId) return;
    setGuardando(true);

    const nivel_riesgo = campo === 'matriz_hallazgos' ? calcularNivelRiesgo(valor) : undefined;

    const { error } = await supabase
      .from('auditorias')
      .update({ [campo]: valor, ...(nivel_riesgo ? { nivel_riesgo } : {}) })
      .eq('id', auditoriaId);

    setGuardando(false);
    if (error) setError('No se pudo guardar el paso. Revisa tu conexión.');
  }, [auditoriaId, supabase]);

  const generarCodigoCliente = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch('/api/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditoriaId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCodigoGenerado(json.codigo);
    } catch (err) {
      setError(err.message || 'No se pudo generar el código.');
    } finally {
      setGuardando(false);
    }
  };

  const paso = PASOS[pasoActual];
  const nivelRiesgo = calcularNivelRiesgo(datos.matriz_hallazgos);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-800">Auditoría de seguridad</h1>
        <MedidorRiesgo hallazgos={datos.matriz_hallazgos} />
      </header>

      {/* Progreso */}
      <nav className="mb-6 flex gap-1.5">
        {PASOS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setPasoActual(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i === pasoActual ? 'bg-stone-800' : i < pasoActual ? 'bg-stone-400' : 'bg-stone-200'
            }`}
            aria-label={`Ir a paso ${p.titulo}`}
          />
        ))}
      </nav>
      <p className="mb-4 text-xs uppercase tracking-wide text-stone-400">
        Paso {pasoActual + 1} de {PASOS.length} · {paso.titulo}
        {paso.tipo === 'azul' && (
          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">Visible para el cliente</span>
        )}
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {codigoGenerado && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Código para el cliente: <strong className="tracking-widest">{codigoGenerado}</strong>
          {' '}— compártelo por WhatsApp. Caduca en 72h.
        </div>
      )}

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        {paso.id === 'datos_negocio' && (
          <CamposDatosNegocio valor={datos.datos_negocio} onChange={(v) => guardarPaso('datos_negocio', v)} />
        )}
        {paso.id === 'alcance' && (
          <CamposAlcance valor={datos.alcance} onChange={(v) => guardarPaso('alcance', v)} />
        )}
        {paso.id === 'operativa' && (
          <CamposOperativa valor={datos.operativa} onChange={(v) => guardarPaso('operativa', v)} />
        )}
        {paso.id === 'seguridad' && (
          <CamposSeguridad valor={datos.seguridad} onChange={(v) => guardarPaso('seguridad', v)} />
        )}
        {paso.id === 'matriz_hallazgos' && (
          <MatrizHallazgos valor={datos.matriz_hallazgos} onChange={(v) => guardarPaso('matriz_hallazgos', v)} />
        )}
        {paso.id === 'plan_mejora' && (
          <PlanMejora valor={datos.plan_mejora} onChange={(v) => guardarPaso('plan_mejora', v)} />
        )}
        {paso.id === 'resumen' && (
          <ResumenYFirma
            resumen={datos.resumen}
            firma={datos.firma}
            nivelRiesgo={nivelRiesgo}
            onChangeResumen={(v) => guardarPaso('resumen', v)}
            onChangeFirma={(v) => guardarPaso('firma', v)}
          />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setPasoActual((p) => Math.max(0, p - 1))}
          disabled={pasoActual === 0}
          className="rounded-md px-4 py-2 text-sm text-stone-500 disabled:opacity-30"
        >
          Anterior
        </button>

        <div className="flex items-center gap-3">
          {guardando && <span className="text-xs text-stone-400">Guardando…</span>}
          {pasoActual === 2 && !codigoGenerado && (
            <button
              onClick={generarCodigoCliente}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Generar código para el cliente
            </button>
          )}
          <button
            onClick={() => setPasoActual((p) => Math.min(PASOS.length - 1, p + 1))}
            disabled={pasoActual === PASOS.length - 1}
            className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Modo cliente — página única, entra con código de 6 caracteres
// ============================================================
function FormularioCliente() {
  const [codigo, setCodigo] = useState('');
  const [estado, setEstado] = useState('inicio'); // inicio | cargando | formulario | enviado | error
  const [errorMsg, setErrorMsg] = useState('');
  const [respuestas, setRespuestas] = useState({ datos_negocio: {}, operativa: {}, seguridad: {} });

  const entrarConCodigo = async () => {
    setEstado('cargando');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/auditoria/cliente?codigo=${encodeURIComponent(codigo)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRespuestas({
        datos_negocio: json.datos_negocio || {},
        operativa: json.operativa || {},
        seguridad: json.seguridad || {},
      });
      setEstado('formulario');
    } catch (err) {
      setErrorMsg(err.message || 'Código no válido.');
      setEstado('inicio');
    }
  };

  const enviar = async () => {
    setEstado('cargando');
    try {
      const res = await fetch('/api/auditoria/cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, ...respuestas }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEstado('enviado');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo enviar.');
      setEstado('formulario');
    }
  };

  if (estado === 'inicio' || estado === 'cargando') {
    return (
      <div className="mx-auto mt-24 max-w-sm px-6 text-center">
        <h1 className="mb-2 text-lg font-semibold text-stone-800">Cuestionario de auditoría</h1>
        <p className="mb-6 text-sm text-stone-500">Introduce el código de 6 caracteres que te ha enviado Gescobit.</p>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="AB12CD"
          className="mb-3 w-full rounded-md border border-stone-300 px-3 py-2 text-center text-lg tracking-widest"
        />
        {errorMsg && <p className="mb-3 text-sm text-red-600">{errorMsg}</p>}
        <button
          onClick={entrarConCodigo}
          disabled={codigo.length !== 6 || estado === 'cargando'}
          className="w-full rounded-md bg-stone-800 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {estado === 'cargando' ? 'Comprobando…' : 'Continuar'}
        </button>
      </div>
    );
  }

  if (estado === 'enviado') {
    return (
      <div className="mx-auto mt-24 max-w-sm px-6 text-center">
        <h1 className="mb-2 text-lg font-semibold text-stone-800">Gracias</h1>
        <p className="text-sm text-stone-500">Hemos recibido tus respuestas. Gescobit se pondrá en contacto contigo.</p>
      </div>
    );
  }

  // formulario — solo campos azules: datos_negocio, operativa, seguridad
  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-lg font-semibold text-stone-800">Cuestionario de auditoría</h1>
      {errorMsg && <p className="mb-3 text-sm text-red-600">{errorMsg}</p>}
      <div className="space-y-6">
        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-stone-700">Datos del negocio</h2>
          <CamposDatosNegocio
            valor={respuestas.datos_negocio}
            onChange={(v) => setRespuestas((prev) => ({ ...prev, datos_negocio: v }))}
          />
        </section>
        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-stone-700">Situación operativa</h2>
          <CamposOperativa
            valor={respuestas.operativa}
            onChange={(v) => setRespuestas((prev) => ({ ...prev, operativa: v }))}
          />
        </section>
        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-stone-700">Situación de seguridad</h2>
          <CamposSeguridad
            valor={respuestas.seguridad}
            onChange={(v) => setRespuestas((prev) => ({ ...prev, seguridad: v }))}
          />
        </section>
      </div>
      <button
        onClick={enviar}
        disabled={estado === 'cargando'}
        className="mt-6 w-full rounded-md bg-stone-800 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {estado === 'cargando' ? 'Enviando…' : 'Enviar respuestas'}
      </button>
    </div>
  );
}

// ============================================================
// Punto de entrada — decide el modo según si hay ?codigo_inicial= en la URL
// ============================================================
export default function AuditoriaSeguridadTGH() {
  const esModoCliente = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('codigo_inicial');
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {esModoCliente ? <FormularioCliente /> : <AsistenteGescobit />}
    </div>
  );
}
