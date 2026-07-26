import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { negocioId } = await params;

  return NextResponse.json({
    name: "Fichar · Tu Gestor Hostelero",
    short_name: "Fichar",
    description: "Registra tu entrada y salida en un toque",
    start_url: `/fichar/${negocioId}`,
    scope: `/fichar/${negocioId}`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF6EF",
    theme_color: "#2F4538",
    icons: [
      {
        src: "/icon-192-fichar.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-fichar.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  });
}
