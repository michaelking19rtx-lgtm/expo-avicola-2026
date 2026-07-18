# CLAUDE.md — Expo Avícola Productiva 2026

> **REGLA: Actualiza este archivo al terminar CADA fase (qué se hizo, decisiones, estado). Léelo completo antes de tocar el proyecto.**

---

## 1. El proyecto

Landing de una sola página para una conferencia del sector avícola.

| Dato       | Valor                            |
| :--------- | :------------------------------- |
| Evento     | **Expo Avícola Productiva 2026** |
| Fecha      | 7 de agosto de 2026              |
| Sede       | Tehuacán, Puebla                 |
| Tipo       | Landing de evento, estática      |
| Producción | https://michaelking19rtx-lgtm.github.io/expo-avicola-2026 |

Estética: **oscura, editorial, premium**. No es un sitio corporativo genérico ni
un dashboard: es una pieza editorial con jerarquía tipográfica fuerte, mucho
aire y contraste medido.

## 2. Stack

- **Astro 7**, salida 100% estática (`output: 'static'`, sin adaptador).
- **Sin librerías de UI.** Nada de Tailwind, Bootstrap, shadcn ni similares.
- CSS propio, escrito a mano, sobre variables semánticas.
- Fuentes autoalojadas con `@fontsource-variable`:
  - display → `Bricolage Grotesque Variable` → `--font-display`
  - cuerpo → `Inter Variable` → `--font-body`
- **GSAP** (+ ScrollTrigger) y **Lenis**, desde la Fase 2. Viven en
  `src/scripts/animations.js` y **siempre se importan de forma dinámica**
  (`await import(...)`), nunca estática: pesan ~132 KB y ninguna función
  esencial puede depender de que ese chunk llegue.
- Despliegue: GitHub Pages vía `withastro/action@v6` en cada push a `main`.
- `base: '/expo-avicola-2026'` — en local el sitio vive en
  `http://localhost:4321/expo-avicola-2026/`, no en la raíz.

## 3. Estructura de carpetas

```text
expo-avicola-2026/
├── .github/workflows/deploy.yml
├── public/
│   ├── img/{ponentes,hero,patrocinadores,og}/
│   ├── video/
│   └── favicon.svg
├── src/
│   ├── components/{Nav,Hero,VideoSection,Pilares,Programa,ParaQuien}.astro
│   ├── data/{site,programa}.json
│   ├── env.d.ts
│   ├── layouts/Base.astro
│   ├── pages/{index,admin}.astro
│   ├── scripts/{theme,animations,paths}.js
│   └── styles/{tokens,global}.css
├── astro.config.mjs
├── CLAUDE.md
└── README.md
```

## 4. Sistema de doble tema

Dos temas conmutables por el atributo `data-theme` en `<html>`. Verde es el
defecto. **Estos hex viven solo en `src/styles/tokens.css`.**

```css
:root,
[data-theme='green'] {
  --bg: #0a0f0d;
  --surface: #121a16;
  --surface-2: #0e1512;
  --primary: #0e6b4f;
  --primary-bright: #12a87c;
  --accent: #b6e33b;
  --accent-ink: #05110c;
  --text: #f4f1ea;
  --text-muted: #9db0a6;
  --border: rgba(255, 255, 255, 0.07);
}

[data-theme='blue'] {
  --bg: #0a1428;
  --surface: #111e38;
  --surface-2: #0c1730;
  --primary: #1e5fa8;
  --primary-bright: #2e7bd6;
  --accent: #22d3ee;
  --accent-ink: #06101f;
  --text: #eaf2ff;
  --text-muted: #8fa6c6;
  --border: rgba(255, 255, 255, 0.08);
}
```

**Cómo funciona**

- `src/scripts/theme.js` expone `setTheme(t)`, `getTheme()`, `toggleTheme()` e
  `isTheme(v)`. `setTheme` escribe `data-theme`, persiste en `localStorage`
  bajo la clave **`expo-theme`** y emite el evento `themechange` en `document`.
- **`theme.js` solo llega al cliente donde se importa en un `<script>` de
  componente — hoy únicamente `/admin`.** `Base.astro` lo importa en el
  frontmatter, y eso corre en build, no en el navegador. Si una fase futura
  necesita `setTheme` en la landing (p. ej. un toggle en la nav), tendrá que
  importarlo en el `<script>` de ese componente.
