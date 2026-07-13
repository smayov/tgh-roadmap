import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";        // Stripe necesita Node, no Edge
export const dynamic = "force-dynamic";

export async function POST(req) {
  // Se crean AQUÍ dentro (no al cargar el archivo) para que no fallen durante el build.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();   // imprescindible: cuerpo crudo para verificar la firma

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Firma de webhook inválida:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const negocioId = session.metadata?.negocio_id;
    const modulosRaw = session.metadata?.modulos;
    const ciclo = session.metadata?.ciclo || "month";
    const subscriptionId = session.subscription || null;

    if (!negocioId || !modulosRaw) {
      console.error("Faltan metadatos en la sesión:", session.id);
      return new Response("Faltan metadatos", { status: 200 });
    }

    const modulos = modulosRaw.split(",").map((m) => m.trim()).filter(Boolean);

    const filas = modulos.map((modulo) => ({
      negocio_id: negocioId,
      modulo,
      estado: "activo",
      ciclo,
      stripe_subscription_id: subscriptionId,
    }));

    // upsert = idempotente. Si Stripe reenvía el mismo evento, no duplica.
    const { error } = await supabaseAdmin
      .from("modulos_activos")
      .upsert(filas, { onConflict: "negocio_id,modulo" });

    if (error) {
      console.error("Error al activar módulos:", error.message);
      return new Response("Error en base de datos", { status: 500 });
    }

    console.log(`Activados ${modulos.length} módulos para negocio ${negocioId}`);
  }

  return new Response("ok", { status: 200 });
}