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
      /*
        clearProps devuelve los elementos a lo que dicta el CSS; como
        data-motion pasa a 'off', eso equivale al estado final visible.

        Este selector tiene que cubrir TODO lo que la capa de movimiento llegue
        a tocar, no solo lo marcado con [data-anim]. Los elementos que se animan
        con .from() (hoy [data-anim-punto], los puntos de la tarjeta de boletos)
        son el caso peligroso: GSAP les escribe opacity:0 EN LÍNEA y no hay
        ninguna regla CSS que los rescate después, así que si se quedan fuera de
        esta limpieza desaparecen para siempre al activar "reducir movimiento"
        a media animación.
      */
      g.set(
        '[data-anim], [data-anim-punto], [data-hero-media], [data-hero-float],' +
          ' [data-fig-entrada], [data-fig-flota]',
        { clearProps: 'all' }
      );
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

  /*
    ARRANQUE PROTEGIDO. Dos líneas más arriba se puso motionReady='1', que
    DESARMA el failsafe del <head> — el que devuelve data-motion a 'off' a los
    3 s para que el contenido nunca se quede escondido.

    Si a partir de aquí algo revienta (registerPlugin, el constructor de
    Lenis, una API que el navegador no trae), la excepción sube hasta el
    `.catch()` de quien llamó, que en los once componentes está vacío a
    propósito. Resultado sin este try: `motion` se queda en null, data-motion
    se queda en 'on' y TODOS los [data-anim] de la página —72 solo en el
    hero— se quedan en opacity 0 para siempre, sin nadie que los rescate.

    Así que el rescate se hace aquí, que es el único sitio que se entera.
  */
  let lenis;
  try {
    gsap.registerPlugin(ScrollTrigger);

    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Lenis nace con autoRaf:false, así que el único reloj es el de GSAP. Un
    // solo rAF para todo evita que scroll y animaciones vayan a destiempo.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } catch {
    root.dataset.motion = 'off';
    motion = { gsap: null, lenis: null, reduced: true };
    return motion;
  }

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
 * ¿El destino de este hash es una ficha de ponente, es decir, un MODAL?
 *
 * Las fichas son `<dialog data-ficha>` y con JavaScript se abren con
 * `showModal()`, que las manda a la capa superior. Una vez ahí **su posición
 * en el documento deja de significar nada**: se posicionan contra el viewport,
 * así que su `offsetTop` resuelve a ~0. Pedirle a Lenis que se desplace hasta
 * una de ellas equivale a pedirle que se vaya al principio de la página.
 *
 * @param {string} hash
 * @returns {Element | null} la ficha, o null si el destino no es una.
 */
function fichaDeHash(hash) {
  const destino = destinoDeHash(hash);
  return destino instanceof Element && destino.matches('dialog[data-ficha]')
    ? destino
    : null;
}

/** La sección de Ponentes, que es el contexto de cualquier ficha. */
function seccionPonentes() {
  return document.querySelector('#ponentes');
}

/**
 * Enlaces ancla dentro de la página, compensando la altura de la nav fija.
 *
 * Solo intercepta cuando el destino EXISTE: durante las fases intermedias hay
 * enlaces a secciones aún no construidas (#ponentes, #programa…) y deben
 * quedarse quietos en vez de saltar al inicio.
 *
 * **LAS FICHAS DE PONENTE SON LA EXCEPCIÓN Y NO SE TOCAN AQUÍ.** Las abre
 * `Ponentes.astro` como modal, sin mover el scroll. Ver `fichaDeHash`.
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
  const hashInicial = window.location.hash;
  /*
    LLEGAR CON #ponente-slug ES EL ÚNICO CASO EN QUE EL SCROLL SE MUEVE, y se
    mueve a la SECCIÓN, no a la ficha. Quien abre un enlace de WhatsApp merece
    ver el contexto detrás del modal; desplazarse a la ficha en sí llevaría al
    principio de la página, por lo que explica `fichaDeHash`.
  */
  const inicial = fichaDeHash(hashInicial)
    ? seccionPonentes()
    : destinoDeHash(hashInicial);

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

    const href = link.getAttribute('href') ?? '';

    /*
      FICHA DE PONENTE: NI SCROLL NI preventDefault. Se sale sin tocar nada y
      manda `Ponentes.astro`, que abre el modal in situ.

      Se sale SIN preventDefault a propósito, y no es un descuido: si el script
      de Ponentes no llegara a correr, el <a> tiene que seguir siendo un ancla
      normal al id de la ficha. Cancelar aquí lo dejaría muerto.

      Y no depende del orden de registro de los dos listeners: los dos están en
      el documento y en burbuja, y cualquiera de los dos órdenes da el mismo
      resultado —este se desentiende, el otro cancela y abre—.
    */
    if (fichaDeHash(href)) return;

    const destino = destinoDeHash(href);

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
