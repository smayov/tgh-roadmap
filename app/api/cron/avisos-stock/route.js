import { createClient } from '@supabase/supabase-js';
import { enviarAvisoStockNegocio } from '../../../../lib/avisos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  const secretoServidor = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${secretoServidor}`) {
    // DIAGNÓSTICO TEMPORAL: no revela el valor, solo si existe y su longitud
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      diagnostico: {
        secreto_configurado_en_servidor: !!secretoServidor,
        longitud_secreto_servidor: secretoServidor ? secretoServidor.length : 0,
        cabecera_recibida_existe: !!authHeader,
        longitud_cabecera_recibida: authHeader ? authHeader.length : 0,
      }
    }), { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: configuraciones, error } = await supabaseAdmin
    .from('configuracion_avisos')
    .select('negocio_id')
    .eq('email_activo', true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const resultados = [];
  for (const config of configuraciones || []) {
    const resultado = await enviarAvisoStockNegocio(supabaseAdmin, config.negocio_id);
    resultados.push({ negocio_id: config.negocio_id, ...resultado });
  }

  const enviados = resultados.filter((r) => r.enviado).length;

  return new Response(
    JSON.stringify({ ok: true, negocios_revisados: resultados.length, emails_enviados: enviados, detalle: resultados }),
    { status: 200 }
  );
}