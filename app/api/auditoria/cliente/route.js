// app/api/auditoria/cliente/route.js
// Modo cliente: sin sesión de Supabase. El cliente entra con el código de
// 6 caracteres recibido por WhatsApp y solo ve/edita los campos "azules".
// Mismo patrón que app/api/fichar/route.js (clave de administrador en servidor).

import { NextResponse } from 'next/server';
import { obtenerAuditoriaPorCodigo, guardarRespuestaCliente } from '@/lib/auditoria';

// GET /api/auditoria/cliente?codigo=AB12CD
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const codigo = (searchParams.get('codigo') || '').trim().toUpperCase();

  if (!codigo || codigo.length !== 6) {
    return NextResponse.json({ error: 'Código no válido.' }, { status: 400 });
  }

  try {
    const auditoria = await obtenerAuditoriaPorCodigo(codigo);

    if (!auditoria) {
      return NextResponse.json({ error: 'No existe ninguna auditoría con ese código.' }, { status: 404 });
    }
    if (auditoria.expirado) {
      return NextResponse.json({ error: 'Este código ha caducado. Pide uno nuevo a Gescobit.' }, { status: 410 });
    }
    if (auditoria.estado === 'cliente_completado' || auditoria.estado === 'completado') {
      return NextResponse.json({ error: 'Este cuestionario ya se ha enviado.' }, { status: 409 });
    }

    // Solo los campos azules — nunca se expone alcance, hallazgos, plan de mejora, etc.
    return NextResponse.json({
      datos_negocio: auditoria.datos_negocio,
      operativa: auditoria.operativa,
      seguridad: auditoria.seguridad,
    });
  } catch (err) {
    console.error('[auditoria/cliente][GET]', err);
    return NextResponse.json({ error: 'Error al cargar el cuestionario.' }, { status: 500 });
  }
}

// POST /api/auditoria/cliente
// body: { codigo, datos_negocio, operativa, seguridad }
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }

  const codigo = (body.codigo || '').trim().toUpperCase();
  const { datos_negocio, operativa, seguridad } = body;

  if (!codigo || codigo.length !== 6) {
    return NextResponse.json({ error: 'Código no válido.' }, { status: 400 });
  }
  if (!datos_negocio || !operativa || !seguridad) {
    return NextResponse.json({ error: 'Faltan campos por completar.' }, { status: 400 });
  }

  try {
    const actualizado = await guardarRespuestaCliente(codigo, { datos_negocio, operativa, seguridad });
    return NextResponse.json({ ok: true, estado: actualizado.estado });
  } catch (err) {
    console.error('[auditoria/cliente][POST]', err);
    return NextResponse.json({ error: err.message || 'Error al guardar el cuestionario.' }, { status: 500 });
  }
}
