"use client";

import { useState, useCallback, use, useEffect } from "react";

const DURACION_MENSAJE_MS = 6000;

export default function FicharPage({ params }) {
  const { negocioId } = use(params);

  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState({ estado: "idle" });
  const [horaActual, setHoraActual] = useState(new Date());
  const [progreso, setProgreso] = useState(100);
  // Recuerda el último fichaje hecho en ESTE dispositivo, para mostrar el turno en curso
  // en la pantalla de espera. Es solo del navegador (no persiste al recargar), útil sobre
  // todo para el caso de "movilidad" donde el dispositivo es personal del empleado.
  const [turnoEnCurso, setTurnoEnCurso] = useState(null); // { nombre, horaEntrada, horaSalida }
  function anchoBarraSegunTiempo(desdeISO) {
    if (!desdeISO) return 6;
    const minutos = Math.max(0, (horaActual - new Date(desdeISO)) / 60000);
    const JORNADA_REFERENCIA_MIN = 8 * 60; // 8h como referencia orientativa, no un dato real
    const porcentaje = 6 + (minutos / JORNADA_REFERENCIA_MIN) * 89;
    return Math.min(95, porcentaje);
  }

  useEffect(() => {
    const intervalo = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (resultado.estado === "idle") return;
    setProgreso(100);
    const raf = requestAnimationFrame(() => setProgreso(0));
    return () => cancelAnimationFrame(raf);
  }, [resultado]);

  const resetTrasResultado = useCallback(() => {
    setTimeout(() => {
      setPin("");
      setResultado({ estado: "idle" });
    }, DURACION_MENSAJE_MS);
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
        const horaFormateada = new Date(data.hora).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setResultado({
          estado: "exito",
          nombre: data.nombre,
          tipo: data.tipo,
          hora: horaFormateada,
        });

        if (data.tipo === "entrada") {
          setTurnoEnCurso({
            nombre: data.nombre,
            horaEntrada: horaFormateada,
            horaEntradaISO: data.hora,
            horaSalida: null,
          });
        } else {
          setTurnoEnCurso((actual) => ({
            nombre: data.nombre,
            horaEntrada: actual?.nombre === data.nombre ? actual.horaEntrada : null,
            horaEntradaISO: actual?.nombre === data.nombre ? actual.horaEntradaISO : null,
            horaSalida: horaFormateada,
          }));
        }
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
    setPin((p) => p + d);
  }

  function handleBorrar() {
    if (enviando) return;
    setPin((p) => p.slice(0, -1));
  }

  function tiempoTranscurrido(desdeISO) {
    if (!desdeISO) return "";
    const minutos = Math.max(0, Math.floor((horaActual - new Date(desdeISO)) / 60000));
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
  }

  const mostrandoResultado = resultado.estado !== "idle";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EDE6D8] px-6 py-12">
      <div className="w-full max-w-md">
        {/* Carcasa del terminal */}
        <div
          className="relative rounded-[28px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          style={{
            background: "linear-gradient(155deg, #4A4A48 0%, #2E2E2C 55%, #232321 100%)",
          }}
        >
          {/* Tornillos de las 4 esquinas */}
          {[
            "top-3 left-3",
            "top-3 right-3",
            "bottom-3 left-3",
            "bottom-3 right-3",
          ].map((pos) => (
            <div
              key={pos}
              className={`absolute ${pos} h-3.5 w-3.5 rounded-full shadow-inner`}
              style={{
                background: "radial-gradient(circle at 35% 35%, #D9C89A, #8A7748 70%, #5C4E2E)",
              }}
            >
              <div className="absolute left-1/2 top-1/2 h-[1.5px] w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#3A3220]" />
            </div>
          ))}

          {/* LED de estado */}
          <div className="mb-3 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7FBF7F] shadow-[0_0_6px_2px_rgba(127,191,127,0.6)]" />
            <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#9A9A96]">
              en línea
            </span>
          </div>

          {/* Pantalla embutida */}
          <div className="overflow-hidden rounded-2xl border border-[#E8DFCE] bg-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]">
            <div className="h-1.5 bg-gradient-to-r from-[#2F4538] to-[#B8933F]" />

            <div className="p-5">
              <div className="mb-3 text-center">
                <svg
                  className="mx-auto mb-2 h-12 w-12"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Cuerpo del reloj de fichar */}
                  <rect x="10" y="6" width="34" height="34" rx="3" stroke="#2F4538" strokeWidth="2" fill="#FDFBF7" />
                  {/* Esfera */}
                  <circle cx="27" cy="23" r="11" stroke="#2F4538" strokeWidth="2" fill="white" />
                  <line x1="27" y1="23" x2="27" y2="16" stroke="#2F4538" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="27" y1="23" x2="32" y2="26" stroke="#2F4538" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="27" cy="23" r="1.4" fill="#2F4538" />
                  {/* Ranura para la tarjeta */}
                  <rect x="16" y="34" width="22" height="3" rx="1" fill="#B8933F" />
                  {/* Tarjeta asomando */}
                  <rect
                    x="30"
                    y="30.5"
                    width="20"
                    height="27"
                    rx="1.5"
                    fill="white"
                    stroke="#B8933F"
                    strokeWidth="1.6"
                  />
                  <line x1="34" y1="38" x2="46" y2="38" stroke="#D8CFBC" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="34" y1="43" x2="46" y2="43" stroke="#D8CFBC" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="34" y1="48" x2="42" y2="48" stroke="#D8CFBC" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8933F]">
                  Tu Gestor Hostelero
                </p>
                <h1
                  className="text-3xl font-medium text-[#1F2420]"
                  style={{ fontFamily: "'Iowan Old Style', 'Georgia', serif" }}
                >
                  Fichar
                </h1>
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

            <div className="mb-4 flex justify-center gap-4">
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

            {!mostrandoResultado && turnoEnCurso && (
              <div className="mb-4 rounded-xl bg-[#F6F2E9] px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-[#6B6155]">
                  <span>Entrada · {turnoEnCurso.horaEntrada ?? "—"}</span>
                  <span>
                    {turnoEnCurso.horaSalida
                      ? `Salida · ${turnoEnCurso.horaSalida}`
                      : `En curso · ${tiempoTranscurrido(turnoEnCurso.horaEntradaISO)}`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8DFCE]">
                  <div
                    className="h-full rounded-full bg-[#4CAF6D] transition-all duration-1000 ease-linear"
                    style={{
                      width: turnoEnCurso.horaSalida
                        ? "100%"
                        : `${anchoBarraSegunTiempo(turnoEnCurso.horaEntradaISO)}%`,
                    }}
                  />
                </div>
              </div>
            )}

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

                {/* Barra de progreso: cuenta atrás visual antes de volver al teclado */}
                <div className="mx-auto mt-6 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-[#EDE6D6]">
                  <div
                    className="h-full rounded-full bg-[#2F4538] ease-linear"
                    style={{
                      width: `${progreso}%`,
                      transitionProperty: "width",
                      transitionDuration: `${DURACION_MENSAJE_MS}ms`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mx-auto grid max-w-[180px] grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDigit(d)}
                    disabled={enviando}
                    className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#EDE6D6] bg-[#FDFBF7] text-lg font-medium text-[#1F2420] shadow-sm transition-all hover:border-[#2F4538]/30 hover:bg-white active:scale-95 disabled:opacity-40"
                  >
                    {d}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleDigit("0")}
                  disabled={enviando}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#EDE6D6] bg-[#FDFBF7] text-lg font-medium text-[#1F2420] shadow-sm transition-all hover:border-[#2F4538]/30 hover:bg-white active:scale-95 disabled:opacity-40"
                >
                  0
                </button>
                <button
                  onClick={handleBorrar}
                  disabled={enviando || pin.length === 0}
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-base font-medium text-[#9A8F7D] transition-all hover:text-[#1F2420] active:scale-95 disabled:opacity-30"
                >
                  ⌫
                </button>
              </div>
            )}
            {!mostrandoResultado && (
              <button
                onClick={() => enviarPin(pin)}
                disabled={pin.length !== 4 || enviando}
                className="mx-auto mt-3 block w-full max-w-[180px] rounded-xl bg-gradient-to-r from-[#2F4538] to-[#3D5748] py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(47,69,56,0.35)] transition-all hover:shadow-[0_6px_18px_rgba(47,69,56,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gradient-to-r disabled:from-[#E3DAC7] disabled:to-[#E3DAC7] disabled:text-[#B0A48D] disabled:shadow-none"
              >
                {enviando ? "Registrando…" : "Registrar fichaje"}
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
