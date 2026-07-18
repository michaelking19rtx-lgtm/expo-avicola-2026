/**
 * Rutas a /public que respetan el `base` de Astro.
 *
 * El `base` del sitio se decide en astro.config.mjs y ha cambiado ya una vez
 * (vivió bajo el subpath /expo-avicola-2026 antes del dominio propio). Una
 * ruta absoluta escrita a mano tipo "/img/foo.png" sobrevive por casualidad a
 * un cambio así, no por diseño: este helper es la única forma correcta de
 * construirlas (convención 9 de CLAUDE.md).
 */

/**
 * @param {string} path Ruta dentro de /public, sin barra inicial.
 * @returns {string} Ruta absoluta ya prefijada con el base.
 */
export function asset(path) {
  return `${import.meta.env.BASE_URL}/${path}`.replace(/\/{2,}/g, '/');
}
