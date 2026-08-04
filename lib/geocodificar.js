/**
 * Convierte una dirección en texto a coordenadas lat/lon
 * usando la Geocoding API de OpenWeather (misma clave que el clima).
 * Devuelve { ok: boolean, lat?, lon?, nombre?, error?: string }
 */
export async function geocodificarDireccion(direccion) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'Falta OPENWEATHER_API_KEY en las variables de entorno.' };
  }
  if (!direccion || direccion.trim().length === 0) {
    return { ok: false, error: 'Falta la dirección a geocodificar.' };
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    direccion
  )}&limit=1&appid=${apiKey}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return { ok: false, error: `Error al geocodificar: ${res.status}` };
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      return { ok: false, error: 'No se encontró esa dirección.' };
    }

    return {
      ok: true,
      lat: data[0].lat,
      lon: data[0].lon,
      nombre: `${data[0].name}${data[0].state ? ', ' + data[0].state : ''}, ${data[0].country}`,
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}