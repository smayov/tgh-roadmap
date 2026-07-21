import { createClient } from '@supabase/supabase-js';
import { enviarAvisoStockNegocio } from '../../../../lib/avisos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { negocio_id } = await req.json();
    if (!negocio_id) {
      return new Response(JSON.stringify({ error: 'Falta negocio_id' }), { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const resultado = await enviarAvisoStockNegocio(supabaseAdmin, negocio_id);

    if (resultado.error) {
      return new Response(JSON.stringify({ error: resultado.error }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true, ...resultado }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
