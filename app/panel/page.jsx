"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";

/* ============================================================
   ESCRITORIO / PANEL DE MÓDULOS
   Muestra los 5 módulos como tarjetas. Los contratados se ven
   a color y son clicables; los no contratados salen apagados
   con candado y llevan al catálogo para contratarlos.
   Los id (verifactu, facturacion...) deben COINCIDIR con la
   columna "modulo" de la tabla modulos_activos.
   ============================================================ */
const MODULOS = [
  { id: "verifactu",   icono: "🧾", titulo: "VeriFactu",          sub: "Cumplimiento fiscal" },
  { id: "facturacion", icono: "📄", titulo: "Facturación Pro",    sub: "Presupuestos y facturas" },
  { id: "clientes",    icono: "👥", titulo: "Gestión de Clientes", sub: "CRM y fidelización" },
  { id: "empleados",   icono: "🕒", titulo: "Gestión de Empleados", sub: "Fichajes y turnos" },
  { id: "alertas",     icono: "🌦️", titulo: "Alertas",            sub: "Avisos que afectan al negocio" },
];

export default function Panel() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [negocio, setNegocio] = useState(null);
  const [activos, setActivos] = useState([]); // array de ids activos

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/acceso"); return; }

      // Negocio del usuario
      const { data: neg } = await supabase
        .from("negocios")
        .select("id, nombre")
        .eq("propietario", user.id)
        .maybeSingle();

      if (neg) {
        setNegocio(neg);
        // Módulos activos de ese negocio
        const { data: mods } = await supabase
          .from("modulos_activos")
          .select("modulo, estado")
          .eq("negocio_id", neg.id)
          .eq("estado", "activo");
        setActivos((mods || []).map((m) => m.modulo));
      }
      setCargando(false);
    })();
  }, [router]);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push("/acceso");
  };

  const abrirModulo = (id) => {
    // De momento cada módulo lleva a su propia ruta (a construir).
    // Si aún no existe, mostrará el 404 de Next hasta que la creemos.
    router.push(`/modulo/${id}`);
  };

  if (cargando) {
    return (
      <div style={wrap}>
        <p style={{ color: "#EAF3EE" }}>Cargando tu escritorio…</p>
      </div>
    );
  }

  const totalActivos = activos.length;

  return (
    <div style={wrap}>
      <div style={container}>

        {/* Cabecera */}
        <header style={head}>
          <div>
            <div style={brand}>◆ Tu Gestor Hostelero</div>
            <h1 style={saludo}>
              Hola{negocio?.nombre ? `, ${negocio.nombre}` : ""}
            </h1>
            <p style={subhead}>
              {totalActivos > 0
                ? `Tienes ${totalActivos} ${totalActivos === 1 ? "módulo activo" : "módulos activos"}. Entra en cualquiera para empezar.`
                : "Aún no tienes módulos activos. Elige el primero para empezar."}
            </p>
          </div>
          <button onClick={salir} style={btnSalir}>Cerrar sesión</button>
        </header>

        {/* Rejilla de módulos */}
        <section style={grid}>
          {MODULOS.map((m) => {
            const activo = activos.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => (activo ? abrirModulo(m.id) : router.push("/catalogo"))}
                style={{ ...tarjeta, ...(activo ? tarjetaActiva : tarjetaInactiva) }}
                aria-label={activo ? `Abrir ${m.titulo}` : `Contratar ${m.titulo}`}
              >
                <div style={{ ...iconoBox, ...(activo ? iconoActivo : iconoInactivo) }}>
                  <span style={{ fontSize: 30, filter: activo ? "none" : "grayscale(1)" }}>{m.icono}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ ...titulo, color: activo ? "#0D3A28" : "#8A968F" }}>{m.titulo}</div>
                  <div style={{ ...sub, color: activo ? "#5C6B61" : "#A7B0AA" }}>{m.sub}</div>
                </div>

                {activo ? (
                  <span style={pillActivo}>Abrir →</span>
                ) : (
                  <span style={pillInactivo}>🔒 Contratar</span>
                )}
              </button>
            );
          })}
        </section>

        {/* Pie con acceso al catálogo */}
        <footer style={pie}>
          <span style={{ color: "#B7C7BE", fontSize: 14 }}>
            ¿Quieres añadir más funciones a tu negocio?
          </span>
          <button onClick={() => router.push("/catalogo")} style={btnCatalogo}>
            Ver todos los módulos
          </button>
        </footer>

      </div>
    </div>
  );
}

/* ===================== estilos ===================== */
const wrap = {
  minHeight: "100vh",
  background: "#0D3A28",
  display: "grid",
  placeItems: "center",
  fontFamily: "system-ui, -apple-system, sans-serif",
  padding: 24,
  boxSizing: "border-box",
};
const container = { width: "100%", maxWidth: 920 };

const head = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 28,
  flexWrap: "wrap",
};
const brand = { color: "#7FC9A4", fontWeight: 700, fontSize: 14, letterSpacing: ".02em", marginBottom: 10 };
const saludo = { color: "#fff", fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1.1 };
const subhead = { color: "#B7C7BE", fontSize: 15, marginTop: 8, marginBottom: 0 };
const btnSalir = {
  background: "transparent",
  border: "1.5px solid rgba(255,255,255,.25)",
  color: "#EAF3EE",
  padding: "9px 16px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

const tarjeta = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: 18,
  borderRadius: 16,
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  transition: "transform .12s ease, box-shadow .12s ease",
  width: "100%",
  boxSizing: "border-box",
};
const tarjetaActiva = {
  background: "#fff",
  boxShadow: "0 12px 30px rgba(0,0,0,.22)",
};
const tarjetaInactiva = {
  background: "rgba(255,255,255,.06)",
  border: "1px dashed rgba(255,255,255,.18)",
};

const iconoBox = {
  width: 56,
  height: 56,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};
const iconoActivo = { background: "#EAF7F0" };
const iconoInactivo = { background: "rgba(255,255,255,.05)" };

const titulo = { fontSize: 16, fontWeight: 700 };
const sub = { fontSize: 13, marginTop: 2 };

const pillActivo = {
  color: "#1A6A48",
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: "nowrap",
};
const pillInactivo = {
  color: "#B7C7BE",
  fontWeight: 600,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const pie = {
  marginTop: 30,
  paddingTop: 20,
  borderTop: "1px solid rgba(255,255,255,.12)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};
const btnCatalogo = {
  background: "#1A6A48",
  border: "none",
  color: "#fff",
  padding: "10px 18px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