- `Base.astro` lleva un **script inline en el `<head>`** que lee `localStorage`
  y aplica el tema **antes del primer pintado**, para que no haya flash. Recibe
  la clave y la lista de temas desde `theme.js` con `define:vars`, así que no
  hay valores duplicados a mano. Ese mismo script se reengancha a `pageshow`
  (bfcache: al volver con «Atrás» el `<head>` no se re-ejecuta) y a `storage`
  (otra pestaña cambió el tema), y en ambos casos emite `themechange`. Así toda
  página queda sincronizada sin cargar un bundle.
- Nunca leas el tema desde JS para pintar: si un estilo depende del tema activo,
  resuélvelo en CSS con `[data-theme='...']` (así no hay estado inicial errado).

## 5. Convenciones de diseño — OBLIGATORIAS

1. **Todo con variables CSS.** Jamás un hex, rgb o hsl directo en un componente.
   Si falta un token, agrégalo a `tokens.css` — no lo inventes en el componente.
2. **Nunca emojis en la UI.** Iconos SVG de trazo fino (1–1.75px), inline,
   con `aria-hidden="true"` cuando son decorativos.
3. **Nada de controles nativos.** Dropdowns, date pickers, selects, scrollbars y
   tooltips se construyen a mano. La scrollbar ya está personalizada en
   `global.css`.
4. **Animaciones con propósito.** Entradas, cambios de estado y transiciones que
   comuniquen algo. Nada de movimiento decorativo permanente ni rebotes: usa
   `--ease-out` / `--ease-in-out` y las duraciones `--t-*`.
5. **Respeta `prefers-reduced-motion`.** El corte global está en `global.css`;
   cualquier animación imperativa (GSAP) debe consultarlo explícitamente.
6. **Accesibilidad no negociable.** Contraste AA, foco visible (`:focus-visible`
   ya definido), HTML semántico, roles ARIA correctos y navegación por teclado.
7. **Sin dependencias nuevas** sin una razón escrita en este archivo.
8. **Español (México)** en todo el texto de cara al usuario. `lang="es"`.
9. Rutas a `/public` siempre a través del `base` de Astro
   (`import.meta.env.BASE_URL`), nunca absolutas tipo `/img/foo.png`.
10. **Revisa `git status` antes de CADA commit.** Mira la lista completa de
    archivos que vas a incluir, no solo los que tocaste a propósito. En la
    Fase 2 se coló un `dbg2.mjs` de depuración y hubo que borrarlo en un commit
    aparte. Los scripts temporales no van al repo.

## 6. Roadmap

| Fase | Alcance                                                                  | Estado         |
| :--- | :----------------------------------------------------------------------- | :------------- |
| 1    | Cimientos: arquitectura, doble tema, `/admin` mínimo, deploy              | **COMPLETADA** |
| 2    | Nav + hero + sección de video, con capa de movimiento (GSAP, Lenis)      | **COMPLETADA** |
| 3    | Ponentes: fichas con foto, cargo y sesión                                 | **POSPUESTA**  |
| 4    | Pilares + programa/agenda + ¿Para quién es?                               | **COMPLETADA** |
| 5    | Boletos: planes, precios, CTA de registro                                 | Pendiente      |
| 6    | Patrocinadores, sede y ubicación, FAQ, footer                             | Pendiente      |
| 7    | SEO, Open Graph, rendimiento, auditoría de accesibilidad, pulido          | Pendiente      |
| 8    | `/admin` real: autenticación y persistencia global del tema               | Pendiente      |

> **La numeración cambió al empezar la Fase 4.** El plan original metía
> «programa/agenda» y «ponentes» juntos en la Fase 3. Al posponerse ponentes por
> falta de fotos, el resto del contenido se sacó a la Fase 4 y todo lo que venía
> detrás corrió un número (boletos pasó de 4 a 5, y así). La Fase 3 se queda
> reservada para ponentes: se construye cuando lleguen las fotos, sin importar
> que para entonces existan fases con número mayor ya cerradas.

> El alcance de las fases siguientes es una propuesta; ajústalo con el cliente
> antes de empezar cada una.

---

## 7. Riesgos abiertos

> Revisa esta sección antes de dar por publicable cualquier fase.

### Anclas de navegación que no llevan a ningún sitio · ABIERTO (parcial)

