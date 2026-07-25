import { NextResponse } from "next/server";
import { identificarPorPin } from "@/lib/fichaje";

export async function POST(req) {
  try {
    const { negocio_id, pin } = await req.json();

    if (!negocio_id || !pin || pin.length !== 4) {
      return NextResponse.json({ error: "PIN inválido" }, { status: 400 });
    }

    const resultado = await identificarPorPin(negocio_id, pin);

    if (!resultado.ok) {
      const status =
        resultado.codigo === "bloqueado" ? 429 : resultado.codigo === "pin_incorrecto" ? 401 : 500;
      return NextResponse.json(
        { error: resultado.codigo, message: resultado.mensaje },
        { status }
      );
    }

    return NextResponse.json({ empleadoId: resultado.empleadoId, nombre: resultado.nombre });
  } catch (err) {
    console.error("Error en /api/personal/identificar:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
