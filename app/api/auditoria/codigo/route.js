// app/api/auditoria/route.js
// Uso de Gescobit (autenticado). El cliente envía su token de sesión en
// Authorization: Bearer <token>; lo validamos con el cliente de servicio
// y luego filtramos explícitamente por created_by, ya que este cliente
// admin salta RLS (mismo patrón que lib/auditoria.js).

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generarCodigoUnico } from '@/lib/auditoria';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// POST /api/auditoria
// headers: Authorization: Bearer <access_token de la sesión del usuario>
// body: { auditoriaId, horasValidez? } — por defecto 72h
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
  if (!body?.auditoriaId) {
    return NextResponse.json({ error: 'Falta el id de la auditoría.' }, { status: 400 });
  }

  const horasValidez = body.horasValidez || 72;

  try {
    const codigo = await generarCodigoUnico();
    const expira = new Date(Date.now() + horasValidez * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from('auditorias')
      .update({
        codigo_cliente: codigo,
        codigo_expira_en: expira,
        estado: 'enviado_cliente',
      })
      .eq('id', body.auditoriaId)
      .eq('created_by', user.id) // clave: el cliente admin salta RLS, así que hay que comprobar la propiedad a mano
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ codigo: data.codigo_cliente, expira: data.codigo_expira_en });
  } catch (err) {
    console.error('[auditoria][generar-codigo]', err);
    return NextResponse.json({ error: 'No se pudo generar el código.' }, { status: 500 });
  }
}
