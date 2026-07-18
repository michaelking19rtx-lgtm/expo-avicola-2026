/**
 * Rutas a /public que respetan el `base` de Astro.
 *
 * El sitio se sirve bajo el subpath /expo-avicola-2026, así que una ruta
 * absoluta tipo "/img/foo.png" se rompe en producción (convención 9 de
 * CLAUDE.md). Este helper es la única forma correcta de construirlas.
 */

/**
 * @param {string} path Ruta dentro de /public, sin barra inicial.
 * @returns {string} Ruta absoluta ya prefijada con el base.
 */
export function asset(path) {
  return `${import.meta.env.BASE_URL}/${path}`.replace(/\/{2,}/g, '/');
}
