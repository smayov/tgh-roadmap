"use client";

import { useState, use } from "react";

export default function VacacionesPage({ params }) {
  const { negocioId } = use(params);

  const [pin, setPin] = useState("");
  const [identificando, setIdentificando] = useState(false);
  const [errorPin, setErrorPin] = useState(null);
  const [empleado, setEmpleado] = useState(null);

  const [saldo, setSaldo] = useState(null);
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
    if (nuevoPin.length === 4) await identificar(nuevoPin);
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
      // el POST vuelve a validar el saldo al enviar, así que no bloqueamos aquí
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

  const anioActual = new Date().getFullYear();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] px-6 py-12">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8933F]">
            Tu Gestor Hostelero
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E8DFCE] bg-white shadow-[0_8px_30px_rgba(47,69,56,0.08)]">
          {/* Franja superior de acento */}
          <div className="h-1.5 bg-gradient-to-r from-[#2F4538] to-[#B8933F]" />

          <div className="p-8">
            {!empleado ? (
              <>
                <h1
                  className="mb-1 text-3xl font-medium text-[#1F2420]"
                  style={{ fontFamily: "'Iowan Old Style', 'Georgia', serif" }}
                >
                  Vacaciones
                </h1>
                <p className="mb-8 text-sm text-[#6B6155]">
                  Introduce tu PIN para identificarte
                </p>

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

                {errorPin && (
                  <div className="mb-6 rounded-xl bg-[#FBEAE4] px-5 py-3 text-center text-sm font-medium text-[#9A3B24]">
                    {errorPin}
                  </div>
                )}

                <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDigit(d)}
                      disabled={identificando}
                      className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#EDE6D6] bg-[#FDFBF7] text-2xl font-medium text-[#1F2420] shadow-sm transition-all hover:border-[#2F4538]/30 hover:bg-white active:scale-95 disabled:opacity-40"
                    >
                      {d}
                    </button>
                  ))}
                  <div />
                  <button
                    onClick={() => handleDigit("0")}
                    disabled={identificando}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#EDE6D6] bg-[#FDFBF7] text-2xl font-medium text-[#1F2420] shadow-sm transition-all hover:border-[#2F4538]/30 hover:bg-white active:scale-95 disabled:opacity-40"
                  >
                    0
                  </button>
                  <button
                    onClick={handleBorrar}
                    disabled={identificando || pin.length === 0}
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-base font-medium text-[#9A8F7D] transition-all hover:text-[#1F2420] active:scale-95 disabled:opacity-30"
                  >
                    ⌫
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-[#B8933F]">
                  Hola
                </p>
                <h1
                  className="mb-6 text-3xl font-medium text-[#1F2420]"
                  style={{ fontFamily: "'Iowan Old Style', 'Georgia', serif" }}
                >
                  {empleado.nombre}
                </h1>

                {saldo && (
                  <div className="mb-8 rounded-xl bg-[#F6F2E9] p-5">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="text-sm text-[#6B6155]">
                        Días disponibles · {anioActual}
                      </span>
                      <span className="text-lg font-semibold text-[#2F4538]">
                        {saldo.saldoDisponible}
                        <span className="text-sm font-normal text-[#9A8F7D]">
                          {" "}
                          / {saldo.diasAnuales}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8DFCE]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2F4538] to-[#B8933F] transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (saldo.saldoDisponible / saldo.diasAnuales) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    {saldo.diasUsados > 0 && (
                      <p className="mt-2 text-xs text-[#9A8F7D]">
                        {saldo.diasUsados} días ya aprobados este año
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#9A8F7D]">
                        Desde
                      </label>
                      <input
                        type="date"
                        min={hoy}
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full rounded-lg border border-[#E8DFCE] bg-[#FDFBF7] px-3 py-2.5 text-sm text-[#1F2420] transition focus:border-[#2F4538] focus:outline-none focus:ring-1 focus:ring-[#2F4538]"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#9A8F7D]">
                        Hasta
                      </label>
                      <input
                        type="date"
                        min={fechaInicio || hoy}
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full rounded-lg border border-[#E8DFCE] bg-[#FDFBF7] px-3 py-2.5 text-sm text-[#1F2420] transition focus:border-[#2F4538] focus:outline-none focus:ring-1 focus:ring-[#2F4538]"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-[#FBEAE4] px-5 py-3 text-sm font-medium text-[#9A3B24]">
                      {error}
                    </div>
                  )}

                  {exito && (
                    <div className="rounded-xl bg-[#EAF1EA] px-5 py-3 text-sm font-medium text-[#2F4538]">
                      Solicitud enviada. El dueño la revisará en breve.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full rounded-lg bg-[#2F4538] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#25392D] disabled:opacity-50"
                  >
                    {enviando ? "Enviando…" : "Enviar solicitud"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
