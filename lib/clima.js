/**
 * Consulta el tiempo actual, previsión y alertas meteorológicas oficiales
 * para las coordenadas de un negocio, usando OpenWeather One Call API.
 * Devuelve { ok: boolean, actual?, previsionDiaria?, alertas?, error?: string }
 */
export async function obtenerClimaNegocio(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'Falta OPENWEATHER_API_KEY en las variables de entorno.' };
  }
  if (!lat || !lon) {
    return { ok: false, error: 'Faltan coordenadas (lat/lon) del negocio.' };
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&lang=es&appid=${apiKey}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return { ok: false, error: `Error al consultar OpenWeather: ${res.status}` };
    }

    const data = await res.json();

    return {
      ok: true,
      actual: {
        temperatura: data.current?.temp,
        sensacion: data.current?.feels_like,
        descripcion: data.current?.weather?.[0]?.description,
        icono: data.current?.weather?.[0]?.icon,
        viento: data.current?.wind_speed,
        lluvia: data.current?.rain?.['1h'] || 0,
      },
      previsionDiaria: (data.daily || []).map((dia) => ({
        fecha: dia.dt,
        tempMax: dia.temp?.max,
        tempMin: dia.temp?.min,
        descripcion: dia.weather?.[0]?.description,
        probabilidadLluvia: dia.pop, // 0 a 1
      })),
      alertas: (data.alerts || []).map((alerta) => ({
        origen: alerta.sender_name,
        evento: alerta.event,
        inicio: alerta.start,
        fin: alerta.end,
        descripcion: alerta.description,
      })),
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}