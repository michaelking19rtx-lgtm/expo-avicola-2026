/**
 * Capa de movimiento — Expo Avícola Productiva 2026
 *
 * Un único punto de arranque para Lenis (smooth scroll) y GSAP + ScrollTrigger.
 *
 * REGLA: si el usuario pide menos movimiento, aquí no se inicializa NADA. Ni
 * Lenis ni GSAP. El contenido se queda en su estado final, que es justo lo que
 * pintan los estilos base (el ocultado previo a la animación vive tras
 * `[data-motion='on']`, y ese atributo se pone a 'off' en ese caso).
 *
 * Este módulo es SIEMPRE una mejora progresiva: quien lo importa debe hacerlo
 * de forma dinámica, después de haber resuelto lo esencial de la página.
 */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/** @typedef {{ gsap: typeof gsap | null, lenis: Lenis | null, reduced: boolean }} Motion */

/** @type {Motion | null} */
let motion = null;

/** @type {MediaQueryList | null} */
let consultaMovimiento = null;

/** @returns {boolean} */
export function prefersReducedMotion() {
  try {
    if (!consultaMovimiento) {
      consultaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    }
    return consultaMovimiento.matches;
  } catch {
    // Sin matchMedia, lo prudente es no animar.
    return true;
  }
}

/**
 * Apaga todo el movimiento y deja la página en su estado final.
 * Se usa cuando el usuario activa "reducir movimiento" con la página abierta.
 */
function detenerMovimiento() {
  if (!motion || motion.reduced) return;

  const { gsap: g, lenis: l } = motion;

  try {
    ScrollTrigger.getAll().forEach((t) => t.kill());
  } catch {
    /* nada que limpiar */
  }

  try {
    if (g) {
      g.globalTimeline.getChildren(true, true, true).forEach((t) => t.kill());
      // clearProps devuelve los elementos a lo que dicta el CSS; como
      // data-motion pasa a 'off', eso equivale al estado final visible.
      g.set('[data-anim], [data-hero-media], [data-hero-float], [data-hero-frame]', {
        clearProps: 'all',
      });
      g.ticker.lagSmoothing(500, 33);
    }
  } catch {
    /* nada que limpiar */
  }

  try {
    l?.destroy();
  } catch {
    /* nada que limpiar */
  }

  document.documentElement.dataset.motion = 'off';
  motion = { gsap: null, lenis: null, reduced: true };
}

/**
 * Arranca la capa de movimiento. Idempotente: los componentes pueden llamarla
 * sin coordinarse entre ellos.
 *
 * @returns {Motion}
 */
export function initMotion() {
  if (motion) return motion;

  const root = document.documentElement;
  const reducido = prefersReducedMotion();

  /*
    El <head> revela el contenido por su cuenta a los 3 s si este bundle no ha
    llegado (data-motion pasa a 'off'). Si eso YA ocurrió —red lenta— animar
    ahora escondería de golpe algo que el usuario lleva rato viendo. En ese
    caso se renuncia a la animación de entrada: llegamos tarde.
  */
  const revelaronSinNosotros = root.dataset.motion === 'off';

  // Avisa al failsafe de que el bundle llegó (si aún no ha saltado).
  root.dataset.motionReady = '1';

  if (reducido || revelaronSinNosotros) {
    root.dataset.motion = 'off';
    motion = { gsap: null, lenis: null, reduced: true };
    return motion;
  }

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  // Lenis nace con autoRaf:false, así que el único reloj es el de GSAP. Un solo
  // rAF para todo evita que scroll y animaciones vayan a destiempo.
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  motion = { gsap, lenis, reduced: false };

  // El usuario puede activar "reducir movimiento" con la página ya abierta.
  try {
    consultaMovimiento?.addEventListener('change', (evento) => {
      if (evento.matches) detenerMovimiento();
    });
  } catch {
    /* navegador sin addEventListener en MediaQueryList */
  }

  /*
    El hero cambia de altura cuando entra la fuente display o la imagen de
    ponentes; sin refrescar, los ScrollTrigger quedan calculados sobre la
    altura vieja y el parallax se desincroniza.
  */
  try {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  } catch {
    /* sin Font Loading API */
  }
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  return motion;
}

/** @returns {Lenis | null} */
export function getLenis() {
  return motion ? motion.lenis : null;
}

/**
 * Resuelve un hash a un elemento sin reventar con selectores inválidos
 * (p. ej. "#2026", que no es un selector CSS legal).
 *
 * @param {string} hash
 * @returns {Element | null}
 */
function destinoDeHash(hash) {
  if (!hash || hash === '#') return null;
  try {
    return document.querySelector(hash);
  } catch {
    return null;
  }
}

/** Altura real de la nav fija, en px negativos para usar como offset. */
function offsetNav() {
  const nav = document.querySelector('[data-nav]');
  return nav instanceof HTMLElement ? -nav.offsetHeight : 0;
}

/**
 * Mueve el foco al destino de un ancla.
 *
 * Imprescindible: al hacer preventDefault se pierde el traslado de foco que el
 * navegador hace de serie, y sin él un enlace de salto ("Saltar al contenido")
 * deja de servir para nada a quien navega con teclado.
 *
 * @param {Element} destino
 */
function enfocarDestino(destino) {
  if (!(destino instanceof HTMLElement)) return;

  const yaFocalizable =
    destino.hasAttribute('tabindex') ||
    destino.matches('a[href], button, input, select, textarea, [contenteditable]');

  if (!yaFocalizable) destino.setAttribute('tabindex', '-1');

  // preventScroll: el desplazamiento lo lleva Lenis; el navegador no debe pelear.
  destino.focus({ preventScroll: true });
}

/**
 * Enlaces ancla dentro de la página, compensando la altura de la nav fija.
 *
 * Solo intercepta cuando el destino EXISTE: durante las fases intermedias hay
 * enlaces a secciones aún no construidas (#ponentes, #programa…) y deben
 * quedarse quietos en vez de saltar al inicio.
 */
export function bindAnchors() {
  const lenis = getLenis();
  if (!lenis) return; // Sin Lenis, el scroll nativo ya hace lo correcto.

  /*
    Deep-link con hash (llegar directo a /#boletos desde fuera).

    El navegador hace su salto nativo antes de que Lenis exista, y en cuanto
    Lenis toma el control lo deshace deslizándose de vuelta al inicio. Hay que
    rehacer el posicionamiento por la vía de Lenis. `immediate` evita que se
    vea el recorrido.
  */
  const inicial = destinoDeHash(window.location.hash);
  if (inicial) {
    requestAnimationFrame(() => {
      lenis.scrollTo(/** @type {HTMLElement} */ (inicial), {
        immediate: true,
        offset: offsetNav(),
        force: true,
      });
    });
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement)) return;

    const destino = destinoDeHash(link.getAttribute('href') ?? '');

    if (!destino) {
      // Sección todavía inexistente: no ensuciamos la URL ni saltamos.
      event.preventDefault();
      return;
    }

    event.preventDefault();

    // Un enlace de salto debe llegar de inmediato: recorrer con animación toda
    // la página es justo lo que el enlace intenta evitar.
    const alInstante = link.hasAttribute('data-anchor-immediate');

    lenis.scrollTo(/** @type {HTMLElement} */ (destino), {
      offset: offsetNav(),
      immediate: alInstante,
    });

    enfocarDestino(destino);
  });
}