Estado tras la Fase 4:

| Ancla        | Enlaces | ¿Existe el destino? |
| :----------- | ------: | :------------------ |
| `#programa`  |       3 | **SÍ** — creado en la Fase 4 |
| `#ponentes`  |       2 | NO — Fase 3, pospuesta |
| `#sede`      |       2 | NO — Fase 6 |
| `#boletos`   |       5 | NO — Fase 5 |

Quedan **9 enlaces muertos de los 12 originales**. El más caro es `#boletos`:
son los dos CTAs del hero más el botón de la nav, o sea los tres botones de
conversión del sitio. Un clic en «Comprar mi boleto» se queda donde está.

`id` reales hoy en la home: `#inicio`, `#congreso`, `#pilares`, `#programa`,
`#para-quien`, `#contenido` y `#menu-movil`.

**NO publicar el sitio promocionalmente —ni compartir la URL como demo
navegable— hasta que `#boletos` exista (Fase 5) como mínimo.** Hasta entonces
el despliegue de Pages vale como vista previa técnica, no como material de
difusión.

Al cerrar cada fase, actualiza la tabla de arriba y tacha la entrada cuando no
quede ningún ancla muerta.

---

## 8. Bitácora

### Fase 1 — Cimientos · COMPLETADA

**Qué se hizo**

- Proyecto Astro 7 con la plantilla `minimal`, salida estática.
- Estructura completa de carpetas (las vacías con `.gitkeep`).
- `tokens.css` con los dos temas + tokens de tipografía fluida, espaciado,
  radios, movimiento, layout, elevación y capas.
- `global.css`: reset, bases del documento, foco, selección, scrollbar
  personalizada y corte por `prefers-reduced-motion`.
- `Base.astro`: documento, meta/OG, favicon vía `base`, y el script inline
  anti-FOUC del tema.
- `theme.js` con la API de tema (también en `window`, pero solo en `/admin`).
- `index.astro`: placeholder. `admin.astro`: panel con un segmento Verde/Azul.
- `favicon.svg` propio. `deploy.yml` para GitHub Pages.

**Decisiones**

- **`@fontsource-variable`** en vez de `@fontsource`: una sola petición por
  subconjunto y todo el rango de pesos disponible.
- **El estado activo del segmento de `/admin` se pinta con CSS**
  (`[data-theme='x'] .segment__option[data-theme-option='x']`), no con una clase
  puesta por JS. JS solo mantiene `aria-checked` y el `tabindex` móvil. Así no
  hay destello del estado equivocado en la carga.
- **`define:vars` para el script anti-FOUC**: la clave de `localStorage` y la
  lista de temas se inyectan desde `theme.js`, evitando strings duplicados que
  se desincronizan.
- **Muestras de color fijas** (`--swatch-green`, `--swatch-blue`) fuera de los
  bloques de tema: los botones de `/admin` deben previsualizar *su* color, no el
  del tema activo.
- `trailingSlash: 'ignore'` + `build.format: 'directory'` para que las rutas
  funcionen igual en el dev server y en GitHub Pages.
- **Scrollbar: una sola vía por navegador.** Chromium 121+ desactiva los
  pseudo-elementos `::-webkit-scrollbar-*` en cualquier scroller que declare
  `scrollbar-width` o `scrollbar-color`; declarar ambas cosas dejaba el bloque
  webkit como código muerto en Chrome/Edge. Ahora las propiedades estándar van
  dentro de `@supports not selector(::-webkit-scrollbar)` (o sea, solo Firefox)
  y Chrome/Edge/Safari se llevan la barra completamente personalizada.
- **Contraste del indicador de `/admin`.** El thumb del segmento se queda en
  `--primary` porque la etiqueta activa va encima en `--text` (5.75:1 / 5.72:1,
  AA). Pero `--primary` sobre `--surface-2` solo da 2.85:1 / 2.76:1, por debajo
  del 3:1 de WCAG 1.4.11. Se resuelve con un anillo interior de 1px en
  `--primary-bright` (6.10:1 / 4.17:1 sobre el track). No sirve pintar el thumb
  entero de `--primary-bright`: el azul `#2E7BD6` tiene un contraste máximo de
  4.92:1 incluso contra negro puro, así que ningún color de etiqueta llegaría
  a AA encima.
