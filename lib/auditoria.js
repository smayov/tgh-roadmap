// lib/auditoria.js
// Lógica de negocio del módulo de Auditoría de Seguridad (Gescobit, interno).
// Mismo patrón que lib/fichaje.js: helpers puros + acceso a Supabase con
// service role para las operaciones que no requieren sesión (modo cliente).

import { createClient } from '@supabase/supabase-js';

// Cliente con clave de administrador — SOLO se usa en rutas de servidor
// (app/api/...), nunca se expone al navegador.
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0/I/1 para evitar confusión al leerlo por WhatsApp

export function generarCodigoCliente() {
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return codigo;
}

// Genera un código y comprueba que no colisiona con uno ya activo.
// Reintenta unas pocas veces antes de rendirse (colisión extremadamente rara con 6 chars).
export async function generarCodigoUnico() {
  const admin = supabaseAdmin();
  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigoCliente();
    const { data } = await admin
      .from('auditorias')
      .select('id')
      .eq('codigo_cliente', codigo)
      .maybeSingle();
    if (!data) return codigo;
  }
  throw new Error('No se pudo generar un código único, inténtalo de nuevo.');
}

// Busca una auditoría por código para el modo cliente.
// Devuelve solo los campos "azules" que el cliente puede ver/editar.
export async function obtenerAuditoriaPorCodigo(codigo) {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('auditorias')
    .select('id, estado, codigo_expira_en, datos_negocio, operativa, seguridad')
    .eq('codigo_cliente', codigo)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.codigo_expira_en && new Date(data.codigo_expira_en) < new Date()) {
    return { expirado: true };
  }

  return data;
}

// Guarda las respuestas del cliente (solo campos azules) y marca el estado.
export async function guardarRespuestaCliente(codigo, { datos_negocio, operativa, seguridad }) {
  const admin = supabaseAdmin();

  const actual = await obtenerAuditoriaPorCodigo(codigo);
  if (!actual || actual.expirado) {
    throw new Error('Código no válido o caducado.');
  }

  const { data, error } = await admin
    .from('auditorias')
    .update({
      datos_negocio,
      operativa,
      seguridad,
      estado: 'cliente_completado',
      cliente_completado_en: new Date().toISOString(),
    })
    .eq('codigo_cliente', codigo)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Cálculo del nivel de riesgo a partir de la matriz de hallazgos ---
// Regla simple y transparente: el nivel más alto presente domina,
// salvo que haya varios "medio" sin ningún "alto", en cuyo caso también sube a alto.
const PESO = { alto: 3, medio: 2, bajo: 1 };

export function calcularNivelRiesgo(matrizHallazgos = []) {
  if (!matrizHallazgos.length) return null;

  const conteo = { alto: 0, medio: 0, bajo: 0 };
  for (const h of matrizHallazgos) {
    if (conteo[h.nivel] !== undefined) conteo[h.nivel]++;
  }

  if (conteo.alto > 0) return 'alto';
  if (conteo.medio >= 3) return 'alto'; // varios hallazgos medios acumulan riesgo
  if (conteo.medio > 0) return 'medio';
  return 'bajo';
}

// Puntuación 0-100 para el medidor visual en vivo (no solo la etiqueta).
export function calcularPuntuacionRiesgo(matrizHallazgos = []) {
  if (!matrizHallazgos.length) return 0;
  const total = matrizHallazgos.reduce((sum, h) => sum + (PESO[h.nivel] || 0), 0);
  const maximoPosible = matrizHallazgos.length * PESO.alto;
  return Math.round((total / maximoPosible) * 100);
}
