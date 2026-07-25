import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Esquema real confirmado:
// empleados: ... dias_vacaciones_anuales (numeric, default 30) ...
// vacaciones: id, empleado_id, negocio_id, fecha_inicio, fecha_fin, estado ('pendiente'|'aprobada'|'rechazada'),
//             comentario, aprobado_por, fecha_resolucion, creado_en
// No existe columna "dias" en vacaciones ni "dias_vacaciones_disfrutados" en empleados:
// los días se calculan al vuelo a partir de fecha_inicio/fecha_fin.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function calcularDiasLaborables(inicio, fin) {
  const start = new Date(inicio);
  const end = new Date(fin);
  let dias = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const diaSemana = cursor.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) dias++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const empleado_id = searchParams.get("empleado_id");
    const negocio_id = searchParams.get("negocio_id");

    if (!empleado_id || !negocio_id) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const { data: empleado, error: errorEmpleado } = await supabaseAdmin
      .from("empleados")
      .select("dias_vacaciones_anuales")
      .eq("id", empleado_id)
      .eq("negocio_id", negocio_id)
      .single();

    if (errorEmpleado || !empleado) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    const anio = new Date().getFullYear();
    const { data: solicitudes } = await supabaseAdmin
      .from("vacaciones")
      .select("fecha_inicio, fecha_fin, estado")
      .eq("empleado_id", empleado_id)
      .in("estado", ["aprobada", "pendiente"])
      .gte("fecha_inicio", `${anio}-01-01`)
      .lte("fecha_inicio", `${anio}-12-31`);

    const diasAprobados = (solicitudes ?? [])
      .filter((v) => v.estado === "aprobada")
      .reduce((acc, v) => acc + calcularDiasLaborables(v.fecha_inicio, v.fecha_fin), 0);

    const diasPendientes = (solicitudes ?? [])
      .filter((v) => v.estado === "pendiente")
      .reduce((acc, v) => acc + calcularDiasLaborables(v.fecha_inicio, v.fecha_fin), 0);

    return NextResponse.json({
      diasAnuales: empleado.dias_vacaciones_anuales,
      diasAprobados,
      diasPendientes,
      saldoDisponible: empleado.dias_vacaciones_anuales - diasAprobados - diasPendientes,
    });
  } catch (err) {
    console.error("Error consultando saldo de vacaciones:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { empleado_id, negocio_id, fecha_inicio, fecha_fin } = await req.json();

    if (!empleado_id || !negocio_id || !fecha_inicio || !fecha_fin) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    if (new Date(fecha_fin) < new Date(fecha_inicio)) {
      return NextResponse.json(
        { error: "La fecha de fin no puede ser anterior a la de inicio" },
        { status: 400 }
      );
    }

    const diasSolicitados = calcularDiasLaborables(fecha_inicio, fecha_fin);

    // 1. Saldo anual del empleado
    const { data: empleado, error: errorEmpleado } = await supabaseAdmin
      .from("empleados")
      .select("dias_vacaciones_anuales")
      .eq("id", empleado_id)
      .eq("negocio_id", negocio_id)
      .single();

    if (errorEmpleado || !empleado) {
      return NextResponse.json(
        { error: "No se ha podido verificar el saldo de vacaciones" },
        { status: 404 }
      );
    }

    // 2. Días ya "comprometidos": aprobados + pendientes de autorizar, del mismo año
    //    (los pendientes también reservan saldo, para no permitir pedir de más
    //    mientras hay otra solicitud en revisión)
    const anio = new Date(fecha_inicio).getFullYear();
    const { data: solicitudesExistentes } = await supabaseAdmin
      .from("vacaciones")
      .select("fecha_inicio, fecha_fin")
      .eq("empleado_id", empleado_id)
      .in("estado", ["aprobada", "pendiente"])
      .gte("fecha_inicio", `${anio}-01-01`)
      .lte("fecha_inicio", `${anio}-12-31`);

    const diasYaComprometidos = (solicitudesExistentes ?? []).reduce(
      (acc, v) => acc + calcularDiasLaborables(v.fecha_inicio, v.fecha_fin),
      0
    );

    const saldoDisponible = empleado.dias_vacaciones_anuales - diasYaComprometidos;

    if (diasSolicitados > saldoDisponible) {
      return NextResponse.json(
        {
          error: "saldo_insuficiente",
          message: `No tienes suficientes días. Solicitas ${diasSolicitados} y te quedan ${saldoDisponible} disponibles este año.`,
          saldoDisponible,
          diasSolicitados,
        },
        { status: 422 }
      );
    }

    // 3. Crear la solicitud en estado "pendiente"
    const { data: solicitud, error: errorInsert } = await supabaseAdmin
      .from("vacaciones")
      .insert({
        empleado_id,
        negocio_id,
        fecha_inicio,
        fecha_fin,
        estado: "pendiente",
      })
      .select()
      .single();

    if (errorInsert) {
      return NextResponse.json({ error: "No se ha podido crear la solicitud" }, { status: 500 });
    }

    return NextResponse.json({ solicitud, diasSolicitados }, { status: 201 });
  } catch (err) {
    console.error("Error creando solicitud de vacaciones:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