- **Dependencias añadidas** (justificación exigida por la regla 7):
  `@astrojs/check` y `typescript` como `devDependencies`, para `npm run check`.
  Requieren `src/env.d.ts`, que declara los módulos `@fontsource-variable/*`
  (son CSS puro y no traen tipos). No afecta al bundle: son solo dev.

**Estado**

Código de la Fase 1 cerrado y verificado: `npm run build` compila, `npm run check`
da 0 errores, y la lógica de tema pasa una batería de asserts (anti-FOUC,
persistencia, valores inválidos, `localStorage` bloqueado, bfcache, ciclo
cambiar → recargar).

No se construyó ninguna sección visual del evento — eso empieza en la Fase 2.

**Publicación:** el repo público `expo-avicola-2026` vive en la cuenta
`michaelking19rtx-lgtm` (no `michaelking19`, que fue una suposición inicial a
partir del email de git). De ahí sale el `site` de `astro.config.mjs`.

Pages ya está habilitado con `build_type: workflow`, y el despliegue quedó
verificado en producción (`/`, `/admin/` y `/favicon.svg` responden 200). Nota
para el futuro: el workflow **no** habilita Pages por sí solo — si algún día se
recrea el repo, hay que activarlo antes (*Settings → Pages* → source «GitHub
Actions», o `gh api -X POST repos/OWNER/REPO/pages -f build_type=workflow`) o el
job `deploy` falla mientras `build` pasa.

Fase 1 cerrada por completo.

---

### Fase 2 — Nav + hero + video · COMPLETADA

**Qué se hizo**

- `animations.js`: arranque único de Lenis + GSAP/ScrollTrigger. Un solo reloj
  (`gsap.ticker` mueve `lenis.raf`), anclas con offset de nav, y deep-link por
  hash. Idempotente: los tres componentes la llaman sin coordinarse.
- `Nav.astro`: barra fija que gana fondo, blur y borde al pasar 80px; wordmark,
  cuatro anclas, CTA, y panel móvil a pantalla completa con hamburguesa SVG que
  se convierte en X.
- `Hero.astro`: split 52/48, título de cuatro líneas con una en `--accent`,
  cuenta regresiva en vivo, dos CTAs, imagen de ponentes con halo y fallback,
  reveal escalonado, flotación permanente y parallax por scroll.
- `VideoSection.astro`: intro al congreso y reproductor 16:9 en placeholder,
  con el marcado del `<video>` real ya escrito en un comentario.
- `paths.js` con `asset()`, la única forma correcta de construir rutas a
  `/public` respetando el `base`.

**Contratos nuevos (respétalos en las fases siguientes)**

- `<html>` lleva tres banderas que pone el script inline del `<head>`:
  `data-js` (hay JavaScript), `data-motion` (`on`/`off`) y `data-motion-ready`.
- **`[data-anim]`**: marca un elemento como "oculto hasta que lo animen".
  `global.css` lo pone a `opacity: 0` **solo** bajo `[data-motion='on']`. Si
  añades `data-anim` a algo, DEBES animarlo con GSAP o quedará invisible.
- Un failsafe de 3 s en el `<head>` devuelve `data-motion` a `off` si el chunk
  de animaciones no llegó, para que el contenido nunca se quede invisible.
  `initMotion()` detecta que el failsafe ya saltó y entonces renuncia a animar,
  en vez de esconder de golpe algo que el usuario ya estaba viendo.
- La imagen del hero: sin JS manda el `<img>`; con JS manda el placeholder y la
  imagen solo aparece al confirmarse la carga. Así nunca se ve el icono de
  imagen rota.

**Decisiones**

- **Import dinámico obligatorio de `animations.js`.** Con import estático, un
  fallo de red al traer los 132 KB de GSAP+Lenis tumbaba también la cuenta
  regresiva, el fallback de imagen, el menú móvil y el estado de la nav. Ahora
  lo esencial corre primero y sin dependencias; el movimiento es mejora
  progresiva con `.catch()`.
- **Título a `clamp(2.5rem, -0.75rem + 7.5vw, 5rem)`, no hasta 6rem.** El
  encargo pedía a la vez columnas ≈52/48 y un título de hasta 6rem, y las dos
  cosas no caben: a 6rem la palabra "productividad" mide ~611px y, como los
  ítems de grid traen `min-width: auto`, ensanchaba su pista hasta dejar el
  reparto real en 61/39. Con 5rem + `min-width: 0` el reparto medido es
  exactamente 524/484 px (52/48) y la imagen recupera ~90px de ancho.
