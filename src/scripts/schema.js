/**
 * Datos estructurados schema.org — Expo Avícola Productiva 2026
 *
 * Genera el JSON-LD del evento a partir de site.json, programa.json y
 * boletos.json. NADA se escribe a mano aquí: si un dato cambia en su JSON, el
 * marcado cambia solo.
 *
 * REGLA DURA: ningún campo con valor `null` puede acabar en la salida. Un
 * `"name": null` en un Place, o un `streetAddress` vacío, es peor que no
 * declarar el campo — Google lo lee como dato malformado. Por eso todo pasa
 * por `limpiar()` antes de salir.
 */
import site from '../data/site.json';
import programa from '../data/programa.json';
import boletos from '../data/boletos.json';

/**
 * Poda recursiva de null, undefined, strings vacíos, arrays vacíos y objetos
 * que se quedan sin claves.
 *
 * @param {unknown} valor
 * @returns {unknown} El valor podado, o undefined si no queda nada.
 */
function limpiar(valor) {
  if (valor === null || valor === undefined) return undefined;

  if (Array.isArray(valor)) {
    const items = valor.map(limpiar).filter((v) => v !== undefined);
    return items.length ? items : undefined;
  }

  if (typeof valor === 'object') {
    /** @type {Record<string, unknown>} */
    const salida = {};
    for (const [clave, v] of Object.entries(valor)) {
      const limpio = limpiar(v);
      if (limpio !== undefined) salida[clave] = limpio;
    }
    return Object.keys(salida).length ? salida : undefined;
  }

  if (typeof valor === 'string' && valor.trim() === '') return undefined;

  return valor;
}

/**
 * Extrae el desfase horario de `site.inicio` ("...T08:00:00-06:00" → "-06:00").
 *
 * Se saca de ahí en vez de escribirlo a mano para que exista un solo sitio
 * donde vive la zona horaria del evento. Solo se usa el DESFASE: la hora de
 * `site.inicio` no interviene, el rango del evento lo marca `site.horario`.
 *
 * @returns {string} El desfase, o cadena vacía si no se puede determinar.
 */
function desfaseHorario() {
  const encontrado = /([+-]\d{2}:\d{2})$/.exec(String(site.inicio ?? ''));
  return encontrado ? encontrado[1] : '';
}

/**
 * Convierte una hora suelta ("08:00") en un ISO 8601 completo con desfase.
 *
 * @param {string} hora
 * @returns {string | null}
 */
function momento(hora) {
  const limpia = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!limpia || !site.fecha) return null;
  const hh = limpia[1].padStart(2, '0');
  return `${site.fecha}T${hh}:${limpia[2]}:00${desfaseHorario()}`;
}

/**
 * Parte `site.horario` ("08:00 – 16:30") en inicio y fin.
 *
 * OJO: el separador es una raya (–, U+2013), no un guion. Se acepta cualquiera
 * de los dos para que un cambio tipográfico en el JSON no rompa el marcado.
 *
 * @returns {{ inicio: string | null, fin: string | null }}
 */
function franjaHoraria() {
  const partes = String(site.horario ?? '').split(/\s*[–-]\s*/);
  return {
    inicio: partes[0] ? momento(partes[0]) : null,
    fin: partes[1] ? momento(partes[1]) : null,
  };
}

/**
 * Ponentes reales del programa, sin repetir.
 *
 * Se excluye "Por confirmar": declarar una Person con ese nombre sería afirmar
 * que existe alguien que se llama así. Edgar Oliva da dos sesiones y aquí
 * aparece una sola vez.
 *
 * @returns {{ '@type': 'Person', name: string }[]}
 */
function ponentes() {
  const vistos = new Set();

  for (const bloque of programa.bloques ?? []) {
    const nombre = bloque.ponente;
    if (!nombre) continue;
    if (bloque.tipo !== 'ponencia') continue;
    if (nombre.trim().toLowerCase() === 'por confirmar') continue;
    vistos.add(nombre.trim());
  }

  return [...vistos].map((name) => ({ '@type': 'Person', name }));
}

/**
 * Oferta de boletos. Hoy solo hay un boleto; si hubiera más, salen todos.
 *
 * @param {string} urlBoletos URL absoluta de la sección de boletos.
 */
function ofertas(urlBoletos) {
  return boletos.map((boleto) => ({
    '@type': 'Offer',
    name: boleto.nombre,
    price: boleto.precio,
    priceCurrency: boleto.moneda,
    availability: boleto.disponible
      ? 'https://schema.org/InStock'
      : 'https://schema.org/SoldOut',
    // Cuando exista la pasarela, el enlace de compra manda sobre el ancla.
    url: boleto.checkoutUrl ?? urlBoletos,
  }));
}

/**
 * Lugar del evento.
 *
 * Si `site.recinto` es null NO se inventa un nombre: el Place se queda con la
 * dirección administrativa (ciudad, estado, país), que es un dato verdadero.
 * Igual con `streetAddress` y `site.direccion`.
 */
function lugar() {
  return {
    '@type': 'Place',
    name: site.recinto,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.direccion,
      addressLocality: site.localidad,
      addressRegion: site.region,
      addressCountry: site.pais,
    },
  };
}

/**
 * JSON-LD completo del evento.
 *
 * @param {string} canonical URL canónica de la home, ya con el base aplicado.
 * @returns {Record<string, unknown>}
 */
export function eventoJsonLd(canonical) {
  const { inicio, fin } = franjaHoraria();
  const urlBoletos = `${canonical.replace(/\/$/, '')}/#boletos`.replace(
    /([^:])\/\/+/g,
    '$1/'
  );

  const evento = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: site.nombre,
    description: site.tagline,
    startDate: inicio,
    endDate: fin,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: lugar(),
    performer: ponentes(),
    offers: ofertas(urlBoletos),
    organizer: {
      '@type': 'Organization',
      name: site.nombre,
      url: canonical,
    },
    url: canonical,
    inLanguage: 'es-MX',
  };

  return /** @type {Record<string, unknown>} */ (limpiar(evento));
}
