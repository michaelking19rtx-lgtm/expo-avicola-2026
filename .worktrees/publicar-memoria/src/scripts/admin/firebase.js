/**
 * Arranque de Firebase para /admin — Fase 8.
 *
 * Los cuatro valores de `firebaseConfig` (apiKey, authDomain, projectId,
 * appId) NO son secretos: es la propia documentación de Firebase la que dice
 * que van en el cliente y que la seguridad real la ponen las reglas de
 * Auth/Firestore, no ocultar estos IDs. Por eso viajan como variables
 * PUBLIC_* de Astro — igual que cualquier otro dato público del build — y NO
 * como el caso de la clave de Stripe (ver asistentes.js), que sí es secreta.
 *
 * El SDK completo de Firebase pesa varias decenas de KB y solo hace falta en
 * /admin, así que — misma convención que animations.js con GSAP/Lenis — este
 * módulo entero se importa de forma DINÁMICA desde admin.astro, nunca
 * estática.
 */

/** @type {import('firebase/app').FirebaseApp | null} */
let app = null;

function firebaseConfig() {
  const config = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  };

  const faltantes = Object.entries(config)
    .filter(([, valor]) => !valor)
    .map(([clave]) => clave);

  if (faltantes.length) {
    throw new Error(
      `[firebase] Faltan variables de entorno: ${faltantes.join(', ')}. ` +
        `Revisa .env o los secrets del workflow de deploy.`
    );
  }

  return config;
}

/** Inicializa (una sola vez) y devuelve auth + db. */
export async function firebaseListo() {
  const [{ initializeApp, getApps }, authMod, dbMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig());
  }

  const auth = authMod.getAuth(app);
  // Persistencia local: la sesión sobrevive a recargar y a cerrar el navegador,
  // hasta que se pulse "Cerrar sesión". Es exactamente lo que pide el encargo.
  await authMod.setPersistence(auth, authMod.browserLocalPersistence);

  const db = dbMod.getFirestore(app);

  return { auth, db, authMod, dbMod };
}
