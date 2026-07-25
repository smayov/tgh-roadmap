import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// Esquema real confirmado:
// empleados: id, negocio_id, nombre, dni_nie, telefono, pin_hash, tipo_fichaje ('fijo'|'movilidad'),
//            dias_vacaciones_anuales, activo, fecha_alta, creado_en, foto_path
// pin_hash guarda "salHex:hashHex", calculado como sha256(salHex + pin) — igual que en el alta (page.jsx, hashearPin)
// fichajes: id, empleado_id, negocio_id, tipo ('entrada'|'salida'), fecha_hora, latitud, longitud, creado_en

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_INTENTOS = 5;
const VENTANA_BLOQUEO_MIN = 10;

function calcularHash(pin, salHex) {
  return createHash("sha256").update(salHex + pin).digest("hex");
}

function pinCoincide(pinIntroducido, pinHashGuardado) {
  if (!pinHashGuardado || !pinHashGuardado.includes(":")) return false;
  const [salHex, hashEsperado] = pinHashGuardado.split(":");
  return calcularHash(pinIntroducido, salHex) === hashEsperado;
}

async function comprobarBloqueo(negocioId) {
  const { data: bloqueo } = await supabaseAdmin
    .from("intentos_fichaje")
    .select("*")
    .eq("negocio_id", negocioId)
    .maybeSingle();

  if (bloqueo?.bloqueado_hasta && new Date(bloqueo.bloqueado_hasta) > new Date()) {
    const minutosRestantes = Math.ceil(
      (new Date(bloqueo.bloqueado_hasta).getTime() - Date.now()) / 60000
    );
    return {
      bloqueado: true,
      mensaje: `Demasiados intentos fallidos. Inténtalo de nuevo en ${minutosRestantes} min.`,
    };
  }
  return { bloqueado: false, bloqueo };
}

async function registrarFallo(negocioId, intentosActuales) {
  const nuevosIntentos = (intentosActuales ?? 0) + 1;
  const bloqueadoHasta =
    nuevosIntentos >= MAX_INTENTOS
      ? new Date(Date.now() + VENTANA_BLOQUEO_MIN * 60000).toISOString()
      : null;

  await supabaseAdmin.from("intentos_fichaje").upsert({
    negocio_id: negocioId,
    intentos_fallidos: nuevosIntentos,
    bloqueado_hasta: bloqueadoHasta,
    updated_at: new Date().toISOString(),
  });
}

async function resetearIntentos(negocioId) {
  await supabaseAdmin.from("intentos_fichaje").upsert({
    negocio_id: negocioId,
    intentos_fallidos: 0,
    bloqueado_hasta: null,
    updated_at: new Date().toISOString(),
  });
}

// Identifica a un empleado por su PIN, SIN registrar fichaje.
// Se usa para pantallas como "solicitar vacaciones", donde el empleado
// necesita identificarse pero no está fichando entrada/salida.
export async function identificarPorPin(negocioId, pin) {
  const { bloqueado, mensaje, bloqueo } = await comprobarBloqueo(negocioId);
  if (bloqueado) {
    return { ok: false, codigo: "bloqueado", mensaje };
  }

  const { data: empleados } = await supabaseAdmin
    .from("empleados")
    .select("id, nombre, pin_hash")
    .eq("negocio_id", negocioId)
    .eq("activo", true);

  const empleado = empleados?.find((e) => pinCoincide(pin, e.pin_hash));

  if (!empleado) {
    await registrarFallo(negocioId, bloqueo?.intentos_fallidos);
    return { ok: false, codigo: "pin_incorrecto", mensaje: "PIN incorrecto" };
  }

  await resetearIntentos(negocioId);
  return { ok: true, empleadoId: empleado.id, nombre: empleado.nombre };
}

export async function ficharConPin(negocioId, pin, ubicacion) {
  const { bloqueado, mensaje, bloqueo } = await comprobarBloqueo(negocioId);
  if (bloqueado) {
    return { ok: false, codigo: "bloqueado", mensaje };
  }

  const { data: empleados } = await supabaseAdmin
    .from("empleados")
    .select("id, nombre, pin_hash, tipo_fichaje")
    .eq("negocio_id", negocioId)
    .eq("activo", true);

  const empleado = empleados?.find((e) => pinCoincide(pin, e.pin_hash));

  if (!empleado) {
    await registrarFallo(negocioId, bloqueo?.intentos_fallidos);
    return { ok: false, codigo: "pin_incorrecto", mensaje: "PIN incorrecto" };
  }

  await resetearIntentos(negocioId);

  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  const { data: fichajesHoy } = await supabaseAdmin
    .from("fichajes")
    .select("tipo, fecha_hora")
    .eq("empleado_id", empleado.id)
    .gte("fecha_hora", hoyInicio.toISOString())
    .order("fecha_hora", { ascending: false })
    .limit(1);

  const ultimo = fichajesHoy?.[0];
  const tipo = ultimo && ultimo.tipo === "entrada" ? "salida" : "entrada";
  const ahora = new Date().toISOString();

  const { error: errorInsert } = await supabaseAdmin.from("fichajes").insert({
    empleado_id: empleado.id,
    negocio_id: negocioId,
    tipo,
    fecha_hora: ahora,
    latitud: ubicacion?.lat ?? null,
    longitud: ubicacion?.lng ?? null,
  });

  if (errorInsert) {
    return { ok: false, codigo: "error_insert", mensaje: "No se ha podido registrar el fichaje" };
  }

  return { ok: true, nombre: empleado.nombre, tipo, hora: ahora };
}
