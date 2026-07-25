"use client";

import { useState, use } from "react";

export default function VacacionesPage({ params }) {
  const { negocioId } = use(params);

  // Paso 1: identificación por PIN
  const [pin, setPin] = useState("");
  const [identificando, setIdentificando] = useState(false);
  const [errorPin, setErrorPin] = useState(null);
  const [empleado, setEmpleado] = useState(null); // { empleadoId, nombre }

  // Paso 2: saldo + formulario
  const [saldo, setSaldo] = useState(null); // { diasAnuales, diasUsados, saldoDisponible }
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];

  async function handleDigit(d) {
    if (identificando || pin.length >= 4) return;
    const nuevoPin = pin + d;
    setPin(nuevoPin);
    if (nuevoPin.length === 4) {
      await identificar(nuevoPin);
    }
  }

  function handleBorrar() {
    if (identificando) return;
    setPin((p) => p.slice(0, -1));
  }

  async function identificar(pinCompleto) {
    setIdentificando(true);
    setErrorPin(null);
    try {
      const res = await fetch("/api/personal/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio_id: negocioId, pin: pinCompleto }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorPin(data.message || "PIN incorrecto");
        setPin("");
        return;
      }

      setEmpleado({ empleadoId: data.empleadoId, nombre: data.nombre });
      await cargarSaldo(data.empleadoId);
    } catch {
      setErrorPin("Error de conexión");
      setPin("");
    } finally {
      setIdentificando(false);
    }
  }

  async function cargarSaldo(empleadoId) {
    try {
      const res = await fetch(
        `/api/personal/vacaciones?empleado_id=${empleadoId}&negocio_id=${negocioId}`
      );
      const data = await res.json();
      if (res.ok) setSaldo(data);
    } catch {
      // si falla la consulta de saldo, seguimos igualmente; el POST validará al enviar
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (!fechaInicio || !fechaFin) {
      setError("Selecciona una fecha de inicio y una de fin.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/personal/vacaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empleado_id: empleado.empleadoId,
          negocio_id: negocioId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "No se ha podido enviar la solicitud.");
        return;
      }

      setExito(true);
      setFechaInicio("");
      setFechaFin("");
      await cargarSaldo(empleado.empleadoId);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  // ---- Paso 1: pantalla de PIN ----
  if (!empleado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Vacaciones</h1>
          <p className="text-sm text-gray-500">Identifícate con tu PIN</p>

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

          {errorPin && (
            <div className="w-full rounded-xl bg-red-50 px-6 py-4 text-center text-lg font-semibold text-red-700">
              {errorPin}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                disabled={identificando}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 active:scale-95 disabled:opacity-50"
              >
                {d}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigit("0")}
              disabled={identificando}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl font-semibold text-gray-800 shadow-sm transition hover:bg-gray-100 active:scale-95 disabled:opacity-50"
            >
              0
            </button>
            <button
              onClick={handleBorrar}
              disabled={identificando || pin.length === 0}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-lg font-medium text-gray-500 shadow-sm transition hover:bg-gray-100 active:scale-95 disabled:opacity-30"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Paso 2: formulario de solicitud ----
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Hola, {empleado.nombre}
          </h3>
          {saldo && (
            <p className="mt-1 text-sm text-gray-500">
              Te quedan <span className="font-semibold text-gray-700">{saldo.saldoDisponible}</span> de{" "}
              {saldo.diasAnuales} días este año
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
            <input
              type="date"
              min={hoy}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
            <input
              type="date"
              min={fechaInicio || hoy}
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {exito && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Solicitud enviada. El dueño la revisará en breve.
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar solicitud"}
        </button>
      </form>
    </div>
  );
}
