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
import heroPonentes from '../data/hero-ponentes.json';

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
 * Parte un rango ("08:00 – 16:30") en dos ISO 8601 completos.
 *
 * Lo usan tanto `site.horario` (el evento entero) como el `hora` de cada bloque
 * del programa, que tienen exactamente el mismo formato.
 *
 * OJO: el separador es una raya (–, U+2013), no un guion. Se acepta cualquiera
 * de los dos para que un cambio tipográfico en el JSON no rompa el marcado.
 *
 * Un bloque sin rango —la clausura es solo "16:30"— devuelve `fin: null`, y
 * `limpiar()` se encarga de podarlo.
 *
 * @param {string | undefined} rango
 * @returns {{ inicio: string | null, fin: string | null }}
 */
function franjaHoraria(rango) {
  const partes = String(rango ?? '').split(/\s*[–-]\s*/);
  return {
    inicio: partes[0] ? momento(partes[0]) : null,
    fin: partes[1] ? momento(partes[1]) : null,
  };
}

/**
 * ¿Este nombre de ponente es un marcador de "todavía no lo sabemos"?
 *
 * Vive en el ámbito del módulo porque lo consultan dos sitios: la lista de
 * `performer` del evento y el `performer` de cada sesión.
 *
 * @param {string} nombre
 */
function esPendiente(nombre) {
  const n = nombre.trim().toLowerCase();
  return n.startsWith('ponente por confirmar') || n === 'por confirmar';
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

  // 1. Quien tiene ponencia asignada en la agenda.
  for (const bloque of programa.bloques ?? []) {
    const nombre = bloque.ponente;
    if (!nombre) continue;
    if (bloque.tipo !== 'ponencia') continue;
    if (esPendiente(nombre)) continue;
    vistos.add(nombre.trim());
  }

  /*
    2. Y quien está anunciado en el hero.

    Hacen falta LAS DOS fuentes, y ninguna basta sola: un ponente puede estar
    confirmado y anunciado, con título de ponencia y todo, sin tener todavía
    HUECO en la agenda —hoy es el caso de IBQ. Esteban Fructuoso Alducin, cuya
    sesión está escrita pero sin horario asignado—, y a la inversa, la agenda
    podría llevar a alguien que no salga en el hero.

    Un `performer` es quien participa en el evento, no quien tiene hueco en el
    horario, así que quedarse solo con la agenda dejaría fuera a una persona
    real. Se unen y se deduplica: Edgar da dos sesiones y aparece una vez.
  */
  for (const figura of heroPonentes) {
    const nombre = figura?.nombre;
    if (!nombre || esPendiente(nombre)) continue;
    vistos.add(nombre.trim());
  }

  return [...vistos].map((name) => ({ '@type': 'Person', name }));
}

/**
 * Cada conferencia como `subEvent` del congreso.
 *
 * Solo los bloques `tipo: 'ponencia'`. El registro, el coffee, el show, la
 * comida y la clausura NO son sub-eventos: son logística del mismo evento, y
 * declararlos como `Event` propios ensuciaría el grafo con cosas que nadie
 * busca ni a las que nadie asiste por separado.
 *
 * **Cada sesión repite `location`.** Un `subEvent` es un `Event` completo y
 * Google lo valida como tal —name, startDate y location son sus campos
 * obligatorios—, así que heredar la sede del padre no basta: sin `location`
 * cada sesión saldría con un aviso. El coste es repetir el Place siete veces;
 * lo he preferido a un marcado que valida con advertencias.
 *
 * El `performer` va como ARRAY de una persona aunque hoy nunca haya dos: es el
 * tipo que schema.org espera y evita que añadir un segundo ponente a una mesa
 * obligue a cambiar la forma del campo.
 *
 * @returns {Record<string, unknown>[]}
 */
