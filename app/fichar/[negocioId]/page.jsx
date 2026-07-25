"use client";

import { useState, useCallback, use } from "react";

export default function FicharPage({ params }) {
  const { negocioId } = use(params);

  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState({ estado: "idle" });

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
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null), // si rechaza el permiso, no bloqueamos el fichaje
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
        setResultado({
          estado: "error",
          mensaje: data.message || "Error al fichar",
        });
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Fichar</h1>

        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-5 w-5 rounded-full border-2 border-gray-400 transition ${
                i < pin.length ? "bg-gray-800" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {mostrandoResultado && (
          <div
            className={`w-full rounded-xl px-6 py-5 text-center text-xl font-semibold ${
              resultado.estado === "exito"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {resultado.estado === "exito"
              ? `¡Hola ${resultado.nombre}! ${
                  resultado.tipo === "entrada" ? "Entrada" : "Salida"
                } registrada · ${resultado.hora}`
              : resultado.mensaje}
          </div>
        )}

        {!mostrandoResultado && (
          <div className="grid grid-cols-3 gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                disabled={enviando}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 active:scale-95 disabled:opacity-50"
              >
                {d}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigit("0")}
              disabled={enviando}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 active:scale-95 disabled:opacity-50"
            >
              0
            </button>
            <button
              onClick={handleBorrar}
              disabled={enviando || pin.length === 0}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-lg font-medium text-gray-500 shadow-sm transition hover:bg-gray-100 active:scale-95 disabled:opacity-30"
            >
              ⌫
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
