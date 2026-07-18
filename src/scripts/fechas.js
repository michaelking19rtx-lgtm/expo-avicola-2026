/**
 * Formato de fechas del evento — Expo Avícola Productiva 2026
 *
 * Vive aparte porque la fecha se pinta en cuatro sitios (boletos, sede, CTA
 * final y footer) y todos comparten la MISMA trampa:
 *
 * `site.fecha` es una fecha sin hora ("2026-08-07"). El motor la interpreta
 * como medianoche UTC, así que formateándola en la zona horaria de México
 * —que va por detrás de UTC— saldría "6 de agosto". De ahí el `timeZone: 'UTC'`
 * en todos los formateadores de aquí.
 *
 * La hora real del evento, con offset explícito, vive en `site.inicio` y la usa
 * la cuenta regresiva del hero. Estas funciones solo se ocupan del día.
 */

/** @param {string} fechaISO Fecha en formato "YYYY-MM-DD". */
function aFecha(fechaISO) {
  return new Date(fechaISO);
}

/**
 * "7 de agosto de 2026"
 * @param {string} fechaISO
 */
export function fechaLarga(fechaISO) {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(aFecha(fechaISO));
}

/**
 * "viernes 7 de agosto de 2026"
 * @param {string} fechaISO
 */
export function fechaConDia(fechaISO) {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(aFecha(fechaISO));
}

/**
 * "7 de agosto 2026" — versión compacta para líneas de apoyo.
 * @param {string} fechaISO
 */
export function fechaCorta(fechaISO) {
  const partes = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(aFecha(fechaISO));

  const buscar = (tipo) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${buscar('day')} de ${buscar('month')} ${buscar('year')}`;
}