- **La nav sube a `--z-modal` con el menú abierto.** El panel es opaco y a
  `--z-overlay` tapaba la propia barra, dejando la X de cerrar invisible e
  intocable en táctil (con teclado sí cerraba con Escape, por eso costó verlo).
- **`@supports` del fondo de la nav comprueba también `color-mix`.** Como el
  valor lleva `var()`, un navegador sin `color-mix` no descarta la declaración
  al parsear sino en tiempo de cómputo, y `background-color` caía a
  `transparent` en vez de al `var(--bg)` de respaldo: nav sin fondo y texto
  ilegible en Chrome 76–110 y Safari ≤15.
- **Las anclas mueven el foco, no solo el scroll.** Al hacer `preventDefault()`
  se pierde el traslado de foco nativo, lo que dejaba «Saltar al contenido»
  sin efecto para quien navega con teclado. `<main>` lleva `tabindex="-1"`.
- **La cuenta regresiva se marca `aria-hidden`**: es información derivada de una
  fecha que el eyebrow ya anuncia, y un lector de pantalla no debe recibir una
  actualización por segundo. Sus valores iniciales se calculan en build para que
  no haya destello ni salto de layout; el cliente los corrige en el primer tick.
- **El panel móvil es `role="dialog" aria-modal="true"` y pone `inert` en
  `<main>`**, para que el lector de pantalla no siga recorriendo el hero por
  detrás. Se centra con márgenes automáticos, no con `justify-content: center`,
  porque este último recorta por arriba —sin posibilidad de scroll— cuando el
  contenido no cabe en pantallas bajas.

**Estado**

`npm run build` y `npm run check` pasan con 0 errores. Verificado en Chrome 150
real: capturas correctas a 1440, 768 y 375 px en ambos temas, sin desbordamiento
horizontal; menú móvil ejercitado con clics y teclado; con
`prefers-reduced-motion` no se inicializa Lenis y todo queda visible.

**ASSETS PENDIENTES — los sube el usuario**

| Archivo | Para qué | Notas |
| :------ | :------- | :---- |
| `public/img/hero/ponentes.png` | Imagen de ponentes del hero | PNG con fondo transparente, todos juntos. El marco es **4:3** y usa `object-fit: contain`; si la proporción es muy distinta quedarán franjas vacías — ajusta el `aspect-ratio` de `.hero__frame`. Hasta que exista, se ve el placeholder punteado (y hay un 404 en consola). |
| `public/video/congreso.mp4` y `.webm` | Video de la sección "El congreso" | Sustituir el bloque `.intro__placeholder` por el marcado ya escrito en el comentario de `VideoSection.astro`. |
| `public/img/hero/poster-congreso.jpg` | Póster del video | Mismo 16:9 del reproductor. |

**DATO PENDIENTE:** el recinto de la sede. `site.json` lo tiene como
`"recinto": null` y el hero muestra solo "Tehuacán, Puebla". Cuando se confirme,
rellena esa clave y decide dónde mostrarlo.

---

### Fase 3 — Ponentes · POSPUESTA

No se construyó. Faltan las fotos de los ponentes, y una ficha de ponente sin
retrato no es una ficha: es una lista de nombres, que es justo lo que ya da el
programa.

El hueco está preparado y señalizado:

- `index.astro` lleva un comentario entre `<VideoSection />` y `<Pilares />`
  marcando dónde va la sección.
- `Programa.astro` lleva otro comentario donde hoy se pinta el nombre del
  ponente en texto plano: ahí es donde pasarán a ser enlaces a su ficha.
- Al construirla nace el `id="ponentes"`, que hoy es un ancla muerta.

Nombres ya confirmados por el programa (fuente: `programa.json`): IAZ. José
Ángel de la Cruz Hernández, Q.F.B. Edgar Oliva Ramírez (dos sesiones),
M.V.Z. Miguel Ángel Castillo López e Ing. Alejandro Espinosa Arista. La sesión
de inteligencia artificial sigue **por confirmar**.

---

### Fase 4 — Pilares + programa + ¿Para quién es? · COMPLETADA

**Qué se hizo**

