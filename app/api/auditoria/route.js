// app/api/auditoria/route.js
// Uso de Gescobit (autenticado). RLS se encarga de que cada uno solo
// vea/edite sus propias auditorías — aquí no hace falta service role.

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generarCodigoUnico } from '@/lib/auditoria';

// POST /api/auditoria/generar-codigo
// body: { auditoriaId, horasValidez? } — por defecto 72h
export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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

    const { data, error } = await supabase
      .from('auditorias')
      .update({
        codigo_cliente: codigo,
        codigo_expira_en: expira,
        estado: 'enviado_cliente',
      })
      .eq('id', body.auditoriaId)
      .eq('created_by', user.id) // redundante con RLS, pero explícito
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ codigo: data.codigo_cliente, expira: data.codigo_expira_en });
  } catch (err) {
    console.error('[auditoria][generar-codigo]', err);
    return NextResponse.json({ error: 'No se pudo generar el código.' }, { status: 500 });
  }
}
