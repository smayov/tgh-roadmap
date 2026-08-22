/**
 * Calcula el riesgo únicamente a partir de las respuestas Sí/No de
 * Accesos y RGPD. Los hallazgos manuales no puntúan aquí — se usan
 * para redactar el detalle de la propuesta, no para el indicador.
 * Devuelve { score, label, color, respondidas, totalPreguntas, sinDatos }
 */
export function calcularRiesgo({ accesos, datosRgpd, ACCESOS_ITEMS, DATOS_RGPD_ITEMS }) {
  const items = [
    ...ACCESOS_ITEMS.map((i) => accesos[i.key]),
    ...DATOS_RGPD_ITEMS.map((i) => datosRgpd[i.key]),
  ];
  const totalPreguntas = items.length;
  const respondidas = items.filter((v) => v === 'si' || v === 'no').length;
  const noCount = items.filter((v) => v === 'no').length;

  const score = respondidas > 0 ? Math.round((noCount / respondidas) * 10 * 10) / 10 : 0;
  const sinDatos = respondidas === 0;

  const label = sinDatos
    ? 'Sin datos aún'
    : score >= 7
    ? 'Riesgo alto'
    : score >= 4
    ? 'Riesgo medio'
    : 'Riesgo bajo';

  const color = sinDatos ? '#a3a3a3' : score >= 7 ? '#dc2626' : score >= 4 ? '#d97706' : '#16a34a';

  return { score, label, color, respondidas, totalPreguntas, sinDatos };
}