/**
 * Control de tema — Expo Avícola Productiva 2026
 *
 * El tema vive en el atributo `data-theme` de <html> y se persiste en
 * localStorage bajo la clave "expo-theme".
 *
 * Nota: la aplicación del tema guardado en el arranque NO ocurre aquí — la hace
 * un script inline en el <head> de Base.astro para evitar el flash (FOUC).
 * Este módulo es para cambios en runtime.
 */

/** @typedef {'green' | 'blue'} Theme */

export const STORAGE_KEY = 'expo-theme';

/** @type {readonly Theme[]} */
export const THEMES = ['green', 'blue'];

export const DEFAULT_THEME = 'green';

/**
 * @param {unknown} value
 * @returns {value is Theme}
 */
export function isTheme(value) {
  return typeof value === 'string' && THEMES.includes(/** @type {Theme} */ (value));
}

/**
 * Tema activo actual, leído del DOM (fuente de verdad en runtime).
 * @returns {Theme}
 */
export function getTheme() {
  const current = document.documentElement.dataset.theme;
  return isTheme(current) ? current : DEFAULT_THEME;
}

/**
 * Tema guardado en localStorage, o null si no hay ninguno válido.
 * @returns {Theme | null}
 */
export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // Modo privado / storage bloqueado: se ignora silenciosamente.
    return null;
  }
}

/**
 * Aplica el tema, lo persiste y notifica al resto de la página.
 * @param {Theme} theme
 * @returns {Theme} el tema efectivo tras la llamada
 */
export function setTheme(theme) {
  if (!isTheme(theme)) {
    console.warn(`[theme] Tema desconocido: "${theme}". Se ignora.`);
    return getTheme();
  }

  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sin persistencia disponible: el tema sigue aplicado en esta sesión.
  }

  document.dispatchEvent(
    new CustomEvent('themechange', { detail: { theme } })
  );

  return theme;
}

/**
 * Alterna entre verde y azul.
 * @returns {Theme}
 */
export function toggleTheme() {
  return setTheme(getTheme() === 'green' ? 'blue' : 'green');
}

// Expuesto en window para depurar desde consola. Ojo: solo existe en las
// páginas que importan este módulo en cliente — hoy únicamente /admin.
if (typeof window !== 'undefined') {
  Object.assign(window, { setTheme, getTheme, toggleTheme });
}
