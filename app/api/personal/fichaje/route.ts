import { NextRequest, NextResponse } from "next/server";
import { ficharConPin } from "@/lib/fichaje";

export async function POST(req: NextRequest) {
  try {
    const { negocio_id, pin, ubicacion } = await req.json();

    if (!negocio_id || !pin || pin.length !== 4) {
      return NextResponse.json({ error: "PIN inválido" }, { status: 400 });
    }

    const resultado = await ficharConPin(negocio_id, pin, ubicacion);

    if (!resultado.ok) {
      const status =
        resultado.codigo === "bloqueado"
          ? 429
          : resultado.codigo === "pin_incorrecto"
          ? 401
          : 500;
      return NextResponse.json(
        { error: resultado.codigo, message: resultado.mensaje },
        { status }
      );
    }

    return NextResponse.json({
      nombre: resultado.nombre,
      tipo: resultado.tipo,
      hora: resultado.hora,
      tipoFichaje: resultado.tipoFichaje,
    });
  } catch (err) {
    console.error("Error en /api/personal/fichaje:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
