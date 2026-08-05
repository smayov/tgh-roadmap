/**
 * Consulta el tiempo actual y las alertas meteorológicas oficiales
 * para las coordenadas de un negocio, usando OpenWeather One Call API 4.0.
 * Devuelve { ok: boolean, actual?, alertas?, error?: string }
 */
export async function obtenerClimaNegocio(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'Falta OPENWEATHER_API_KEY en las variables de entorno.' };
  }
  if (!lat || !lon) {
    return { ok: false, error: 'Faltan coordenadas (lat/lon) del negocio.' };
  }

  const urlActual = `https://api.openweathermap.org/data/4.0/onecall/current?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${apiKey}`;

  try {
    const res = await fetch(urlActual);

    if (!res.ok) {
      return { ok: false, error: `Error al consultar OpenWeather: ${res.status}` };
    }

    const json = await res.json();
    const registro = json.data?.[0];

    if (!registro) {
      return { ok: false, error: 'OpenWeather no devolvió datos para esta ubicación.' };
    }

    const actual = {
      temperatura: registro.temp,
      sensacion: registro.feels_like,
      descripcion: registro.weather?.[0]?.description,
      icono: registro.weather?.[0]?.icon,
      viento: registro.wind_speed,
      lluvia: registro.rain?.['1h'] || 0,
    };

    // Las alertas en la 4.0 llegan solo como IDs; hay que pedir el detalle de cada una aparte
    const idsAlertas = registro.alerts || [];
    const alertas = [];

    for (const id of idsAlertas.slice(0, 5)) {
      const urlAlerta = `https://api.openweathermap.org/data/4.0/onecall/alert/${id}?appid=${apiKey}`;
      try {
        const resAlerta = await fetch(urlAlerta);
       if (resAlerta.ok) {
          const detalle = await resAlerta.json();
          console.log('DEBUG alerta:', JSON.stringify(detalle));
          alertas.push({
            origen: detalle.sender_name,
            evento: detalle.event,
            inicio: detalle.start,
            fin: detalle.end,
            descripcion: detalle.description,
          });
        }
      } catch {
        // si falla el detalle de una alerta concreta, seguimos con las demás
      }
    }

    return { ok: true, actual, alertas };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}