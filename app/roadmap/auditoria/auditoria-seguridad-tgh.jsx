'use client';

import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { descargarAuditoriaPDF } from '../../../lib/pdfAuditoria';
import { calcularRiesgo } from '../../../lib/riesgoAuditoria';




/**
 * Auditoría de Seguridad — Gescobit
 * Enfoque: seguridad de software y aplicaciones del negocio, con paso de
 * estimación para que sirva de base a la propuesta comercial.
 *
 * Cada paso lleva una etiqueta CLIENTE (lo rellena el cliente vía código
 * de 6 caracteres, modo cliente) o GESCOBIT (lo rellena el auditor).
 *
 * 8 pasos:
 *  1. Datos del negocio           — CLIENTE
 *  2. Alcance / sistemas          — CLIENTE
 *  3. Accesos y credenciales      — GESCOBIT
 *  4. Datos y RGPD digital        — GESCOBIT
 *  5. Matriz de hallazgos         — GESCOBIT
 *  6. Estimación de la solución   — GESCOBIT (nuevo)
 *  7. Plan de mejora / propuesta  — GESCOBIT
 *  8. Resumen y firma             — GESCOBIT
 */


const STEPS = [
  { label: 'Datos', owner: 'cliente' },
  { label: 'Alcance', owner: 'cliente' },
  { label: 'Accesos', owner: 'gescobit' },
  { label: 'Datos y RGPD', owner: 'gescobit' },
  { label: 'Hallazgos', owner: 'gescobit' },
  { label: 'Estimación', owner: 'gescobit' },
  { label: 'Plan de mejora', owner: 'gescobit' },
  { label: 'Resumen', owner: 'gescobit' },
];

const SISTEMAS_OPCIONES = [
  'TPV / caja registradora',
  'Software de gestión (ERP/back office)',
  'Reservas online',
  'Contabilidad / facturación',
  'Wifi y red del local',
  'Correo y ofimática',
];

const ACCESOS_ITEMS = [
  { key: 'contrasenas_unicas', label: '¿Cada empleado tiene su propio usuario y contraseña (no compartidos)?', riesgo: 'Sin usuarios individuales, no se puede identificar quién hizo qué ante un error o fuga, y revocar el acceso de una persona obliga a cambiar la contraseña de todos.' },
  { key: 'politica_contrasenas', label: '¿Existe una política mínima de contraseñas (longitud, cambio periódico)?', riesgo: 'Las contraseñas débiles o nunca renovadas son la puerta de entrada más común en ataques de fuerza bruta o tras una filtración de datos.' },
  { key: 'doble_factor', label: '¿Los accesos críticos (banca, gestión, email) tienen doble factor (2FA)?', riesgo: 'Si la contraseña se filtra o se roba (phishing), no hay ninguna barrera adicional que impida el acceso al atacante.' },
  { key: 'permisos_por_rol', label: '¿Los permisos están limitados por rol (no todos ven/editan todo)?', riesgo: 'Cualquier empleado puede ver o modificar datos que no le corresponden, ampliando el daño posible de un error humano o una cuenta comprometida.' },
  { key: 'baja_accesos', label: '¿Se revocan los accesos cuando un empleado deja el puesto?', riesgo: 'Un ex-empleado puede seguir entrando a los sistemas del negocio después de marcharse, sin que nadie lo note.' },
  { key: 'logs_acceso', label: '¿El TPV/software de gestión registra logs de acceso (usuario, fecha, acción)?', riesgo: 'Ante un incidente de seguridad, no hay forma de reconstruir qué pasó, quién lo hizo ni cuándo.' },
  { key: 'logs_retencion', label: '¿Se conservan esos logs durante un período definido?', riesgo: 'Aunque existan registros, si se borran demasiado pronto no sirven para investigar incidentes detectados con retraso.' },
  { key: 'logs_rgpd', label: '¿Hay registro de accesos a datos de clientes diferenciado del log general?', riesgo: 'No se puede demostrar ante una inspección o reclamación quién accedió a los datos personales de un cliente concreto.' },
  { key: 'logs_consulta', label: '¿Está definido quién puede consultar esos logs si hace falta investigar algo?', riesgo: 'Sin un responsable claro, los registros existen pero nadie los revisa ni actúa cuando hay algo anómalo.' },
];