function sesiones() {
  return (programa.bloques ?? [])
    .filter((bloque) => bloque.tipo === 'ponencia')
    .map((bloque) => {
      const { inicio, fin } = franjaHoraria(bloque.hora);
      const ponente = bloque.ponente?.trim();
      return {
        '@type': 'Event',
        name: bloque.titulo,
        startDate: inicio,
        endDate: fin,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: lugar(),
        /*
          Una sesión sin ponente confirmado se declara igual —la sesión existe
          y tiene hora—, pero SIN `performer`. Afirmar que actúa alguien
          llamado "Por confirmar" es peor que no decir quién actúa.
        */
        performer:
          ponente && !esPendiente(ponente)
            ? [{ '@type': 'Person', name: ponente }]
            : undefined,
      };
    });
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
    /*
      `descripcion` de boletos.json es TEXTO PLANO a propósito, no una
      plantilla con `{recinto}`: su razón de ser es que una persona lo copie
      tal cual a la descripción del producto en Stripe, y con marcadores
      dentro habría que compilar el sitio para obtener el texto final.

      Lo que protege de que se desincronice del resto de los datos es
      `avisaSiLaDescripcionSeDesfasa()`, unas líneas más abajo.
    */
    description: boleto.descripcion,
    price: boleto.precio,
    priceCurrency: boleto.moneda,
    availability: boleto.disponible
      ? 'https://schema.org/InStock'
      : 'https://schema.org/SoldOut',
    // Con la pasarela viva, el enlace de compra manda sobre el ancla.
    url: boleto.checkoutUrl ?? urlBoletos,
  }));
}

/**
 * Avisa en build si la descripción del boleto dejó de nombrar el recinto o la
 * ciudad que hay en site.json.
 *
 * El caso que evita: cambia la sede, alguien actualiza site.json, y la
 * descripción —que es texto plano— se queda nombrando el salón anterior. Ese
 * texto acaba en el JSON-LD y, peor, alguien lo copia a Stripe, así que el
 * comprador ve una sede equivocada justo al pagar.
 *
 * Es un aviso y no una excepción: si algún día la descripción se reescribe sin
 * nombrar la sede, es una decisión editorial legítima y no debe tumbar el
 * build. Lo que no puede es pasar en silencio.
 */
function avisaSiLaDescripcionSeDesfasa() {
  const conferencias = (programa.bloques ?? []).filter(
    (b) => b.tipo === 'ponencia'
  ).length;

  for (const boleto of boletos) {
    if (!boleto.descripcion) continue;
    for (const [clave, valor] of [
      ['recinto', site.recinto],
      ['ciudad', site.ciudad],
    ]) {
      if (valor && !boleto.descripcion.includes(valor)) {
        console.warn(
          `[boletos] La descripción de "${boleto.id}" no nombra ${clave} ` +
            `("${valor}") de site.json. Si la sede cambió, actualiza también ` +
            `boletos.json Y la descripción del producto en Stripe.`
        );
      }
    }

    /*
      El conteo de conferencias, que es el único sitio del proyecto donde ese
      número sigue escrito a mano.

      No se interpola —ver el comentario de `description` en `ofertas()`— así
      que lo que queda es gritar cuando deja de cuadrar. Se busca el número
      seguido de "conferencia": si la agenda pasa a 8 y la descripción sigue
      diciendo 7, esto salta en build.
    */
    const dice = new RegExp(`\\b${conferencias}\\s+conferencias?\\b`).test(
      boleto.descripcion
    );
    if (!dice) {
      console.warn(
        `[boletos] La descripción de "${boleto.id}" no dice ` +
          `"${conferencias} conferencias", y la agenda tiene ${conferencias} ` +
          `bloques de tipo "ponencia". Actualiza boletos.json Y la descripción ` +
          `del producto en Stripe, que vive fuera del repo.`
      );
    }
  }
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
    /*
      `geo` solo si hay coordenadas. Es el dato que permite a un buscador
      situar el evento en un mapa sin depender de geocodificar la calle, que
      con una dirección mexicana abreviada («Pue.») no siempre acierta.

      Si `site.coordenadas` no existe, esto queda en undefined y `limpiar()`
      lo poda igual que a los demás nulos: declarar un GeoCoordinates vacío
      sería peor que no declararlo.
    */
    geo: site.coordenadas
      ? {
          '@type': 'GeoCoordinates',
          latitude: site.coordenadas.lat,
          longitude: site.coordenadas.lng,
        }
      : undefined,
  };
}

/**
 * JSON-LD completo del evento.
 *
 * @param {string} canonical URL canónica de la home, ya con el base aplicado.
 * @returns {Record<string, unknown>}
 */
export function eventoJsonLd(canonical) {
  // Corre en build, que es cuando se genera el JSON-LD. No añade nada al
  // bundle del cliente.
  avisaSiLaDescripcionSeDesfasa();

  const { inicio, fin } = franjaHoraria(site.horario);
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
    subEvent: sesiones(),
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
