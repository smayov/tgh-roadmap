import { createClient } from '@supabase/supabase-js';
import { enviarAvisoStockNegocio } from '../../../../lib/avisos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  // Solo Vercel (con el CRON_SECRET correcto) puede ejecutar esto
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Todos los negocios con el email de avisos activado
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