const DATOS_RGPD_ITEMS = [
  { key: 'copias_seguridad', label: '¿Existen copias de seguridad periódicas de los datos del negocio?', riesgo: 'Un fallo técnico, un ataque de ransomware o un borrado accidental puede hacer perder para siempre los datos del negocio (reservas, contabilidad, clientes).' },
  { key: 'copias_cifradas', label: '¿Esas copias están cifradas o en un proveedor con garantías (nube reconocida)?', riesgo: 'Si las copias caen en manos equivocadas (robo del disco, acceso no autorizado), los datos quedan expuestos igualmente aunque exista backup.' },
  { key: 'alojamiento_datos', label: '¿Se sabe dónde se alojan los datos (servidor propio, nube, proveedor del software)?', riesgo: 'Sin saber dónde están los datos, es imposible garantizar su seguridad o responder correctamente ante una inspección o un cliente que ejerza sus derechos RGPD.' },
  { key: 'consentimiento_web', label: '¿La web/app de reservas pide consentimiento explícito para tratar datos del cliente?', riesgo: 'Recoger datos personales sin consentimiento explícito es una infracción directa del RGPD, sancionable por la AEPD.' },
  { key: 'politica_privacidad', label: '¿Existe política de privacidad visible y actualizada?', riesgo: 'Es una obligación legal básica del RGPD; su ausencia es de las primeras cosas que revisa la AEPD ante cualquier reclamación.' },
];

const NIVEL_RIESGO = { alto: 3, medio: 2, bajo: 1 };

function OwnerBadge({ owner }) {
  const isCliente = owner === 'cliente';
  return (
    <span
      className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
        isCliente ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {isCliente ? 'Lo rellena el cliente' : 'Lo completa Gescobit'}
    </span>
  );
}

function StepProgress({ step }) {
  return (
    <div className="flex gap-2 mb-2">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-neutral-900' : 'bg-neutral-200'}`}
        />
      ))}
    </div>
  );
}

