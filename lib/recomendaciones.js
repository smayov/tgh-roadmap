/**
 * Genera recomendaciones prácticas para el negocio a partir del
 * tiempo actual y los umbrales configurados.
 * Devuelve un array de { icono, texto }
 */
export function generarRecomendaciones(actual, umbrales) {
  if (!actual) return [];

  const recomendaciones = [];
  const vientoKmh = actual.viento * 3.6; // la API da m/s, los umbrales están en km/h

  if (actual.lluvia > umbrales.lluvia) {
    recomendaciones.push({
      icono: '🌧️',
      texto: `Se esperan lluvias (${actual.lluvia} mm/h) — recoge las mesas de la terraza y protege el mobiliario.`,
    });
  }

  if (vientoKmh > umbrales.viento) {
    recomendaciones.push({
      icono: '💨',
      texto: `Viento fuerte (${Math.round(vientoKmh)} km/h) — baja los toldos y asegura sombrillas y elementos sueltos.`,
    });
  }

  if (actual.temperatura > umbrales.tempMax) {
    recomendaciones.push({
      icono: '🥵',
      texto: `Calor intenso (${Math.round(actual.temperatura)}°C) — refuerza la sombra y ten agua a mano para el personal.`,
    });
  }

  if (actual.temperatura < umbrales.tempMin) {
    recomendaciones.push({
      icono: '🥶',
      texto: `Frío intenso (${Math.round(actual.temperatura)}°C) — la terraza puede no ser atractiva hoy, prioriza el interior.`,
    });
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push({
      icono: '✅',
      texto: 'Condiciones tranquilas — puedes sacar las mesas de la terraza con normalidad.',
    });
  }

  return recomendaciones;
}