/**
 * Convierte una dirección en texto a coordenadas lat/lon
 * usando Nominatim (OpenStreetMap) — gratuito, sin API key.
 * Devuelve { ok: boolean, lat?, lon?, nombre?, error?: string }
 */
export async function geocodificarDireccion(direccion) {
  if (!direccion || direccion.trim().length === 0) {
    return { ok: false, error: 'Falta la dirección a geocodificar.' };
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    direccion
  )}&format=json&limit=1&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim exige identificar la app que hace la petición
        'User-Agent': 'TuGestorHostelero/1.0 (contacto@tugestorhostelero.es)',
      },
    });

    if (!res.ok) {
      return { ok: false, error: `Error al geocodificar: ${res.status}` };
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      return { ok: false, error: 'No se encontró esa dirección.' };
    }

    return {
      ok: true,
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      nombre: data[0].display_name,
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}