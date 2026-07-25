"use client";

import { useState, useCallback, use, useEffect } from "react";

export default function FicharPage({ params }) {
  const { negocioId } = use(params);

  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState({ estado: "idle" });
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const resetTrasResultado = useCallback(() => {
    setTimeout(() => {
      setPin("");
      setResultado({ estado: "idle" });
    }, 4500);
  }, []);

  function obtenerUbicacion() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 4000 }
      );
    });
  }

  async function enviarPin(pinCompleto) {
    setEnviando(true);
    try {
      const ubicacion = await obtenerUbicacion();
      const res = await fetch("/api/personal/fichaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio_id: negocioId, pin: pinCompleto, ubicacion }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResultado({ estado: "error", mensaje: data.message || "Error al fichar" });
      } else {
        setResultado({
          estado: "exito",
          nombre: data.nombre,
          tipo: data.tipo,
          hora: new Date(data.hora).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      }
    } catch {
      setResultado({ estado: "error", mensaje: "Error de conexión" });
    } finally {
      setEnviando(false);
      resetTrasResultado();
    }
  }

  function handleDigit(d) {
    if (enviando || pin.length >= 4) return;
    const nuevoPin = pin + d;
    setPin(nuevoPin);
    if (nuevoPin.length === 4) enviarPin(nuevoPin);
  }

  function handleBorrar() {
    if (enviando) return;
    setPin((p) => p.slice(0, -1));
  }

  const mostrandoResultado = resultado.estado !== "idle";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8933F]">
            Tu Gestor Hostelero
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E8DFCE] bg-white shadow-[0_8px_30px_rgba(47,69,56,0.08)]">
          <div className="h-1.5 bg-gradient-to-r from-[#2F4538] to-[#B8933F]" />

          <div className="p-8">
            <div className="mb-6 text-center">
              <h1
                className="text-3xl font-medium text-[#1F2420]"
                style={{ fontFamily: "'Iowan Old Style', 'Georgia', serif" }}
              >
                Fichar
              </h1>
              {/* Reloj en vivo — el guiño propio de esta pantalla */}
              <p className="mt-1 font-mono text-sm tabular-nums tracking-wider text-[#9A8F7D]">
                {horaActual.toLocaleTimeString("es-ES")}
                {" · "}
                {horaActual.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            <div className="mb-8 flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full border-2 transition-all duration-150 ${
                    i < pin.length
                      ? "border-[#2F4538] bg-[#2F4538]"
                      : "border-[#D8CFBC] bg-transparent"
                  }`}
                />
              ))}
            </div>

            {mostrandoResultado ? (
              <div className="text-center">
                <div
                  className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                    resultado.estado === "exito" ? "bg-[#EAF1EA]" : "bg-[#FBEAE4]"
                  }`}
                >
                  {resultado.estado === "exito" ? (
                    <svg
                      className="h-6 w-6 text-[#2F4538]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-[#9A3B24]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                {resultado.estado === "exito" ? (
                  <>
                    <p className="text-lg font-medium text-[#1F2420]">
                      ¡Hola, {resultado.nombre}!
                    </p>
                    <p className="mt-1 text-sm text-[#6B6155]">
                      {resultado.tipo === "entrada" ? "Entrada" : "Salida"} registrada · {resultado.hora}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-[#9A3B24]">{resultado.mensaje}</p>
                )}
              </div>
            ) : (
              <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDigit(d)}
                    disabled={enviando}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#EDE6D6] bg-[#FDFBF7] text-2xl font-medium text-[#1F2420] shadow-sm transition-all hover:border-[#2F4538]/30 hover:bg-white active:scale-95 disabled:opacity-40"
                  >
                    {d}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleDigit("0")}
                  disabled={enviando}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#EDE6D6] bg-[#FDFBF7] text-2xl font-medium text-[#1F2420] shadow-sm transition-all hover:border-[#2F4538]/30 hover:bg-white active:scale-95 disabled:opacity-40"
                >
                  0
                </button>
                <button
                  onClick={handleBorrar}
                  disabled={enviando || pin.length === 0}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-base font-medium text-[#9A8F7D] transition-all hover:text-[#1F2420] active:scale-95 disabled:opacity-30"
                >
                  ⌫
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
