import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calcularTotales,
  generarHuella,
  normalizarLineas,
  validarCliente,
} from '@/lib/verifactu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function obtenerContexto(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { error: 'No autenticado.', status: 401 };

  const admin = supabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return { error: 'No autenticado.', status: 401 };

  const { data: negocio, error: negocioError } = await admin
    .from('negocios')
    .select('id, nombre')
    .eq('propietario', user.id)
    .maybeSingle();

  if (negocioError) throw negocioError;
  if (!negocio) return { error: 'No hay un negocio asociado a esta cuenta.', status: 404 };

  const { data: modulo, error: moduloError } = await admin
    .from('modulos_activos')
    .select('modulo')
    .eq('negocio_id', negocio.id)
    .eq('modulo', 'verifactu')
    .eq('estado', 'activo')
    .maybeSingle();

  if (moduloError) throw moduloError;
  if (!modulo) return { error: 'El módulo VeriFactu no está activo.', status: 403 };

  return { admin, user, negocio };
}

export async function GET(request) {
  try {
    const contexto = await obtenerContexto(request);
    if (contexto.error) return NextResponse.json({ error: contexto.error }, { status: contexto.status });

    const { data, error } = await contexto.admin
      .from('verifactu_facturas')
      .select('id, numero, fecha_emision, cliente, base_imponible, iva, total, estado, huella, huella_anterior')
      .eq('negocio_id', contexto.negocio.id)
      .order('numero', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ facturas: data || [] });
  } catch (error) {
    console.error('[verifactu][GET]', error);
    return NextResponse.json({ error: 'No se pudieron cargar las facturas.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contexto = await obtenerContexto(request);
    if (contexto.error) return NextResponse.json({ error: contexto.error }, { status: contexto.status });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });

    const cliente = validarCliente(body.cliente);
    const lineas = normalizarLineas(body.lineas);
    const totales = calcularTotales(lineas);
    const fecha = new Date().toISOString();

    const { data: ultima, error: ultimaError } = await contexto.admin
      .from('verifactu_facturas')
      .select('numero, huella')
      .eq('negocio_id', contexto.negocio.id)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ultimaError) throw ultimaError;

    const numero = (ultima?.numero || 0) + 1;
    const huellaAnterior = ultima?.huella || null;
    const huella = generarHuella({
      negocioId: contexto.negocio.id,
      numero,
      fecha,
      cliente,
      lineas,
      totales,
      huellaAnterior,
    });

    const { data: factura, error: facturaError } = await contexto.admin
      .from('verifactu_facturas')
      .insert({
        negocio_id: contexto.negocio.id,
        creado_por: contexto.user.id,
        numero,
        fecha_emision: fecha,
        cliente,
        base_imponible: totales.base,
        iva: totales.iva,
        total: totales.total,
        estado: 'emitida_local',
        huella,
        huella_anterior: huellaAnterior,
        aeat_estado: 'pendiente_configuracion',
      })
      .select()
      .single();

    if (facturaError) throw facturaError;

    const { error: lineasError } = await contexto.admin
      .from('verifactu_lineas')
      .insert(lineas.map((linea) => ({ factura_id: factura.id, ...linea })));

    if (lineasError) throw lineasError;

    return NextResponse.json({ factura, lineas }, { status: 201 });
  } catch (error) {
    console.error('[verifactu][POST]', error);
    return NextResponse.json({ error: error.message || 'No se pudo emitir la factura.' }, { status: 400 });
  }
}