- `programa.json`: la agenda completa del día, 13 bloques con `hora`, `titulo`,
  `ponente` y `tipo`, más la nota de duración. **Única fuente de verdad de la
  agenda**: el componente no tiene ni un horario escrito a mano.
- `Pilares.astro`: los tres ejes (productividad, sanidad, tecnología) en tres
  columnas, cada uno con su número 01/02/03 de marca de agua detrás del texto.
- `Programa.astro`: timeline vertical con carril, punto por bloque y la hora en
  columna propia en escritorio. Itera `programa.json`.
- `ParaQuien.astro`: cinco tarjetas de perfil con icono SVG dibujado a mano.

**Decisiones**

- **Seis `tipo` en el JSON, dos variantes en el CSS.** El dato editorial
  distingue `logistica`, `ponencia`, `break`, `show`, `panel` y `cierre`, pero
  visualmente solo hay dos tratamientos: conferencia (protagonista) y pausa
  (secundaria). La traducción se hace en el frontmatter, no repartiendo seis
  selectores por la hoja de estilos; así añadir un `tipo` nuevo no obliga a
  tocar el CSS.
- **Un ScrollTrigger por fila del programa, no un stagger único.** La agenda
  mide 1518px en escritorio y 2099px en móvil: con un solo trigger, las filas de
  la tarde se animarían estando fuera de pantalla y el usuario llegaría a ellas
  ya quietas. Fila a fila, la cascada la marca el scroll real.
- **El desplazamiento de entrada de las filas es de 12px**, deliberadamente por
  debajo del gutter mínimo (20px a 375px), para que un `translateX` no pueda
  provocar scroll horizontal.
- **El punto del timeline lleva `background-color: var(--bg)`.** Sin fondo
  propio, el carril de 1px se vería cruzándolo por dentro.
- **La hora se apila sobre el título por debajo de 48rem.** Meter una columna de
  horas de ancho fijo en 375px dejaba el título en una tira de texto ilegible.
  `white-space: nowrap` en la hora evita que la franja se parta por el guion.
- **Las tarjetas de ¿Para quién es? van en una rejilla de 6 columnas con
  tarjetas de 2.** Con `repeat(3, 1fr)` la cuarta y la quinta quedaban pegadas a
  la izquierda con un hueco huérfano a la derecha; arrancándolas en las columnas
  2 y 4 quedan centradas bajo las tres de arriba. En tablet (2 columnas) la
  quinta ocupa el ancho completo en vez de quedarse sola en media fila.
- **Token nuevo `--radius-card: 12px`** (regla 1: si falta un token, se agrega a
  `tokens.css`). Coincide en valor con `--radius-media`, pero son cosas
  distintas: si el reproductor cambia de radio, las tarjetas no deben seguirlo.
- **Los nombres de los ponentes son texto plano.** Enlazarlos a una sección que
  no existe sería un ancla muerta más. Se convierten en enlaces en la Fase 3.

**Estado**

`npm run build` y `npm run check` pasan con 0 errores, 0 warnings y 0 hints.

Verificado en Chrome 150 headless conducido por CDP (sin añadir dependencias),
no solo leyendo el código:

- **La agenda renderizada se comparó campo por campo contra el encargo**: 13/13
  filas idénticas en hora, título, ponente y tipo, en orden, y las 6 ponencias
  marcadas como fila protagonista.
- **Desbordamiento horizontal = 0 px** en 375, 768 y 1440, en los dos temas, sin
  ningún elemento saliéndose del viewport.
- **Contrato `[data-anim]`**: 41 elementos marcados; 32 arrancan invisibles bajo
  el pliegue y, tras recorrer la página entera, **quedan 0 invisibles**. Es la
  prueba que importa: un `data-anim` sin animación que lo revele deja contenido
  invisible para siempre.
- **`prefers-reduced-motion`**: `data-motion='off'`, Lenis no se inicializa y
  ningún elemento queda oculto en ningún momento.
- **Contraste** calculado sobre los tokens reales de ambos temas: el par más
  ajustado es el borde de hover de las tarjetas (`--primary-bright` sobre
  `--surface`) con 5.84:1 en verde y 3.88:1 en azul, ambos por encima del 3:1
  que pide WCAG 1.4.11 para elementos no textuales. Todo el texto va de 6.66:1
  para arriba.

**Sin assets pendientes nuevos**: las tres secciones son tipografía, SVG inline
y color. No necesitan ni una imagen.
