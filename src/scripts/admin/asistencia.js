/**
 * Registro de llegadas para /asistencia.
 *
 * Stripe sigue siendo la fuente de las compras pagadas. Firestore guarda dos
 * cosas: las personas agregadas manualmente y el estado de llegada de cada
 * registro. Esto evita copiar datos personales al build estático y permite que
 * varios teléfonos vean los cambios en tiempo real.
 */

export const EVENTO_ID = 'expo-avicola-2026';

function coleccionRegistros(dbMod, db) {
  return dbMod.collection(db, 'eventos', EVENTO_ID, 'registros');
}

function aFecha(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function normalizaBusqueda(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function idDeStripe(id) {
  return `stripe_${id}`;
}

function normalizaGuardado(doc) {
  const datos = doc.data();
  const cantidad = Math.max(1, Number(datos.cantidad) || 1);
  const cantidadLlegadas = Math.min(cantidad, Math.max(0, Number(datos.cantidadLlegadas) || 0));

  return {
    id: doc.id,
    origen: datos.origen === 'stripe' ? 'stripe' : 'manual',
    nombre: String(datos.nombre || '(sin nombre)'),
    correo: datos.correo || null,
    telefono: datos.telefono || null,
    empresa: datos.empresa || null,
    cantidad,
    estadoPago: datos.estadoPago || (datos.origen === 'stripe' ? 'pagado' : 'manual'),
    stripeSessionId: datos.stripeSessionId || null,
    cantidadLlegadas,
    ultimaLlegada: aFecha(datos.ultimaLlegada),
    actualizadoEn: aFecha(datos.actualizadoEn),
    actualizadoPorCorreo: datos.actualizadoPorCorreo || null,
  };
}

/**
 * Combina las compras pagadas de Stripe con los documentos guardados.
 * Los documentos de Stripe conservan una copia mínima del comprador para que
 * una persona ya registrada siga visible si Stripe falla temporalmente.
 */
export function combinarRegistros(asistentesStripe, guardados) {
  const porId = new Map(guardados.map((registro) => [registro.id, registro]));
  const idsStripeVigentes = new Set();
  const resultado = [];

  for (const asistente of asistentesStripe.filter((item) => item.estado === 'pagado')) {
    const id = idDeStripe(asistente.id);
    idsStripeVigentes.add(id);
    const guardado = porId.get(id);
    const cantidad = Math.max(1, Number(asistente.cantidad) || 1);

    resultado.push({
      id,
      origen: 'stripe',
      nombre: asistente.nombre,
      correo: asistente.correo || null,
      telefono: asistente.telefono || null,
      empresa: asistente.empresa || null,
      cantidad,
      estadoPago: 'pagado',
      stripeSessionId: asistente.id,
      cantidadLlegadas: Math.min(cantidad, guardado?.cantidadLlegadas ?? 0),
      ultimaLlegada: guardado?.ultimaLlegada ?? null,
      actualizadoEn: guardado?.actualizadoEn ?? null,
      actualizadoPorCorreo: guardado?.actualizadoPorCorreo ?? null,
    });
  }

  for (const guardado of guardados) {
    if (guardado.origen === 'manual' || !idsStripeVigentes.has(guardado.id)) {
      resultado.push(guardado);
    }
  }

  return resultado;
}

/**
 * @param {import('firebase/firestore')} dbMod
 * @param {import('firebase/firestore').Firestore} db
 * @param {(registros: any[]) => void} alCambiar
 * @param {(error: Error) => void} alError
 */
export function suscribirRegistros(dbMod, db, alCambiar, alError) {
  return dbMod.onSnapshot(
    coleccionRegistros(dbMod, db),
    (snap) => alCambiar(snap.docs.map(normalizaGuardado)),
    alError
  );
}

function datosBase(registro, usuario) {
  return {
    origen: registro.origen,
    nombre: String(registro.nombre).trim(),
    nombreBusqueda: normalizaBusqueda(registro.nombre),
    correo: registro.correo ? String(registro.correo).trim() : null,
    telefono: registro.telefono ? String(registro.telefono).trim() : null,
    empresa: registro.empresa ? String(registro.empresa).trim() : null,
    cantidad: Math.max(1, Number(registro.cantidad) || 1),
    estadoPago: registro.origen === 'stripe' ? 'pagado' : 'manual',
    stripeSessionId: registro.stripeSessionId || null,
    actualizadoPorUid: usuario.uid,
    actualizadoPorCorreo: usuario.email || null,
  };
}

/** Cambia la cantidad de llegadas dentro de una transacción para evitar dobles marcas. */
export async function cambiarLlegadas(dbMod, db, registro, delta, usuario) {
  const ref = dbMod.doc(db, 'eventos', EVENTO_ID, 'registros', registro.id);

  return dbMod.runTransaction(db, async (transaccion) => {
    const snap = await transaccion.get(ref);
    const actual = snap.exists()
      ? Number(snap.data().cantidadLlegadas) || 0
      : Number(registro.cantidadLlegadas) || 0;
    const cantidad = Math.max(1, Number(registro.cantidad) || 1);
    const siguiente = Math.min(cantidad, Math.max(0, actual + delta));

    if (siguiente === actual) return siguiente;

    const datos = {
      ...datosBase(registro, usuario),
      cantidadLlegadas: siguiente,
      actualizadoEn: dbMod.serverTimestamp(),
      ultimaLlegada:
        delta > 0
          ? dbMod.serverTimestamp()
          : siguiente === 0
            ? null
            : (snap.data()?.ultimaLlegada ?? registro.ultimaLlegada ?? null),
    };

    if (!snap.exists()) datos.creadoEn = dbMod.serverTimestamp();
    transaccion.set(ref, datos, { merge: true });
    return siguiente;
  });
}

/** Agrega una persona o grupo manual a la lista privada. */
export async function agregarRegistroManual(dbMod, db, entrada, usuario) {
  const registro = {
    origen: 'manual',
    nombre: String(entrada.nombre).trim(),
    correo: entrada.correo ? String(entrada.correo).trim() : null,
    telefono: entrada.telefono ? String(entrada.telefono).trim() : null,
    empresa: entrada.empresa ? String(entrada.empresa).trim() : null,
    cantidad: Math.min(20, Math.max(1, Number(entrada.cantidad) || 1)),
    stripeSessionId: null,
  };

  return dbMod.addDoc(coleccionRegistros(dbMod, db), {
    ...datosBase(registro, usuario),
    cantidadLlegadas: 0,
    ultimaLlegada: null,
    creadoEn: dbMod.serverTimestamp(),
    actualizadoEn: dbMod.serverTimestamp(),
  });
}
