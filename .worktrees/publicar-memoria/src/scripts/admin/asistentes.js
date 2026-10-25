/**
 * Lista de asistentes — Fase 8.
 *
 * La clave restringida de Stripe (solo lectura de Checkout Sessions) vive en
 * Firestore, en `config/stripe.restrictedKey`, y NUNCA en una variable
 * PUBLIC_* ni en el código: una PUBLIC_* de Astro/Vite se incrusta en el JS
 * público en build y cualquiera que visite el sitio —sin loguearse— podría
 * extraerla del bundle y leer datos de clientes directo de la API de Stripe,
 * sin pasar por Firebase Auth. Firestore solo la entrega a quien YA tiene una
 * sesión de Firebase válida (ver `firestore.rules`), que es exactamente el
 * mismo círculo de gente que puede entrar a /admin, porque no hay registro
 * público: cada cuenta la crea a mano quien administra el proyecto Firebase.
 *
 * `api.stripe.com` acepta CORS para llamadas de navegador con clave
 * restringida (lo documenta el propio Stripe), así que no hace falta ningún
 * backend para leer — solo para escribir, y aquí no se escribe nada.
 */

const LIMITE_PAGINA = 100;
const TOPE_SESIONES = 1000; // 10 páginas: de sobra para un solo evento.

// Los price_id del boleto de la expo. La cuenta de Stripe es compartida con
// otros proyectos: sin este filtro, la tabla mezcla compras de boletos con
// compras de cualquier otro producto que use la misma cuenta.
//
// Son DOS, no uno: el precio del boleto subió de $699 a $750 y Stripe le dio
// un price_id nuevo (price_1TvLAJDCxZfVu3387HvuFJZZ, el que usa
// PRICE_ID_WHITELIST en expo-avicola-backend hoy). El viejo
// (price_1TueSWDCxZfVu338dH8YFKOK) sigue siendo el de las ventas reales ya
// hechas a $699 — filtrar solo por el nuevo las habría borrado de la tabla.
const PRICE_IDS_EXPO = new Set([
  'price_1TueSWDCxZfVu338dH8YFKOK',
  'price_1TvLAJDCxZfVu3387HvuFJZZ',
]);

/**
 * @param {import('firebase/firestore')} dbMod
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<string>}
 */
export async function obtenerClaveStripe(dbMod, db) {
  const ref = dbMod.doc(db, 'config', 'stripe');
  const snap = await dbMod.getDoc(ref);

  if (!snap.exists()) {
    throw new Error(
      'No existe el documento config/stripe en Firestore. Falta crearlo con el campo restrictedKey.'
    );
  }

  const clave = snap.data().restrictedKey;
  if (typeof clave !== 'string' || !clave.startsWith('rk_')) {
    throw new Error(
      'config/stripe.restrictedKey no es una Restricted Key válida (debe empezar por "rk_").'
    );
  }

  return clave;
}

/**
 * @param {string} claveStripe
 * @returns {Promise<any[]>} Checkout Sessions crudas de Stripe, sin normalizar.
 */
async function listarCheckoutSessions(claveStripe) {
  /** @type {any[]} */
  const sesiones = [];
  let cursor;

  do {
    const params = new URLSearchParams({ limit: String(LIMITE_PAGINA) });
    params.append('expand[]', 'data.line_items');
    params.append('expand[]', 'data.payment_intent.payment_method');
    if (cursor) params.set('starting_after', cursor);

    const respuesta = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
      headers: { Authorization: `Bearer ${claveStripe}` },
    });

    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => null);
      throw new Error(
        `Stripe respondió ${respuesta.status}: ${cuerpo?.error?.message ?? 'error desconocido'}`
      );
    }

    const pagina = await respuesta.json();
    sesiones.push(...pagina.data);
    cursor = pagina.has_more ? pagina.data.at(-1)?.id : undefined;
  } while (cursor && sesiones.length < TOPE_SESIONES);

  return sesiones;
}

/**
 * @param {any} sesion Checkout Session cruda de Stripe.
 * @returns {any[]} Los line_items de la sesión que son del boleto de la expo.
 */
function lineItemsExpo(sesion) {
  return sesion.line_items?.data?.filter((item) => PRICE_IDS_EXPO.has(item.price?.id)) ?? [];
}

/**
 * @param {any} sesion Checkout Session cruda de Stripe.
 */
function normaliza(sesion) {
  const metodo = sesion.payment_intent?.payment_method?.type ?? null;

  let estado = 'fallido';
  if (sesion.status !== 'expired') {
    if (sesion.payment_status === 'paid' || sesion.payment_status === 'no_payment_required') {
      estado = 'pagado';
    } else if (sesion.payment_status === 'unpaid') {
      estado = metodo === 'oxxo' ? 'pendiente_oxxo' : 'pendiente';
    }
  }

  const cantidad = lineItemsExpo(sesion).reduce((total, item) => total + (item.quantity ?? 0), 0);

  const empresa = Array.isArray(sesion.custom_fields)
    ? (sesion.custom_fields.find((c) => c.text?.value)?.text?.value ?? null)
    : null;

  return {
    id: sesion.id,
    nombre: sesion.customer_details?.name ?? '(sin nombre)',
    correo: sesion.customer_details?.email ?? null,
    telefono: sesion.customer_details?.phone ?? null,
    empresa,
    cantidad,
    importe: (sesion.amount_total ?? 0) / 100,
    moneda: String(sesion.currency ?? 'mxn').toUpperCase(),
    metodo,
    estado,
    fecha: sesion.created ? new Date(sesion.created * 1000) : null,
  };
}

/**
 * @param {import('firebase/firestore')} dbMod
 * @param {import('firebase/firestore').Firestore} db
 */
export async function obtenerAsistentes(dbMod, db) {
  const claveStripe = await obtenerClaveStripe(dbMod, db);
  const crudas = await listarCheckoutSessions(claveStripe);

  return crudas
    .filter((s) => s.status === 'complete' || s.status === 'expired')
    .filter((s) => lineItemsExpo(s).length > 0)
    .map(normaliza)
    .sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0));
}
