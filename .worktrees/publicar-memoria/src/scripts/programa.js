/**
 * Cuentas derivadas de la agenda — Expo Avícola Productiva 2026
 *
 * Existe por una lección cara: el número de conferencias estaba escrito a mano
 * en cinco sitios de cuatro archivos. Al pasar de 6 a 7 hubo que perseguirlo
 * uno por uno, y nada avisaba de los que se quedaran atrás.
 *
 * A partir de aquí el número SALE DE `programa.json`. Si mañana se añade o se
 * quita una ponencia, los textos se actualizan solos.
 *
 * LA EXCEPCIÓN, y está razonada: `boletos.descripcion` NO usa esto. Es texto
 * plano a propósito, para que una persona lo copie tal cual a la descripción
 * del producto en Stripe; con un marcador dentro habría que compilar el sitio
 * para obtener el texto final. Lo que la protege es
 * `avisaSiElConteoSeDesfasa()` en `schema.js`, que grita en build si deja de
 * cuadrar con la agenda.
 */
import programa from '../data/programa.json';

/**
 * Cuántas conferencias hay en la agenda.
 *
 * Solo `tipo: 'ponencia'`. El panel, el show, el coffee y la logística no son
 * conferencias, y esa distinción ya vive en los datos.
 *
 * @returns {number}
 */
export function totalConferencias() {
  return (programa.bloques ?? []).filter((b) => b.tipo === 'ponencia').length;
}

/**
 * El número en letra, femenino ("siete" conferencias).
 *
 * En prosa castellana los números pequeños van en letra, y dos de los textos
 * que lo usan abren frase —"Siete conferencias, un panel…"—, donde una cifra
 * queda especialmente mal.
 *
 * Llega hasta doce porque un congreso de un día no da para más; por encima
 * devuelve la cifra, que es preferible a inventar una tabla que nadie va a
 * mantener.
 *
 * @param {number} n
 * @returns {string}
 */
export function enPalabra(n) {
  const palabras = [
    'cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis',
    'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
  ];
  return palabras[n] ?? String(n);
}

/**
 * Sustituye los marcadores de conteo en un texto que viene de un JSON de datos.
 *
 * Los componentes `.astro` no necesitan esto: interpolan directamente. Esto es
 * para las cadenas que viven dentro de `faq.json` y `boletos.json`, donde no se
 * puede ejecutar código.
 *
 * - `{conferencias}`        → "7"
 * - `{conferenciasPalabra}` → "siete"
 *
 * Se dejan los dos porque los textos existentes no siguen el mismo estilo: la
 * lista de boletos usa cifra y la FAQ usa letra. Unificarlos sería una decisión
 * editorial, no técnica, así que cada texto conserva la suya.
 *
 * @param {string} texto
 * @returns {string}
 */
export function conConteo(texto) {
  const n = totalConferencias();
  return String(texto)
    .replaceAll('{conferenciasPalabra}', enPalabra(n))
    .replaceAll('{conferencias}', String(n));
}
