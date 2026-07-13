"use server";
import Stripe from "stripe";
import { headers } from "next/headers";

/* ============================================================
   PRECIOS SIN IVA (base, en euros/mes).
   ⚠️ Deben COINCIDIR con los de page.jsx. Si cambias uno, cambia el otro.
   ============================================================ */
const PRECIOS = {
  verifactu:   { nombre: "VeriFactu", precioMes: 27 },
  facturacion: { nombre: "Facturación Pro", precioMes: 37 },
  clientes:    { nombre: "Gestión de Clientes", precioMes: 24 },
  empleados:   { nombre: "Gestión de Empleados", precioMes: 31 },
  alertas:     { nombre: "Alertas", precioMes: 10 },
};
const ANUAL_FACTOR = 10;       // 12 meses - 2 gratis
const DESCUENTO_PACK = 0.25;   // 25% al contratar TODOS los módulos
const IVA_PORCENTAJE = 21;     // IVA general (España)

/* Busca un tipo de IVA del 21% (que se SUMA) ya creado en tu cuenta de Stripe.
   Si no existe, lo crea una sola vez y luego lo reutiliza. No tienes que tocar nada en el panel. */
async function obtenerTipoIVA(stripe) {
  const lista = await stripe.taxRates.list({ active: true, limit: 100 });
  const existente = lista.data.find(
    (t) => Number(t.percentage) === IVA_PORCENTAJE && t.inclusive === false
  );
  if (existente) return existente.id;
  const nuevo = await stripe.taxRates.create({
    display_name: "IVA",
    description: "IVA general (España)",
    percentage: IVA_PORCENTAJE,
    inclusive: false, // false = el IVA se añade ENCIMA de la base (no va incluido)
    country: "ES",
  });
  return nuevo.id;
}

export async function crearCheckout(ids, cycle, negocioId) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Falta la clave de Stripe. Revisa STRIPE_SECRET_KEY en .env.local y reinicia el servidor." };
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const seleccion = (ids || []).filter((id) => PRECIOS[id]);
  if (seleccion.length === 0) return { error: "Selecciona al menos un módulo." };
  if (!negocioId) return { error: "Falta el negocio. Inicia sesión antes de pagar." };

  // ============================================================
  // CONTROL DE COHERENCIA (seguridad):
  // Verifica que las dependencias entre módulos se cumplen.
  // Si algo no cuadra (ej. Facturación Pro sin VeriFactu, su base),
  // NO se cobra nada: se aborta y se pide revisar la selección.
  // Esto evita cobros incoherentes por estados "viejos" del navegador.
  // ============================================================
  const DEPENDENCIAS = {
    facturacion: "verifactu",   // Facturación Pro requiere VeriFactu
  };
  for (const id of seleccion) {
    const base = DEPENDENCIAS[id];
    if (base && !seleccion.includes(base)) {
      return {
        error: "Tu selección no es válida (falta un módulo base necesario). Vuelve al catálogo y revísala antes de pagar.",
      };
    }
  }
  const anual = cycle === "year";
  const interval = anual ? "year" : "month";
  const factor = anual ? ANUAL_FACTOR : 1;
  const todos = seleccion.length === Object.keys(PRECIOS).length;

  // IVA del 21% que Stripe sumará sobre la base (mismo criterio para todas las líneas)
  const ivaId = await obtenerTipoIVA(stripe);

  let line_items;

  if (todos) {
    // Suite completa: aplicamos el -25% con el MISMO redondeo que la web,
    // para que el cobro coincida exactamente con lo que ve el cliente (97 € / 967 €).
    const subtotal = Object.values(PRECIOS).reduce((t, m) => t + m.precioMes * factor, 0);
    const descuento = Math.round(subtotal * DESCUENTO_PACK);
    const total = subtotal - descuento;
    line_items = [
      {
        price_data: {
          currency: "eur",
          product_data: { name: "Suite completa (los 5 módulos · -25%)" },
          unit_amount: total * 100,
          recurring: { interval },
        },
        quantity: 1,
        tax_rates: [ivaId],
      },
    ];
  } else {
    // Selección parcial: cada módulo a su precio base, sin descuento, con IVA aparte.
    line_items = seleccion.map((id) => {
      const m = PRECIOS[id];
      const euros = m.precioMes * factor;
      return {
        price_data: {
          currency: "eur",
          product_data: { name: m.nombre },
          unit_amount: euros * 100,
          recurring: { interval },
        },
        quantity: 1,
        tax_rates: [ivaId],
      };
    });
  }

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items,
      success_url: `${origin}/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/catalogo`,
     client_reference_id: negocioId,
      metadata: {
        negocio_id: negocioId,
        modulos: seleccion.join(","),   // "verifactu,facturacion"
        ciclo: interval,
      },
      subscription_data: {
        metadata: { negocio_id: negocioId, modulos: seleccion.join(",") },
      }, 
    });
    return { url: session.url };
  } catch (e) {
    return { error: "No se pudo iniciar el pago: " + e.message };
  }
}