function RiskMeter({ accesos, datosRgpd }) {
  const { score, label, color } = calcularRiesgo({ accesos, datosRgpd, ACCESOS_ITEMS, DATOS_RGPD_ITEMS });

  return (
    <div className="border border-neutral-200 rounded-2xl p-5 flex items-center gap-4 bg-white">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" stroke="#e5e0d8" strokeWidth="6" fill="none" />
          <circle
            cx="32" cy="32" r="26" stroke={color} strokeWidth="6" fill="none"
            strokeDasharray={2 * Math.PI * 26}
            strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(score / 10, 1))}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-lg font-semibold">{score}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-neutral-500 uppercase whitespace-nowrap">Nivel de riesgo</p>
        <p className="font-semibold text-neutral-800 whitespace-nowrap" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-3 rounded-full text-base border transition ${
        selected
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'bg-neutral-100 text-neutral-800 border-transparent hover:bg-neutral-200'
      }`}
    >
      {label}
    </button>
  );
}

function YesNoRow({ label, value, onChange, riesgo }) {
  const opciones = [
    { key: 'si', label: 'Sí' },
    { key: 'no', label: 'No' },
    { key: 'no_se', label: 'No lo sé' },
  ];
  return (
    <div className="py-3 border-b border-neutral-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <p className="text-sm text-neutral-700 min-w-0">{label}</p>
        <div className="flex flex-wrap gap-2 shrink-0">
          {opciones.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                value === opt.key
                  ? opt.key === 'si'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : opt.key === 'no'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-neutral-500 border-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {value === 'no' && riesgo && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ {riesgo}</p>
      )}
    </div>
  );
}

export default function AuditoriaSeguridadTGH() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [copied, setCopied] = useState(false);
 


  // CLIENTE
  const [datos, setDatos] = useState({ nombre: '', tipo: '', direccion: '', empleados: '', contacto: '' });
  const [alcance, setAlcance] = useState({
    sistemas: [],
    sistemasDetalle: '',
    numDispositivos: '',
    numEmpleadosConAcceso: '',
    incidentePrevio: '',
  });

  // GESCOBIT
  const [accesos, setAccesos] = useState({});
  const [datosRgpd, setDatosRgpd] = useState({});
  const [hallazgos, setHallazgos] = useState([]);
  const [estimacion, setEstimacion] = useState([]);
  const [plan, setPlan] = useState([]);
  const [resumen, setResumen] = useState({ resumenEjecutivo: '', firmaCliente: '', firmaGescobit: '' });

  const toggleSistema = (s) => {
    setAlcance((prev) => ({
      ...prev,
      sistemas: prev.sistemas.includes(s) ? prev.sistemas.filter((x) => x !== s) : [...prev.sistemas, s],
    }));
  };

  const addHallazgo = () => {
    setHallazgos((h) => [...h, { id: crypto.randomUUID(), area: '', descripcion: '', nivel: 'medio' }]);
  };

  const updateHallazgo = (id, field, value) => {
    setHallazgos((h) => h.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeHallazgo = (id) => {
    setHallazgos((h) => h.filter((item) => item.id !== id));
  };

  const addEstimacionItem = () => {
    setEstimacion((e) => [
      ...e,
      { id: crypto.randomUUID(), hallazgoRelacionado: '', solucionPropuesta: '', horas: '', precio: '', tipoPago: 'unico' },
    ]);
  };

  const updateEstimacionItem = (id, field, value) => {
    setEstimacion((e) => e.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeEstimacionItem = (id) => {
    setEstimacion((e) => e.filter((item) => item.id !== id));
  };

  const addPlanItem = () => {
    setPlan((p) => [...p, { id: crypto.randomUUID(), accion: '', prioridad: 'media', responsable: '' }]);
  };

  const updatePlanItem = (id, field, value) => {
    setPlan((p) => p.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removePlanItem = (id) => {
    setPlan((p) => p.filter((item) => item.id !== id));
  };

  const totalEstimado = estimacion.reduce((acc, e) => acc + (parseFloat(e.precio) || 0), 0);

  const construirResumenTexto = () => {
    const lineas = [];
    lineas.push(`AUDITORÍA DE SEGURIDAD — ${datos.nombre || 'sin nombre'}`);
    lineas.push('');
    lineas.push('-- Datos del negocio --');
    lineas.push(`Nombre: ${datos.nombre}\nTipo de negocio: ${datos.tipo}\nDirección: ${datos.direccion}\nEmpleados: ${datos.empleados}\nPersona de contacto: ${datos.contacto}`);
    lineas.push('');
    lineas.push('-- Alcance / sistemas --');
    lineas.push(`Sistemas marcados: ${alcance.sistemas.join(', ') || '—'}`);
    lineas.push(`Detalle sistemas: ${alcance.sistemasDetalle || '—'}`);
    lineas.push(`Dispositivos: ${alcance.numDispositivos} · Empleados con acceso: ${alcance.numEmpleadosConAcceso}`);
    lineas.push(`Incidente previo: ${alcance.incidentePrevio || '—'}`);
    lineas.push('');
    lineas.push('-- Accesos y credenciales --');
    ACCESOS_ITEMS.forEach((i) => lineas.push(`${i.label} ${accesos[i.key] === 'si' ? 'Sí' : accesos[i.key] === 'no' ? 'No' : accesos[i.key] === 'no_se' ? 'No lo sé' : '(sin responder)'}`));
    lineas.push('');
    lineas.push('-- Datos y RGPD --');
    DATOS_RGPD_ITEMS.forEach((i) => lineas.push(`${i.label} ${datosRgpd[i.key] === 'si' ? 'Sí' : datosRgpd[i.key] === 'no' ? 'No' : datosRgpd[i.key] === 'no_se' ? 'No lo sé' : '(sin responder)'}`));
    lineas.push('');
    lineas.push('-- Hallazgos --');
    if (hallazgos.length === 0) lineas.push('(ninguno)');
    hallazgos.forEach((h) => lineas.push(`[${h.nivel}] ${h.area}: ${h.descripcion}`));
    lineas.push('');
    lineas.push('-- Estimación de la solución --');
    if (estimacion.length === 0) lineas.push('(ninguna)');
    estimacion.forEach((e) => lineas.push(`${e.hallazgoRelacionado} → ${e.solucionPropuesta} · ${e.horas}h · ${e.precio}€ · ${e.tipoPago}`));
    lineas.push(`TOTAL ESTIMADO: ${totalEstimado.toLocaleString('es-ES')} €`);
    lineas.push('');
    lineas.push('-- Plan de mejora --');
    if (plan.length === 0) lineas.push('(ninguno)');
    plan.forEach((p) => lineas.push(`${p.accion} — responsable: ${p.responsable}`));
    lineas.push('');
    lineas.push('-- Resumen ejecutivo --');
    lineas.push(resumen.resumenEjecutivo || '—');
    return lineas.join('\n');
  };

  const copiarResumen = async () => {
    try {
      await navigator.clipboard.writeText(construirResumenTexto());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const guardar = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/auditoria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ datos, alcance, accesos, datosRgpd, hallazgos, estimacion, plan, resumen }),
      });
      if (!res.ok) throw new Error('No se pudo guardar la auditoría');
    } catch (e) {
      console.error(e);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Auditoría de<br />seguridad</h1>
        <RiskMeter accesos={accesos} datosRgpd={datosRgpd} />
      </div>

      <StepProgress step={step} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs tracking-wide text-neutral-400 uppercase min-w-0 truncate">
          Paso {step + 1} de {STEPS.length} · {STEPS[step].label}
        </p>
        <span className="shrink-0"><OwnerBadge owner={STEPS[step].owner} /></span>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-neutral-800">Datos del negocio</h2>
            {[
              ['nombre', 'Nombre del negocio'],
              ['tipo', 'Tipo de negocio'],
              ['direccion', 'Dirección'],
              ['empleados', 'Nº de empleados'],
              ['contacto', 'Persona de contacto'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-sm text-neutral-600">{label}</label>
                <input
                  className="mt-1 w-full min-w-0 border border-neutral-300 rounded-xl px-3 py-2"
                  value={datos[key]}
                  onChange={(e) => setDatos({ ...datos, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-neutral-800 mb-1">Sistemas que usáis hoy</h2>
              <p className="text-sm text-neutral-500 mb-4">Marca los que uséis y, si sabéis el nombre concreto (ej. "Square", "Holded"), anotadlo abajo.</p>
              <div className="flex flex-wrap gap-3">
                {SISTEMAS_OPCIONES.map((s) => (
                  <Chip key={s} label={s} selected={alcance.sistemas.includes(s)} onClick={() => toggleSistema(s)} />
                ))}
              </div>
              <textarea
                placeholder="Nombre de los sistemas concretos (uno por línea)"
                className="mt-3 w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                rows={3}
                value={alcance.sistemasDetalle}
                onChange={(e) => setAlcance({ ...alcance, sistemasDetalle: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-neutral-600">Nº de dispositivos con acceso</label>
                <input
                  className="mt-1 w-full min-w-0 border border-neutral-300 rounded-xl px-3 py-2"
                  value={alcance.numDispositivos}
                  onChange={(e) => setAlcance({ ...alcance, numDispositivos: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">Nº de empleados con acceso</label>
                <input
                  className="mt-1 w-full min-w-0 border border-neutral-300 rounded-xl px-3 py-2"
                  value={alcance.numEmpleadosConAcceso}
                  onChange={(e) => setAlcance({ ...alcance, numEmpleadosConAcceso: e.target.value })}
                />
              </div>
            </div>

            <YesNoRow
              label="¿Habéis tenido algún incidente de seguridad antes (hackeo, robo de datos, ransomware, suplantación)?"
              value={alcance.incidentePrevio}
              onChange={(v) => setAlcance({ ...alcance, incidentePrevio: v })}
            />      
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-medium text-neutral-800 mb-2">Accesos y credenciales</h2>
            <p className="text-sm text-neutral-500 mb-4">Cómo se gestionan usuarios, contraseñas y permisos en el software del negocio.</p>
       {ACCESOS_ITEMS.map((item) => (
         <YesNoRow
    key={item.key}
    label={item.label}
    value={accesos[item.key]}
    onChange={(v) => setAccesos({ ...accesos, [item.key]: v })}
    riesgo={item.riesgo}
         />
        ))}
          </div>
        )}
         {step === 3 && (
          <div>
            <h2 className="text-lg font-medium text-neutral-800 mb-2">Datos, copias de seguridad y RGPD</h2>
            <p className="text-sm text-neutral-500 mb-4">Dónde y cómo se guardan los datos del negocio y de sus clientes.</p>
            {DATOS_RGPD_ITEMS.map((item) => (
              <YesNoRow
                key={item.key}
                label={item.label}
                value={datosRgpd[item.key]}
                onChange={(v) => setDatosRgpd({ ...datosRgpd, [item.key]: v })}
                riesgo={item.riesgo}
              />
            ))}
          </div>
         )}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-800">Matriz de hallazgos</h2>
              <button onClick={addHallazgo} className="text-sm px-3 py-1.5 rounded-full bg-neutral-900 text-white">
                + Añadir hallazgo
              </button>
            </div>
            {hallazgos.length === 0 && <p className="text-sm text-neutral-400">Aún no hay hallazgos registrados.</p>}
            {hallazgos.map((h) => (
              <div key={h.id} className="border border-neutral-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    placeholder="Área (ej. software de gestión, accesos, backups...)"
                    className="flex-1 min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={h.area}
                    onChange={(e) => updateHallazgo(h.id, 'area', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeHallazgo(h.id)}
                    className="shrink-0 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    aria-label="Eliminar hallazgo"
                  >
                    Eliminar
                  </button>
                </div>
                <textarea
                  placeholder="Descripción del hallazgo"
                  className="w-full min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                  value={h.descripcion}
                  onChange={(e) => updateHallazgo(h.id, 'descripcion', e.target.value)}
                />
                <div className="flex gap-2">
                  {['bajo', 'medio', 'alto'].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateHallazgo(h.id, 'nivel', n)}
                      className={`px-3 py-1 rounded-full text-xs border capitalize ${
                        h.nivel === n ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-500 border-neutral-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-800">Estimación de la solución</h2>
              <button onClick={addEstimacionItem} className="text-sm px-3 py-1.5 rounded-full bg-neutral-900 text-white">
                + Añadir partida
              </button>
            </div>
            <p className="text-sm text-neutral-500">Por cada hallazgo relevante, qué se propone implementar, cuánto cuesta y si es pago único o mantenimiento.</p>

            {hallazgos.length > 0 && (
              <div className="text-xs text-neutral-400">
                Hallazgos disponibles: {hallazgos.map((h) => h.area || 'sin nombre').join(' · ')}
              </div>
            )}

            {estimacion.length === 0 && <p className="text-sm text-neutral-400">Aún no hay partidas de estimación.</p>}
            {estimacion.map((e) => (
              <div key={e.id} className="border border-neutral-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    placeholder="Hallazgo relacionado"
                    className="flex-1 min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={e.hallazgoRelacionado}
                    onChange={(ev) => updateEstimacionItem(e.id, 'hallazgoRelacionado', ev.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeEstimacionItem(e.id)}
                    className="shrink-0 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    aria-label="Eliminar partida"
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  placeholder="Solución propuesta (ej. gestor de contraseñas + 2FA en correo)"
                  className="w-full min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                  value={e.solucionPropuesta}
                  onChange={(ev) => updateEstimacionItem(e.id, 'solucionPropuesta', ev.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    placeholder="Horas"
                    className="w-full min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={e.horas}
                    onChange={(ev) => updateEstimacionItem(e.id, 'horas', ev.target.value)}
                  />
                  <input
                    placeholder="Precio (€)"
                    className="w-full min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={e.precio}
                    onChange={(ev) => updateEstimacionItem(e.id, 'precio', ev.target.value)}
                  />
                  <select
                    className="w-full min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={e.tipoPago}
                    onChange={(ev) => updateEstimacionItem(e.id, 'tipoPago', ev.target.value)}
                  >
                    <option value="unico">Pago único</option>
                    <option value="recurrente">Recurrente</option>
                  </select>
                </div>
              </div>
            ))}

            {estimacion.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                <span className="text-sm text-neutral-500">Total estimado</span>
                <span className="text-lg font-semibold text-neutral-900">{totalEstimado.toLocaleString('es-ES')} €</span>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-neutral-800">Plan de mejora / propuesta comercial</h2>
              <button onClick={addPlanItem} className="text-sm px-3 py-1.5 rounded-full bg-neutral-900 text-white">
                + Añadir acción
              </button>
            </div>
            {plan.length === 0 && <p className="text-sm text-neutral-400">Aún no hay acciones registradas.</p>}
            {plan.map((p) => (
              <div key={p.id} className="border border-neutral-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    placeholder="Acción recomendada (ej. activar 2FA en el correo)"
                    className="flex-1 min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                    value={p.accion}
                    onChange={(e) => updatePlanItem(p.id, 'accion', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removePlanItem(p.id)}
                    className="shrink-0 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    aria-label="Eliminar acción"
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  placeholder="Responsable"
                  className="w-full min-w-0 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                  value={p.responsable}
                  onChange={(e) => updatePlanItem(p.id, 'responsable', e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-neutral-800">Resumen y firma</h2>
            <textarea
              placeholder="Resumen ejecutivo"
              className="w-full min-w-0 border border-neutral-300 rounded-xl px-3 py-2 text-sm"
              rows={4}
              value={resumen.resumenEjecutivo}
              onChange={(e) => setResumen({ ...resumen, resumenEjecutivo: e.target.value })}
            />
            {estimacion.length > 0 && (
              <div className="bg-neutral-50 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm text-neutral-600">Presupuesto total de la propuesta</span>
                <span className="text-lg font-semibold text-neutral-900">{totalEstimado.toLocaleString('es-ES')} €</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                placeholder="Firma del cliente"
                className="w-full min-w-0 border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                value={resumen.firmaCliente}
                onChange={(e) => setResumen({ ...resumen, firmaCliente: e.target.value })}
              />
              <input
                placeholder="Firma Gescobit"
                className="w-full min-w-0 border border-neutral-300 rounded-xl px-3 py-2 text-sm"
                value={resumen.firmaGescobit}
                onChange={(e) => setResumen({ ...resumen, firmaGescobit: e.target.value })}
              />
            </div>
            
                      <div className="flex gap-3">
              <button onClick={guardar} disabled={saving} className="flex-1 py-3 rounded-xl bg-neutral-900 text-white font-medium disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar auditoría'}
              </button>
              <button onClick={copiarResumen} className="px-4 py-3 rounded-xl border border-neutral-300 text-neutral-700 font-medium">
                {copied ? 'Copiado ✓' : 'Copiar resumen'}
              </button>
              <button
                onClick={() => descargarAuditoriaPDF({ datos, alcance, accesos, datosRgpd, hallazgos, estimacion, plan, resumen, ACCESOS_ITEMS, DATOS_RGPD_ITEMS, totalEstimado })}
                className="px-4 py-3 rounded-xl border border-neutral-300 text-neutral-700 font-medium"
              >
                Descargar PDF
              </button>
            </div>
            {saveError && (
              <p className="text-sm text-red-600">
                No se pudo guardar en el servidor. Usa "Copiar resumen" para no perder los datos y guárdalos aparte.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="text-neutral-500 disabled:opacity-30"
        >
          Anterior
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
