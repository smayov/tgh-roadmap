// app/api/auditoria/route.js
// Guarda la auditoría completa (los 8 pasos) rellenada por Gescobit.
// El cliente envía su token de sesión en Authorization: Bearer <token>.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guardarAuditoria } from '@/lib/auditoria';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// POST /api/auditoria
// headers: Authorization: Bearer <access_token de la sesión del usuario>
// body: { auditoriaId?, datos, alcance, accesos, datosRgpd, hallazgos, estimacion, plan, resumen }
// auditoriaId es opcional: si no se manda, se crea una auditoría nueva.
export async function POST(request) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  try {
    const auditoria = await guardarAuditoria(user.id, body.auditoriaId, body);
    return NextResponse.json(auditoria);
  } catch (err) {
    console.error('[auditoria][guardar]', err);
    return NextResponse.json({ error: 'No se pudo guardar la auditoría.' }, { status: 500 });
  }
}