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
| Producción | **https://expo.visionpecuariamx.com** (dominio propio, en la raíz) |

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
- **`base: '/'` y dominio propio.** El sitio vivió bajo el subpath
  `/expo-avicola-2026` en `michaelking19rtx-lgtm.github.io` hasta que se
  configuró `expo.visionpecuariamx.com`; ahora cuelga de la raíz, también en
  local (`http://localhost:4321/`).
- **El dominio lo sostiene Settings → Pages, NO `public/CNAME`.** Este repo
  publica por workflow (artefacto + `actions/deploy-pages`), no desde una
  rama, y en ese modo GitHub ignora el CNAME del artefacto. El archivo se
  conserva como seguro por si algún día se vuelve a publicación por rama, pero
  **no es lo que mantiene el dominio en pie**. Si hay que moverlo o
  reconfigurarlo, se hace en el panel del repo.

## 3. Estructura de carpetas

```text
expo-avicola-2026/
├── .github/workflows/deploy.yml
├── public/
│   ├── img/{ponentes,hero,patrocinadores,og}/
│   ├── video/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── {Nav,Hero,VideoSection,Ponentes}.astro
│   │   ├── {Pilares,Programa,ParaQuien,Boletos}.astro
│   │   └── {Sede,Patrocinadores,Faq,CtaFinal,Footer}.astro
│   ├── data/{site,navegacion,programa,boletos,patrocinadores,faq}.json
│   ├── data/{hero-ponentes,ponentes}.json
│   ├── env.d.ts
│   ├── layouts/Base.astro
│   ├── pages/{index,admin,404}.astro
│   ├── scripts/{theme,animations,paths,fechas,schema,programa}.js
│   ├── scripts/admin/{firebase,asistentes,pdf}.js
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
   Las que hay: `@astrojs/check` + `typescript` (dev, para `npm run check`) y
   **`@astrojs/sitemap`** (Fase 7). Esta última porque escribir el sitemap a
   mano obligaba a mantener una lista de rutas en paralelo al router, que es
   justo lo que acaba desincronizándose. La integración lo deriva de `site` +
   `base` y no añade nada al bundle: corre solo en build.

   > Ese «derivarlo» se cobró solo al pasar a dominio propio: cambiar `site` y
   > `base` en la config bastó para que TODAS las URLs del sitemap se
   > reescribieran, sin tocar ninguna.
8. **Español (México)** en todo el texto de cara al usuario. `lang="es-MX"`
   (era `es` hasta la Fase 7; el subtag de región ayuda a buscadores y lectores).
9. Rutas a `/public` siempre a través del `base` de Astro
   (`import.meta.env.BASE_URL`), nunca absolutas tipo `/img/foo.png`.
10. **Revisa `git status` antes de CADA commit.** Mira la lista completa de
    archivos que vas a incluir, no solo los que tocaste a propósito. En la
    Fase 2 se coló un `dbg2.mjs` de depuración y hubo que borrarlo en un commit
    aparte. Los scripts temporales no van al repo.
11. **No escribir cifras de medición (ms, KB, %) en comentarios, commits o
    reportes sin haberlas medido en esa misma sesión.** Si es una estimación,
    decir que lo es. Un número inventado en un comentario sobrevive al
    contexto que lo justificaba.

    > Origen: en la Fase 2b se escribió en un comentario del código que bajar
    > `fetchpriority` mejoraba el LCP «de 504 a 424 ms», antes de medirlo. Al
    > medirlo de verdad la diferencia estaba dentro del ruido. El comentario
    > se corrigió, pero de no haberse revisado habría quedado en el repo como
    > una justificación falsa de una decisión correcta por otro motivo.
12. **No lanzar agentes de revisión que escriban en el árbol de trabajo
    mientras hay una tarea en curso.** Los agentes de revisión leen; solo el
    hilo principal escribe. Un agente pisó `hero-ponentes.json` y provocó 10
    minutos de verificación contra datos falsos.

    > Origen: en la Fase 2c se lanzó una revisión adversarial en paralelo
    > mientras se seguía trabajando. Dos de sus agentes probaron casos límite
    > MUTANDO `hero-ponentes.json` (array vacío, claves faltantes) y lo
    > restauraron a un estado anterior, de 3 figuras. Toda la verificación
    > siguiente —geometría, etiquetas, oclusión— corrió contra 3 figuras
    > creyendo que eran 6, y hubo que repetirla entera. De paso, un tercer
    > agente leyó el fichero a medio mutar y reportó como defecto real unas
    > «claves faltantes» que nunca existieron.
    >
    > Si hay que probar casos límite del repo, va en un worktree aparte
    > (`isolation: 'worktree'`) o lo hace el hilo principal.
13. **El LCP puede cambiar de elemento de referencia entre dos versiones.
    Cuando eso pasa, comparar el número es comparar cosas distintas.
    Verificar siempre QUÉ elemento está midiendo antes de aceptar o rechazar
    una optimización por su LCP.**

    > Origen: en la Fase 2c se desacopló la entrada del hero del chunk de
    > animación. El LCP en 4G lento pasó de 2484 a 2284 ms —solo 200 ms— y por
    > el umbral acordado tocaba revertir. Pero el elemento LCP había cambiado:
    > antes medía `ponente-02.webp` (116 081 px²) y después la línea del
    > título (48 960 px²), que son dos cosas distintas. Midiendo cuándo el
    > hero queda REALMENTE completo, la misma mejora valía **−834 ms**, y el
    > texto legible **−1501 ms**. Revertir habría sido optimizar el medidor en
    > vez de la página.
    >
    > La cadena de candidatos se saca con un `PerformanceObserver` de
    > `largest-contentful-paint` **sin quedarse con la última entrada**:
    > guardando todas se ve qué elemento gana, con qué área y en qué instante.
    > Cuando el LCP no cuadre con lo que se ve, medir el tiempo hasta que el
    > contenido está de verdad puesto y comparar ese.
14. **Un aserto que pasa no prueba que se vea bien.** Los asertos verifican
    existencia y estado (hay iframe, hay atributo, hubo petición); no verifican
    apariencia. **Toda tarea con resultado visual se cierra mirando la captura,
    no solo leyendo los números.** En este proyecto tres fallos reales pasaron
    todas las comprobaciones numéricas.

    > **Los tres casos.** (1) *Fase 2b* — la etiqueta de la figura central
    > aterrizaba sobre la cara de la vecina. Estaba dentro del viewport y no
    > pisaba la columna de texto, que era todo lo que se comprobaba. (2) *Fase
    > 2c* — la etiqueta se pintaba encima de los CTAs entre 700 y 991px; la
    > comprobación buscaba colisión con la columna de texto, que en ese tramo
    > no existe porque el hero es de una sola columna. (3) *Sede* — el mapa
    > bajo demanda cargaba en un marco vacío mientras `data-estado` decía
    > «cargado», había 1 iframe en el DOM, se registraba 1 petición a Google y
    > el foco aterrizaba en el iframe. Los cuatro asertos, correctos.
    >
    > **La causa del tercero, que además es una trampa de Astro que volverá a
    > aparecer:** un elemento inyectado por JS con `createElement` **no lleva
    > el atributo `data-astro-cid-*`** con el que Astro acota los estilos del
    > componente, así que ninguna regla del `<style>` le aplica. El iframe
    > salía con los valores por defecto —`display:inline`, 304×154— dentro de
    > un marco de 504×378. **Todo lo que el JS inyecte necesita `:global()` en
    > su regla.**

15. **Un aserto que corre CON JavaScript no puede ver un fallo que solo existe
    SIN él.** Y al revés. Toda función que tenga dos modos —con JS y sin JS,
    con movimiento y con `prefers-reduced-motion`, con la imagen cargada y con
    la imagen rota— **se verifica en LOS DOS**, porque un modo no es evidencia
    del otro.

    > Origen: en la Fase 3 las fichas de ponentes son `<dialog>` con `open`,
    > pensadas justo para funcionar sin JavaScript. Se verificaron con 17
    > comprobaciones de interacción real —foco atrapado, Escape, retorno de
    > foco, hash, enlaces del hero— y las 17 pasaron. **Las 17 corrían con
    > JavaScript**, que es el único modo donde el `<dialog>` es modal.
    >
    > Sin JavaScript había TRES fallos bloqueantes a la vez, todos con la misma
    > causa: la hoja del navegador da `position: absolute` a todo `<dialog>` y
    > nadie lo había reseteado. Las seis fichas se pintaban en la misma
    > coordenada —solo se veía la última—, su contenedor medía 0 px y se
    > superponían a Pilares y Programa con texto sobre texto, y sangraban a
    > ancho completo sin gutter. Los encontró una revisión que sí miró ese modo.
    >
    > Es la convención 14 con otra piel: **14** dice que el número no ve lo que
    > la captura sí; **15** dice que el número tampoco ve lo que pasa en el modo
    > que no estás ejecutando. En los dos casos el error es confundir «pasó mi
    > comprobación» con «funciona».

16. **La herencia de `color` transmite el valor YA COMPUTADO, no la referencia
    `var()`.** Remapear un token de color dentro de un ámbito NO alcanza a
    ningún elemento que herede ese color desde fuera del ámbito. Solo cambian
    los elementos que declaran `color: var(--…)` explícitamente. **Todo bloque
    que remapee `--text` debe declarar además `color: var(--text)`.**

    > Origen: en las superficies claras, `[data-superficie='clara']` remapea
    > `--text` al tinte oscuro y todo parecía correcto: el token resolvía al
    > valor nuevo, el `<h2>` no tenía regla de color propia y la sección pintaba
    > su fondo claro. **Los `<h2>` salían invisibles.** Heredaban de
    > `body { color: var(--text) }`, que el navegador ya había resuelto a
    > `#f4f1ea` —el claro del tema OSCURO— antes de entrar en la sección. La
    > herencia pasa `#f4f1ea`, no `var(--text)`, así que remapear la variable
    > dentro no reevalúa nada. Invertían solo los elementos con color explícito:
    > eyebrows, horas y títulos de bloque. Se cierra con una línea,
    > `color: var(--text)`, en el propio bloque del remapeo.
    >
    > **Es la misma familia que la 14 y la 15:** la comprobación pasa y la
    > pantalla dice otra cosa. Aquí el token remapeado es correcto —se puede
    > leer con `getComputedStyle` y da el valor nuevo— y aun así el título no
    > se ve. **14** = miras el número en vez de la pantalla. **15** = miras un
    > modo de ejecución en vez de los dos. **16** = miras el valor de la
    > variable en vez de quién la está usando de verdad.

17. **Si una métrica empeora en una configuración donde la causa sospechada NO
    EXISTE, la causa es otra. No la aceptes ni la descartes: úsala de control.**
    Antes de atribuir un número a lo que acabas de tocar, busca un escenario
    donde eso que tocaste no esté presente y mide ahí también. Si el número se
    mueve igual, lo que has medido es otra cosa.

    > Origen: al integrar el fondo del hero, el LCP en 4G subió ~104 ms a
    > 1440px. Estaba por debajo del umbral y se habría aceptado como «lo que
    > cuesta la imagen». Pero **a 390px subió ~92 ms, y a 390 el fondo va en
    > una media query que no casa: no se descarga, cero peticiones y cero
    > bytes.** Una imagen que no se pide no puede costar 92 ms.
    >
    > Repitiendo la corrida, la medida resultó reproducible a ±8 ms, así que no
    > era ruido. El culpable era `define:vars`: Astro repite el atributo
    > `style` con las variables en CADA elemento del componente, y el hero
    > tiene decenas. **El documento pasaba de 96 971 a 114 853 bytes** —+17.9 KB
    > de HTML que bloquea el render— por dos rutas de imagen.
    >
    > Declarando las variables una sola vez en el `style` de la `<section>`, el
    > documento subió 143 bytes y el LCP volvió a su sitio: **+20 ms a 1440 y
    > 0 ms a 390**. La imagen costaba 20 ms; los otros 84 eran el andamiaje.
    >
    > **Es la pareja de la 13.** La 13 dice que un LCP puede estar midiendo un
    > elemento distinto del que crees. La 17 dice que puede estar midiendo una
    > CAUSA distinta de la que crees. En las dos, la pregunta que lo destapa es
    > la misma: ¿qué está midiendo esto exactamente?

> **Nota sobre las convenciones 11, 12 y 13.** Son la misma falla con distinto
> disfraz: un número que parece evidencia sin serlo. **11** = cifra escrita sin
> medir. **12** = medida contra datos que otro proceso cambió. **13** = medida
> correcta pero comparando dos elementos distintos. Ante cualquier número que
> justifique una decisión, verificar cuál de los tres casos podría estar
> ocurriendo.
>
> **Y las 14, 15 y 16 son el grupo siguiente:** no que el número esté mal, sino
> que mire donde no hay que mirar. **14** = miras los números en vez de la
> pantalla. **15** = miras un modo de ejecución en vez de los dos. **16** =
> miras el valor de la variable en vez de quién la consume de verdad.

## 6. Roadmap

| Fase | Alcance                                                                  | Estado         |
| :--- | :----------------------------------------------------------------------- | :------------- |
| 1    | Cimientos: arquitectura, doble tema, `/admin` mínimo, deploy              | **COMPLETADA** |
| 2    | Nav + hero + sección de video, con capa de movimiento (GSAP, Lenis)      | **COMPLETADA** |
| 2b   | Hero rediseñado: abanico de figuras individuales de ponentes              | **COMPLETADA** |
| 2c   | Seis figuras en dos rangos, figura 78% más grande, entrada desacoplada    | **COMPLETADA** |
| 3    | Ponentes: rejilla de seis tarjetas + ficha completa en `<dialog>`         | **COMPLETADA** |
| 4    | Pilares + programa/agenda + ¿Para quién es?                               | **COMPLETADA** |
| 5    | Boletos: precio, qué incluye, CTA de registro                             | **COMPLETADA** |
| 6    | Sede, patrocinadores, FAQ, CTA final y footer                             | **COMPLETADA** |
| 7    | SEO técnico, datos estructurados, indexación y rendimiento                | **COMPLETADA** |
| 8    | `/admin` real: Firebase Auth + lista de asistentes desde Stripe          | **COMPLETADA** |
| —    | Superficies claras: cuatro secciones invertidas (las bandas se retiraron) | **COMPLETADA** |

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

### El footer desborda 41 px a 360 px · CERRADO — ver bitácora

A 360 px de ancho el documento mide **401 px** y hay scroll horizontal. Los
culpables son todos del footer —`.pie__marca`, `.pie__cuando`, `.pie__nav`,
`.pie__titulo`, `.pie__enlaces` y sus `<li>`—, todos con `left: 20` y
`right: 401.1`, es decir **381.1 px de ancho dentro de un viewport de 360**.
Apunta a un ancho fijo (o un `min-width`) en el bloque del footer que no cede
por debajo de ~381 px.

**No lo causó el video**: se midió con y sin el cambio de `VideoSection.astro`
—compilando la versión anterior a propósito— y el desborde es idéntico, 401 px
en las dos. Es la convención 17 usada como control: si el número no se mueve al
quitar lo que acabas de tocar, lo que has medido es otra cosa.

A 768, 1024 y 1440 no hay desborde. Se detectó integrando el video y se dejó
sin tocar por no mezclar dos cosas en un commit. **Toca arreglarlo aparte**, en
`Footer.astro`.

### El guardián de assets no mira `public/video/` · ABIERTO

`avisaDeAssetsDePublic()` en `astro.config.mjs` solo recorre `public/img`. El
MP4 de 89.6 MiB entró en el árbol y **el build no dijo absolutamente nada** —
el aviso que existe justo para eso no se enteró porque estaba en otra carpeta.

Extenderlo a `public/video/` necesita un umbral propio: `PESO_MAXIMO` está
calibrado para imágenes y cualquier video lo dispararía siempre. Lo razonable
es un límite por tipo (p. ej. imágenes a lo que está hoy, video a ~30 MB) y de
paso hacer que el aviso mencione el límite de 100 MiB por archivo de GitHub.

### Los nombres del hero · CERRADO · EL `noindex` SE RETIRÓ

**Los seis ponentes llevan ya su nombre real y su tema real.** Llegaron los dos
datos que faltaban: el nombre de `ponente-04` (Ing. Ricardo Olmos Rivera) y la
ponencia de `ponente-06` (Esteban), que hasta entonces enseñaba su credencial
por no tener tema asignado.

Con eso se cumplieron las tres condiciones que se habían anotado aquí y **la
home salió de `noindex`**: `src/pages/index.astro` pasa `<Base evento>` a secas.
El sitemap ya incluía la home y no dependía del atributo, así que la indexación
se reanuda sola en el siguiente rastreo.

**Se levanta también el veto de publicación promocional.** El riesgo era que un
buscador cacheara —o que una campaña difundiera— una versión con caras reales
junto a «Ponente por confirmar». Ya no existe esa versión.

> **SI VUELVE A ENTRAR UN PLACEHOLDER EN EL HERO**, vuelve a poner `noindex` en
> `index.astro` antes de que se rastree. Es un atributo booleano de `<Base>` y
> nada más depende de él. La comprobación barata es sobre el HTML COMPILADO, no
> sobre el fuente: `grep -i "por confirmar" dist/index.html` tiene que dar cero.

#### Los `slug` son ya los definitivos, y NO hay dónde contrastarlos

Los seis usan su nombre en minúsculas y sin acentos, sin la credencial:

| id | slug |
| :- | :--- |
| 01 | `edgar-oliva-ramirez` |
| 02 | `alejandro-espinosa-arista` |
| 03 | `jose-angel-de-la-cruz-hernandez` |
| 04 | `ricardo-olmos-rivera` |
| 05 | `miguel-angel-castillo-lopez` |
| 06 | `esteban-fructuoso-alducin` |

Ya no queda ninguno con `slugProvisional`.

**`src/data/ponentes.json` YA ESTÁ EN EL REPO** —fichas completas para la Fase
3: credencial, bio, formación, trayectoria, especialidades y qué se lleva el
asistente, con marcadores `PENDIENTE` donde falta dato. **Ningún componente lo
importa todavía**; entra en juego con la Fase 3.

Se commiteó con sus `PENDIENTE` a propósito: un archivo que existe en disco y
que git no ve es el mismo fallo silencioso que se cerró en `.gitignore`, y los
marcadores son información visible, no basura.

Los seis slugs se cotejaron uno a uno contra él: **coinciden los seis**, igual
que el destacado (Edgar en los dos archivos).

**Ya no queda ningún `PENDIENTE` en el archivo**: la ficha de Ricardo se rellenó
entera (credencial, ponencia, bio, trayectoria, seis especialidades, enfoque y
qué se lleva) y a Esteban se le puso su ponencia y su `queSeLleva`.

**El `slug` de un ponente vive en DOS ficheros y hay que cambiarlo en los dos a
la vez**, porque de él cuelga el ancla `#ponente-{slug}` que enlazará el hero
con la ficha en la Fase 3. Un script de verificación coteja los seis por `id`,
comparando `slug` Y `nombre`; conviene volver a pasarlo tras tocar cualquiera
de los dos archivos.

### Anclas de navegación que no llevan a ningún sitio · CERRADO

**No queda ningún ancla muerta.** La Fase 3 creó `#ponentes` y con él murieron
los tres últimos enlaces rotos —nav de escritorio, menú móvil y footer—, que
eran los únicos que quedaban de los 18 del sitio.

| Ancla        | Enlaces | ¿Existe el destino? |
| :----------- | ------: | :------------------ |
| `#programa`  |       4 | **SÍ** — Fase 4 |
| `#boletos`   |       7 | **SÍ** — Fase 5 |
| `#sede`      |       3 | **SÍ** — Fase 6 |
| `#contenido` |       1 | **SÍ** — el `<main>` |
| `#ponentes`  |       3 | **SÍ** — Fase 3 |

Y aparecieron **seis anclas nuevas**, `#ponente-{slug}`, una por ficha. Son
destinos reales con y sin JavaScript: cada ficha es un `<dialog open>` que sin
JS se pinta como un bloque normal. Las enlazan las seis figuras del hero y las
seis tarjetas de la rejilla.

`id` reales hoy en la home: `#inicio`, `#congreso`, `#ponentes`, `#pilares`,
`#programa`, `#para-quien`, `#boletos`, `#sede`, `#patrocinadores`, `#faq`,
`#contenido`, `#menu-movil` y los seis `#ponente-{slug}`.

### La pasarela de pago · CERRADO

**El sitio ya vende.** `checkoutUrl` apunta a un Payment Link hospedado por
Stripe y el CTA de la tarjeta es un enlace real a él. `priceId` se queda en
null a propósito: ese campo solo haría falta para crear una Checkout Session
por API, y aquí no hay backend.

Ver «Pasarela conectada» en la bitácora, incluida la discrepancia de nombres
entre el sitio y el Payment Link, que sigue abierta y NO es de código.

### PENDIENTES DE CONTENIDO — lista consolidada

Todo lo que falta para que la landing esté completa. **Nada de esto es código
que falte escribir: son datos y archivos que tiene que aportar el cliente.**
Cada uno ya tiene su hueco preparado y se degrada con dignidad mientras no
llegue — la página nunca enseña un dato falso ni un espacio roto.

| # | Qué falta | Dónde entra | Qué se ve mientras tanto |
| - | :-------- | :---------- | :----------------------- |
| ~~1~~ | ~~**Recinto** de la sede~~ | ~~`site.recinto`~~ | **RESUELTO** — «Salón de Eventos Bugambilias» |
| ~~2~~ | ~~**Dirección** exacta~~ | ~~`site.direccion`~~ | **RESUELTO** — López Rayón 3, Centro de la Ciudad, 75700 |
| ~~3~~ | ~~**Mapa** de la sede~~ | ~~comentario en `Sede.astro`~~ | **RESUELTO** — iframe de Maps en lazy + enlace «Cómo llegar» |
| ~~4~~ | ~~**Correo** de contacto~~ | ~~`site.contacto.correo`~~ | **RESUELTO** — contacto@visionpecuariamx.com. Es un PLACEHOLDER acordado, no un buzón verificado: confirmar que recibe antes de difundir |
| 5 | **Teléfono** | `site.contacto.telefono` | «Próximamente» en el footer |
| ~~6~~ | ~~**WhatsApp**~~ | ~~`site.contacto.whatsapp`~~ | **RESUELTO** — +52 236 113 8979 (perfil «ingenieriaavicol»). Pie, botón flotante y barra móvil |
| ~~7~~ | ~~**Logos** de patrocinadores~~ | ~~`public/img/patrocinadores/{avipork,prosermat}.png`~~ | **RESUELTO** — WebP con transparencia, fondo blanco quitado a mano. Ver bitácora |
| ~~8~~ | ~~**Fotos de ponentes**~~ | ~~`public/img/ponentes/`~~ | **RESUELTO** — seis retratos entregados, reencuadrados y convertidos a WebP |
| ~~9~~ | ~~**Imagen del hero**~~ | ~~`public/img/hero/ponentes.png`~~ | **RESUELTO y luego SUSTITUIDO** — la grupal se retiró en la Fase 2b; hoy son 3 figuras individuales |
| ~~9b~~ | ~~**Nombre real de UNA figura del hero**~~ | ~~`hero-ponentes.json`~~ | **RESUELTO** — Ing. Ricardo Olmos Rivera. Con él se retiró el `noindex` |
| ~~9c~~ | ~~**Las otras 3 figuras del hero**~~ | ~~`public/img/hero/ponente-0{4,5,6}.webp`~~ | **RESUELTO** — entregadas e integradas en la Fase 2c |
| 10 | **Video del congreso** | `public/video/congreso.{mp4,webm}` + `poster-congreso.jpg` | Placeholder 16:9 con botón de play |
| ~~11~~ | ~~**Ponente de la sesión de IA**~~ | ~~`programa.json`, bloque 13:10~~ | **RESUELTO** — Ing. Ricardo Olmos Rivera |
| ~~15~~ | ~~**Hueco en la agenda para la 7ª ponencia**~~ | ~~`programa.json`~~ | **RESUELTO** — 13:15, con el reparto 4+3 a 30 min |
| ~~16~~ | ~~**Actualizar la descripción del producto en STRIPE**~~ | ~~panel de Stripe, fuera del repo~~ | **RESUELTO por reversión** — la agenda volvió a 6 ponencias (ver «Vuelta a 6 ponencias» en la bitácora) y `boletos.json` volvió a decir «6 conferencias», que es lo que Stripe ya decía. Coincidencia de que las dos cosas se resolvieran solas, no una edición a propósito |
| ~~12~~ | ~~**Stripe**: producto, precio y checkout~~ | ~~`boletos.json`~~ | **RESUELTO** — Payment Link conectado en `checkoutUrl` |
| 13 | **Aviso de privacidad** | página `/privacidad` + enlace en `Footer.astro` | Texto plano «Aviso de privacidad · Próximamente» |
| 14 | **Imagen Open Graph** 1200×630 | `public/img/og/og-expo-avicola.jpg` | Las etiquetas `og:image`/`twitter:image` ya apuntan ahí; al compartir el enlace la tarjeta sale sin imagen |

El que más pesa ahora es el **16**, porque lo ve quien está pagando: la página
promete siete conferencias y la pantalla de Stripe, a un clic de distancia,
sigue prometiendo seis. Con el 8 resuelto ya no queda nada que bloquee una fase
entera: lo que falta son piezas sueltas (video, logos, contacto, OG, privacidad).

### El logo roto de patrocinadores desborda sin JS · CERRADO · resuelto con los logos reales

**No es de la Fase 3 y no se arregló ahí a propósito.** Se detectó midiendo
Ponentes sin JavaScript y conviene tenerlo escrito antes de tocar los logos.

Sin JS hay **45 px de desborde horizontal a 320 px de ancho y 5 px a 360**. Con
JS es 0. El culpable es `IMG.patro__logo` en `#patrocinadores`: los archivos son
404 (este mismo pendiente 7), y sin JS no corre el fallback que enseña
`.patro__respaldo` y pone el `<img>` a `opacity: 0`.

**Y no lo causa la falta del fallback, sino el `<img>` roto en sí.** Cuando una
imagen es 404, Chrome pinta el marcador de imagen rota al tamaño de los
atributos `width="320" height="120"` **e ignora tanto `max-width` como
`max-height`**. Medido: el logo sale a 320×120 dentro de un `.patro__caja` de
230×88, con `max-width: 100%` computado y activo. Por eso «ponerle un
`max-width`» NO sirve: ya lo tiene.

Probado sin JS, tres candidatos:

| Parche | 320 px | 360 px | |
| :----- | -----: | -----: | :-- |
| `min-width: 0` en el item | 45 px | 5 px | no resuelve |
| **`width:100%; height:100%` en `.patro__logo`** | **0** | **0** | **resuelve** — logo a 235×88 |
| `overflow: hidden` en el marco | 0 | 0 | resuelve, pero recorta en vez de arreglar |

**Al hacer el pendiente 7, meter el segundo:** sustituir `width: auto` por
`width: 100%; height: 100%` en `.patro__logo`. Corrige ancho y alto a la vez y,
con el `object-fit: contain` que ya está, un logo real se ajusta dentro de la
caja sin deformarse. Deja de depender de que corra JavaScript.

> **Se aplicó, y con logos reales no bastó — la altura al 100% no resuelve
> contra un item de grid estirado.** Es un problema distinto del que este
> bloque describe (aquel era sobre el `<img>` ROTO; este pasa con el `<img>`
> ya cargando bien). El arreglo completo, con la causa exacta, está en la
> entrada «Logos de patrocinadores — pendiente 7 resuelto» de la bitácora.

### La séptima ponencia · REVERTIDO — ver «Vuelta a 6 ponencias» en la bitácora

> El organizador confirmó después que Esteban toma la sesión de Vacunación
> (que era de Edgar) en vez de tener tema propio, y la agenda volvió a 6
> ponencias de 35 min. Esta entrada describe una decisión que ya no está en
> pie; se conserva completa porque documenta el razonamiento de la aritmética
> 7×30=6×35, que sí volvió a aplicarse (a la inversa) para deshacer el cambio.

`programa.json` tiene ya **7 ponencias repartidas entre 6 ponentes**: Edgar
Oliva Ramírez da DOS (09:30 «Diagnóstico temprano» y 12:45 «Vacunación y
prevención»). Aquí ponía «7 ponencias para 7 ponentes», que era falso y se
corrigió al contarlo contra el JSON. La de Esteban entra a
las 13:15, cerrando el arco Bioseguridad → Vacunación → Detrás de la vacuna.

Se resolvió recortando las ponencias de 35 a 30 min: `7 × 30 = 210 = 6 × 35`, la
misma huella. **Comida, panel, networking final y clausura no se movieron ni un
minuto** (13:45 / 14:45 / 15:30 / 16:30); lo único que cambió de hora fue el
coffee (10:45 → 11:00) y el show (11:30 → 11:45). Ver la bitácora, «La séptima
ponencia y el reparto 4+3».

> **`ponentes()` de `schema.js` sigue uniendo agenda Y hero, y hay que
> mantenerlo así.** Hoy las dos fuentes dan lo mismo y la unión parece
> redundante, pero es la red que cubre el caso «anunciado sin hueco todavía»,
> que ya se dio una vez. Quitarla ahorraría cuatro líneas y volvería a dejar
> fuera del JSON-LD al primer ponente que se anuncie antes de tener horario.

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
| ~~`public/img/hero/ponentes.png`~~ | Imagen de ponentes del hero | **ENTREGADA y luego RETIRADA.** Se optimizó a `ponentes.webp` (125 KB) y se sirvió hasta la Fase 2b, que la sustituyó por tres figuras individuales. `.hero__frame` ya no existe. |
| ~~`public/video/congreso.mp4` y `.webm`~~ | Video de la sección "El congreso" | **ENTREGADO.** Llegó como `promo.mp4`; se sirve reencodado a 26.1 MiB y sin WebM. Ver «El video del congreso» al final de la bitácora. |
| ~~`public/img/hero/poster-congreso.jpg`~~ | Póster del video | **RESUELTO sin entrega.** No hizo falta pedirlo: se extrajo del propio video y vive en `public/video/poster.webp` (37 KB). |

~~**DATO PENDIENTE:** el recinto de la sede.~~ **RESUELTO** — confirmado y
rellenado. Ver «Sede confirmada» al final de la bitácora.

---

### Fase 2b — Hero rediseñado: abanico de figuras individuales · COMPLETADA

Sustituye la foto grupal del hero por una figura por ponente, en composición
de abanico, con etiqueta de nombre y animación independiente. **Hoy son 3; el
sistema está hecho para 6 sin tocar CSS ni JS.**

**Qué se hizo**

- `src/data/hero-ponentes.json`: única fuente de verdad del abanico. Un objeto
  por figura con `id`, `slug`, `nombre`, `tema`, `img` y `destacado`.
- `Hero.astro`: la columna derecha pasa de un `<img>` a un `<ul>` de figuras
  posicionadas por cálculo. Toda la geometría se deriva de la longitud del
  array y del índice.
- Tres WebP nuevos (560×750) y fuera el `ponentes.webp` grupal.
- `animations.js`: `detenerMovimiento()` cambia `[data-hero-frame]` (que ya no
  existe) por `[data-fig-entrada], [data-fig-flota]`.

#### CÓMO PASAR DE 3 A 6 FIGURAS · SUPERADA POR LA FASE 2c

> Se ejecutó en la Fase 2c y el sistema cambió con ella: hoy son DOS RANGOS,
> los WebP van a 672×900 (no 560×750) y el orden del array decide quién va al
> fondo. **Para añadir o quitar figuras, usa la receta de la Fase 2c.** Lo que
> sigue se conserva por el registro de cómo se verificó en su momento.

**Solo se tocan datos e imágenes. Ni CSS ni JS.**

1. Recortar las 3 nuevas con el mismo criterio: fondo transparente, persona
   centrada y **pegada al borde inferior**, proporción 56:75.
2. Convertirlas a WebP 560×750 calidad 90 (ver «Cómo regenerar los WebP» más
   abajo) y dejarlas en `public/img/hero/ponente-0{4,5,6}.webp`. Los PNG
   originales NO entran al repo: van a la carpeta hermana de originales.
3. Añadir tres objetos a `hero-ponentes.json`. **Exactamente uno de los seis
   lleva `destacado: true`.**

Eso es todo. Se recalculan solos el ancho de cada figura, su posición, el
z-index, la escala, la opacidad, el lado al que sale la etiqueta, el orden de
entrada y las duraciones de flotación. Verificado de verdad: se metieron 6
objetos en el JSON, se compiló y se midió en 7 breakpoints — 0 px de
desbordamiento y etiquetas dentro del viewport en todos.

> **REGLA DE RECORTE:** la figura destacada (centro) puede tener la coronilla
> más alta; las laterales deben coincidir entre sí dentro del 1%. Al recibir
> las 3 figuras restantes, verificar que ninguna con coronilla alta caiga en
> posición lateral.

En la entrega de las 3 primeras, las coronillas salieron a 7.54% / 4.50% /
7.63% de la altura. La dispersión (3.13%) superaba el umbral del 3%, pero se
aceptó sin retocar: las dos que se ven juntas (01 y 03) difieren un 0.09%, y
la desviada es la central, donde una coronilla más alta REFUERZA el arco en
vez de crear un escalón.

**Decisiones**

- **El «20% de solape» es de CUERPO, no de lienzo.** Los recortes traen ~38%
  de margen transparente (la silueta ocupa un 62% del ancho del lienzo), así
  que con los lienzos solapando un 20% los cuerpos ni se rozaban y el hero se
  leía como tres recortes en fila. `solape_cuerpo = (0.62 − paso) / 0.62`, de
  donde el paso entre figuras es 0.5. De regalo, la figura creció de 131 a
  170px de ancho.
- **El solape crece con n.** Con paso fijo, n figuras ocupan `1 + paso·(n−1)`
  anchos y cada una encoge. Con 6 la figura caía a 77px y las caras dejaban de
  distinguirse: el sistema «funcionaba» y el resultado no servía. Se topa el
  ancho total en 3.2 anchos de figura y el paso sale de ahí.
- **TRES REGÍMENES, no uno que encoge.** Los cortes salen de medir, no de
  números redondos: `<700px` rejilla de retratos con el nombre siempre
  visible; `≥700px` abanico con el nombre bajo cada figura; `≥1280px` abanico
  con etiqueta de línea guía al hover o al foco. **Por debajo de 1280px la
  etiqueta lateral no cabe**: vuela 118px y a 1200px el hueco libre por la
  derecha baja a 100px. Antes que recortarla hasta hacerla ilegible, ese tramo
  usa el nombre bajo la figura, que no compite por ancho con nada.
- **El hueco de las etiquetas sale del padding de `.hero__media`, NUNCA del
  `gap` del grid.** Se intentó ensanchar el canal a 6.5rem: abría el hueco,
  pero estrechaba la columna de texto de 524 a 503px y a 5rem «para el sector»
  ya no cabía. Entraba con la fuente de respaldo y se partía con la display,
  así que **el CLS subía de 0.00007 a 0.01572** en 4G. Es la misma trampa del
  reparto 52/48 de la Fase 2: la columna de texto no admite recortes.
- **La etiqueta sale del borde del CONJUNTO, no del de su figura.** Como las
  figuras se solapan, la etiqueta de la central aterrizaba sobre la cara de la
  vecina. Cada figura lleva un `--fuera` (anchos de figura hasta salir del
  abanico) y la línea guía se estira para cubrirlo. **Esto se vio en captura,
  no en las medidas**: el rectángulo estaba dentro del viewport y no pisaba la
  columna de texto, así que todas las comprobaciones numéricas daban OK.
- **El orden del DOM es el orden visual, no el del JSON.** El destacado se
  coloca en el centro en build reordenando el array, no con `order` de CSS:
  con `order`, el foco por teclado saltaría del centro a un extremo.
- **`z-index`, escala, opacidad y lado se derivan de `--paso`** (distancia al
  centro normalizada a 0..1). Son interpolaciones lineales, no una lista de
  casos, y por eso 6 figuras salen bien sin escribir un solo valor nuevo.
- **Una timeline de flotación por figura, con periodo distinto.** Duración
  `5.4 + i·0.85` s y desfase `i·0.37` s. Si las tres subieran a la vez el
  abanico se leería como una sola imagen moviéndose.
- **La etiqueta es `<figcaption>`, no un tooltip.** Está SIEMPRE en el árbol de
  accesibilidad aunque esté oculta visualmente, así que un lector de pantalla
  anuncia nombre y tema sin depender del hover, que para él no existe.
- **560px de ancho y no 672.** La figura se dibuja como mucho a 346px (a 768px
  de viewport), así que 560 cubre DPR2 con margen. A 672 los tres WebP sumaban
  161.5 KB y **el LCP se degradaba de 576 a 708 ms**; a 560 suman 126.7 KB y
  el LCP vuelve a la par con la imagen grupal.
- **`fetchpriority="high"` solo en la destacada.** Se probó A/B en localhost y
  en 4G limitado: la diferencia quedó dentro del ruido (532 vs 536 ms de
  mediana sobre 11 pasadas). No es una optimización medida, es higiene de la
  señal — marcar tres recursos como prioritarios es no marcar ninguno. El LCP
  de esta página es el TÍTULO, no una imagen.
- **Un comentario `{/* */}` entre los atributos de una etiqueta compila pero
  rompe `astro check`** (15 errores en cascada, porque el bloque `{}` revienta
  el parseo JSX de la etiqueta entera). Va siempre antes de la etiqueta.

**PENDIENTE — convertir las figuras en enlaces (Fase 3).** Hoy la `<figure>`
es enfocable solo para revelar su etiqueta: NO es un enlace, porque `#ponentes`
todavía no existe y un ancla muerta es peor que ningún enlace. El sitio exacto
donde entra el envoltorio `<a href="#ponente-{slug}">` está escrito en un
comentario dentro de `Hero.astro`. **Al ponerlo hay que quitar el
`tabindex="0"` de la `<figure>`**: el enlace ya aporta el foco y dejar los dos
crearía dos paradas de tabulación por ponente.

**Estado**

`npm run build` y `npm run check`: 0 errores, 0 warnings, 0 hints.

Verificado en Chrome 150 headless por CDP con interacción real (ratón y
teclado), no leyendo el código:

| Métrica | Antes (grupal) | Ahora (abanico) |
| :------ | -------------: | --------------: |
| Imágenes del hero | 125.6 KB | **126.7 KB** (3 archivos) |
| Primera carga | ~282 KB | **~294 KB** |
| LCP (mediana de 9, alternadas) | 580 ms | **568 ms** |
| LCP en 4G lento | 2044 ms | **2012 ms** |
| CLS | 0 | **0** |

- **0 px de desbordamiento horizontal** en 375 / 430 / 768 / 992 / 1280 / 1440
  / 1920, con 3 figuras y con 6.
- **Etiquetas**: con hover y con Tab real, la línea llega a su largo, el texto
  sube a opacidad 1, las otras figuras bajan a 0.55 y ninguna etiqueta sale del
  viewport ni pisa la columna de texto. Aire más justo: 18px, a 1440px.
- **Movimiento reducido** desde el arranque: `data-motion=off`, las 69
  marcas `[data-anim]` visibles, flotaciones sin `transform`.
- **Interrupción a media animación** (la lección del bug de la Fase 5):
  activando «reducir movimiento» a los 350 ms, con el reveal en vuelo, quedan
  **0 elementos invisibles**.
- **Fallback por figura**: bloqueando solo `ponente-01`, esa figura pasa a
  `state=failed` con su marco punteado y su nombre, y las otras dos siguen en
  `loaded`. Nunca un icono de imagen rota.
- **Contraste**: nombre 17.13:1 (verde) y 16.36:1 (azul); tema y línea guía
  8.46:1 y 7.40:1. Todo por encima de AA.

> **Cómo regenerar los WebP.** Igual que en la Fase 2: no hay herramienta de
> imagen en el proyecto ni se añadió dependencia. Se conduce Chrome headless
> por CDP y se vuelca `canvas.toDataURL('image/webp', 0.90)`, reescalando en
> pasos de mitad (un `drawImage` directo de 1792 a 560 deja aliasing en el pelo
> y en los bordes de la ropa). Los originales viven en
> `C:\dev\expo-avicola-2026-assets-originales\`, fuera de control de versiones.

---

### Fase 2c — Seis figuras en dos rangos + desacople de la entrada · COMPLETADA

Entran las 3 figuras que faltaban y el hero pasa de fila única a **dos rangos
de profundidad**. Además, la figura frontal casi DUPLICA su tamaño y la entrada
del hero deja de depender del chunk de animación.

**Qué se hizo**

- 3 WebP nuevos y los 3 anteriores reconvertidos, todos a **672×900**.
- `hero-ponentes.json` pasa a 6 objetos.
- `Hero.astro`: sistema de dos rangos, dimensionado por alto, bandas de
  puntero, etiqueta superpuesta y propiedad de la entrada.
- `index.astro`: `noindex` TEMPORAL mientras los nombres sean placeholder.
- `animations.js`: arranque protegido con try/catch (ver abajo).

#### EL SISTEMA DE DOS RANGOS

Todo se deriva de `hero-ponentes.json`: número de figuras, reparto por filas,
posición, escala, opacidad, elevación, z-index, banda de puntero, orden de
entrada y duraciones de flotación.

| | Con **3** figuras o menos | Con **más de 3** |
| :-- | :-- | :-- |
| Filas | UNA | DOS rangos |
| Reparto | todas al frente | frontal = `ceil(n/2)` forzado a IMPAR; el resto al fondo |
| Fila de fondo | no existe | escala 0.82, opacidad 0.78, línea base elevada 0.186 altos, desplazada medio paso |
| Huella | 2.0 anchos de figura | 2.16 anchos |
| Figura a 1440px | 414 px de alto | **406 px de alto** |

Que la huella la marque la fila FRONTAL es lo que permite el tamaño: seis
figuras en una sola fila ocuparían 3.5 anchos y, como el tamaño lo limita el
ancho disponible, cada una encogería.

**Reparto con n=4, 5, 6, 7, 8:** `3+1`, `3+2`, `3+3`, `5+2`, `5+3`. La fila
frontal se fuerza a impar porque `centrar()` coloca al destacado en
`floor((total−1)/2)`, que en una fila PAR no es el centro sino la izquierda:
con n=4 el destacado acababa en el borde izquierdo de la composición, con el
mismo z-index que su vecina —que le pintaba encima— y entrando el tercero en
la animación. Detectado por revisión adversarial, no en pantalla: con 3 y con
6 no se manifiesta.

> **CÓMO AÑADIR O QUITAR FIGURAS.** Sigue siendo solo datos e imágenes.
> Recortar con el criterio de siempre (fondo transparente, persona centrada y
> pegada al borde inferior, proporción 56:75), convertir a **WebP 672×900
> calidad 90** y añadir o quitar objetos en `hero-ponentes.json`. Exactamente
> uno lleva `destacado: true`.
>
> **EL ORDEN DEL ARRAY DECIDE QUIÉN VA AL FONDO:** tras el destacado, los
> primeros del array completan la fila FRONTAL y el resto pasa al fondo. Es
> deliberado, porque es lo que permite curar el reparto desde los datos.

> **REGLA DE RECORTE, ampliada a dos rangos.** La regla del 1% entre laterales
> se aplica a la fila FRONTAL, que es donde un escalón se ve. Con los seis
> recortes actuales NO existe ningún reparto que la cumpla en las dos filas a
> la vez: frontales 01/03 quedan a 0.09% y traseras 06/04 a 2.38%. Se comparó
> en maqueta el reparto alternativo (frontales 06/02/04, traseras 01/03/05) y
> ahí el escalón SÍ se veía, porque estaba en primera fila y a escala 1.
> Coronillas medidas: 7.54 / 4.50 / 7.63 / 13.96 / 8.21 / 11.58 %.

#### PROPIEDAD DE LA ENTRADA

La entrada animada es mejora progresiva, no requisito. Hay **un único dueño**,
decidido una sola vez y sin vuelta atrás:

- **`gsap`** — el chunk llegó dentro del plazo. Corre el escalonado del centro
  hacia afuera, exactamente igual que antes.
- **`css`** — llegó tarde. Cada figura se revela en cuanto carga SU imagen, el
  texto en cuanto vence el plazo, y GSAP al aparecer **renuncia** a la entrada:
  solo engancha flotación y parallax, que parten del estado actual.

**REGLA DE ORO: una figura ya visible no se re-anima jamás.** Un `fromTo`, un
`from` o un `set` posterior la devolverían a opacity 0 con y=40 y el usuario
vería la composición saltar hacia abajo y volver a subir.

**El plazo son 700 ms desde el INICIO DE LA NAVEGACIÓN**, no desde que corre el
script ni desde que carga la primera imagen. Con «la primera imagen» como
disparador el CSS ganaría siempre: en red rápida las imágenes están listas a
~43 ms y el módulo del hero corre a ~298 ms, así que `img.complete` ya es true
al arrancar y el escalonado de GSAP no se vería nunca.

**Decisiones**

- **El «20% de solape» es de CUERPO y el paso es 0.5.** Los recortes traen
  ~38% de margen transparente; con la silueta al 62% del lienzo,
  `(0.62 − 0.5) / 0.62 = 0.194`.
- **Dimensionado POR ALTO.** Se fija `--fig-alto` (ligado a `svh`) y de ahí
  sale el ancho; solo si no cabe manda el `min(100%, …)`. Antes se repartía el
  ancho y el alto salía de rebote: por eso la figura se quedaba en 228px dentro
  de una columna de 598px, usando el 38% del alto disponible.
- **El ancho extra sale del SANGRADO, nunca de la columna de texto.** El
  conjunto se sale del padding del contenedor hacia el margen de la página. La
  columna de texto no admite recortes: por debajo de ~510px «para el sector» se
  parte al entrar la fuente display y reaparece el CLS.
- **Etiqueta ENCIMA, no lateral.** Medido a 1440px: con etiqueta lateral la
  figura frontal se queda en 295px; con la etiqueta encima llega a 423px. El
  encargo pedía que el espacio de la etiqueta no restara tamaño a las figuras.
- **Bandas verticales de puntero.** Los lienzos solapan un 50% y traen margen
  transparente: con la caja entera como área sensible, de seis figuras solo
  respondían dos, y al pasar el ratón por una se encendía otra. El conjunto se
  reparte en bandas disjuntas que no dependen del z-index.
- **La banda se estira 6rem hacia ARRIBA** para cubrir el hueco de la etiqueta:
  sin eso, mover el ratón desde la cara hacia el nombre lo desvanecía justo al
  intentar leerlo (WCAG 1.4.13).
- **El ratón gana al foco.** `:focus` persiste tras un clic, así que al hacer
  clic en una figura y pasar el ratón por otra quedaban dos etiquetas
  encendidas. Se usa `:focus` y no `:focus-visible` porque en táctil un toque
  no casa `:focus-visible` y no revelaría nada.
- **El anillo de foco por teclado sube a z-index 200**, solo con
  `:focus-visible`. Las vecinas se solapan y le partían el anillo.
- **`ponente-02` a calidad 85, el resto a 90.** Tiene **3.08× la energía de
  alta frecuencia** de la mediana (camisa a cuadros): 80.8 KB contra ~37 de
  media. A 85 baja a 66.4 KB y a tamaño de render real es indistinguible,
  comprobado también a 3× sobre la camisa.
- **Arranque protegido en `animations.js`.** `motionReady='1'` desarma el
  failsafe del `<head>` ANTES de `registerPlugin` y `new Lenis`. Si algo de eso
  reventaba, la excepción subía al `.catch()` vacío de los once componentes,
  `data-motion` se quedaba en `'on'` y TODOS los `[data-anim]` de la página
  —72 solo en el hero— se quedaban invisibles para siempre. Ahora ese bloque
  va en try/catch y él mismo pone `data-motion='off'`.

**Estado**

`npm run build` y `npm run check`: 0 errores, 0 warnings, 0 hints.

Verificado en Chrome 150 headless por CDP con interacción real:

| Métrica | 3 figuras (Fase 2b) | 6 en dos rangos |
| :------ | ------------------: | --------------: |
| Figura frontal a 1440px | 228 px | **406 px** |
| Imágenes del hero | 126.7 KB (3) | **248.5 KB** (6) |
| LCP sin limitar | 368 ms | **440 ms** |
| CLS | 0 | **0** |
| Hero completo en 4G | 3368 ms | **2534 ms** |
| Texto legible en 4G | 3368 ms | **1867 ms** |

- **0 px de desbordamiento** en 375 / 430 / 768 / 1024 / 1280 / 1440 / 1920,
  con 3 figuras y con 6.
- **Oclusión: 0.0% de las tres caras de fondo tapadas** por la fila frontal, en
  los cinco anchos de composición.
- **Saltos en red lenta: 0.** 349 muestras por `requestAnimationFrame` entre
  582 y 6490 ms, umbral de 8px entre fotogramas consecutivos. 0 apagones. El
  dueño de la entrada nunca cambia. *Nota metodológica: el primer detector daba
  123 falsos positivos porque marcaba la FLOTACIÓN como salto; hay que comparar
  fotogramas consecutivos, no contra el mínimo histórico.*
- **Red rápida:** dueño `gsap`, escalonado monótono del centro hacia afuera a
  367 / 467 / 552 / 635 / 734 / 818 ms.
- **`animations.js` bloqueado del todo:** 14/14 elementos del hero visibles.
- **Movimiento reducido:** 6 visibles y quietas, `transform: none`.
- **Fallback por figura:** bloqueando solo `ponente-01`, esa pasa a `failed`
  con su marco punteado y las otras cinco siguen en `loaded`.

**Observación sobre el patrón `[data-anim]`.** A los 2 s en 4G, antes de que
llegue GSAP, hay **60 de 72** elementos en `opacity: 0` — pero solo **2 caen
dentro del primer viewport**, y los dos son del hero (comprobado también a
1440×1440). El resto vive bajo el pliegue y lo revela ScrollTrigger al hacer
scroll, cuando GSAP ya llegó. Por eso la maquinaria de propiedad de la entrada
se quedó en `Hero.astro` y no se generalizó: **si algún día otra sección sube
al primer viewport, el patrón está escrito ahí para copiarlo.**

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

---

### Fase 5 — Boletos · COMPLETADA

**Qué se hizo**

- `boletos.json`: un array con el único boleto que existe (`acceso-general`,
  $699 MXN, siete puntos de «incluye», `priceId` y `checkoutUrl` en null).
  **No hay niveles, ni comparativa, ni precios tachados: solo este.**
- `Boletos.astro`: `id="boletos"`, tarjeta única centrada de 560px con barra de
  acento de 2px arriba y halo tenue detrás, precio grande en `--font-display`
  con tabular-nums, lista de incluye con check SVG dibujado a mano, CTA a ancho
  completo y aviso accesible mientras no haya pasarela.
- `site.json` estrena `contacto.whatsapp` (hoy `null`).
- `global.css`: corregido el `scroll-padding-block-start`.
- `animations.js`: `detenerMovimiento()` ahora también limpia
  `[data-anim-punto]`.

**Decisiones**

- **El aviso del botón no promete WhatsApp mientras no haya número.** Con
  `site.contacto.whatsapp` en null el texto solo dice que la venta abre pronto;
  el enlace `wa.me` aparece automáticamente en cuanto se rellene la clave.
  Ofrecer un canal de contacto sin forma de usarlo es peor que no ofrecerlo.
- **La región del aviso nace vacía y siempre presente**, con `role="status"` y
  `aria-live="polite"`. Si se insertara en el DOM junto con su texto, muchos
  lectores de pantalla no lo anunciarían. Vacía no ocupa alto (el estilo va en
  `.aviso:not(:empty)`), así que no descuadra la tarjeta. El segundo clic no
  vuelve a insertar ni a re-anunciar.
- **Sin JS el aviso se pinta ya escrito** (`.aviso--sinjs`, oculta bajo
  `[data-js]`): el botón no puede hacer nada sin JS, así que la información se
  da de entrada. Mismo reparto que la imagen del hero.
- **Los puntos de «incluye» NO llevan `[data-anim]`.** Ese atributo los pondría
  a `opacity: 0` por CSS hasta que GSAP los tocara; como ya viven dentro de una
  tarjeta que se anima entera, se animan con `.from()` desde su estado final y
  un fallo a media carga los deja perfectamente legibles.
- **`detenerMovimiento()` tuvo que ampliarse.** Al animar con `.from()`, GSAP
  escribe `opacity: 0` EN LÍNEA, y no hay regla CSS que rescate a
  `[data-anim-punto]` como sí la hay para `[data-anim]`. Sin añadirlo al
  `clearProps`, activar «reducir movimiento» a media animación dejaba los siete
  puntos invisibles para siempre. Verificado interrumpiendo la timeline a los
  350 ms: antes del arreglo quedaban en `opacity: 0`; después quedan limpios.
  **Regla para el futuro: todo lo que la capa de movimiento toque tiene que
  estar en ese selector.**
- **`scroll-padding-block-start` pasó de `--space-2xl` (4rem) a
  `calc(var(--nav-h) + var(--space-md))` (5.5rem).** La nav mide 4.5rem, así que
  el valor anterior dejaba el destino de CUALQUIER ancla 8px por debajo de la
  barra. Se arregló en `global.css` y no con un `scroll-margin-top` local: el
  fallo no era de la sección de boletos, era de todas las anclas por el camino
  del scroll nativo (sin JS, con movimiento reducido, o si GSAP no llega).
  Con Lenis vivo el offset ya lo calculaba `bindAnchors()` midiendo la nav real.
- **La fecha del encabezado se formatea con `timeZone: 'UTC'`.** `site.fecha` es
  una fecha sin hora, que el motor lee como medianoche UTC; formateándola en
  hora de México saldría «6 de agosto».
- **El precio se lee entero para lectores de pantalla** con un `.sr-only`: sin
  él, los tres trozos (`$`, `699`, `MXN`) se anuncian sueltos.

**Estado**

`npm run build` y `npm run check` pasan con 0 errores, 0 warnings y 0 hints.

Verificado en Chrome 150 headless por CDP, no leyendo el código:

- **Los 5 enlaces a `#boletos`** —enlace y CTA de la nav, enlace y CTA del menú
  móvil, y CTA del hero— llegan a la sección con `top=161px` frente a un
  `navBottom=73px`: ninguno queda tapado, y el foco acaba dentro de la sección.
- **Camino del scroll nativo** (movimiento reducido, sin Lenis): `top=88px`
  contra `navBottom=73px`. Antes del arreglo del `scroll-padding` quedaba por
  debajo.
- **Casos límite del JSON, probados de verdad** modificando el fichero,
  compilando y revirtiendo: con `precio: null` sale «Por definir» sin dejar
  colgando ni el `$` ni el `MXN`; con `disponible: false` sale la etiqueta
  «Agotado», el botón queda `disabled`, desaparece el `data-comprar` y se apaga
  el halo.
- **Aviso**: región vacía de 0px de alto con `role="status"`; tras el clic,
  78px con el texto; el segundo clic no duplica.
- **0 px de desbordamiento horizontal** en 375/768/1440 × verde/azul, con los
  45 `[data-anim]` visibles al final del recorrido y los 7 puntos en opacidad 1.
- **Contraste**: el par más bajo es 6.66:1 (texto secundario en azul). El CTA da
  12.86:1 en verde y 10.55:1 en azul.

**PENDIENTE — integración de pagos.** Ver «Riesgos abiertos». Sin `checkoutUrl`
el sitio informa, pero no vende.

---

### Fase 6 — Sede, patrocinadores, FAQ, CTA final y footer · COMPLETADA

Cierra la landing: ya no falta ninguna sección salvo Ponentes (Fase 3).

**Qué se hizo**

- `Sede.astro` (`id="sede"`): ficha de datos en dos columnas con el mapa a la
  derecha. Fecha, horario y ciudad salen de `site.json`; recinto y dirección
  están en `null` y se pintan como «Por confirmar».
- `Patrocinadores.astro`: Avipork y Prosermat desde `patrocinadores.json`, con
  el mismo fallback de imagen del hero. Avipork enlaza a su web; Prosermat no
  tiene URL y por eso su tarjeta no es un enlace.
- `Faq.astro` (`id="faq"`): siete preguntas en `<details>`/`<summary>` nativos.
- `CtaFinal.astro`: banda a ancho completo en `--surface-2` con el último CTA.
- `Footer.astro`: tres columnas + barra inferior. Fuera de `<main>`.
- `navegacion.json` y `fechas.js`: dos fuentes compartidas nuevas (ver abajo).
- `site.json` estrena `horario`, `direccion`, `contacto.correo` y
  `contacto.telefono`.

**Decisiones**

- **El acordeón usa `<details>`/`<summary>` nativos, no divs con JS.** Sale
  gratis: teclado (Enter y Espacio), estado expandido en el árbol de
  accesibilidad, y Ctrl+F encuentra texto dentro de un panel cerrado. Nada de
  eso habría salido gratis reimplementándolo. Verificado con teclas reales por
  CDP: `role=DisclosureTriangle`, `expanded` pasa de `false` a `true`.
- **La animación del acordeón va SOLO en el chevron.** Animar la altura de un
  `<details>` obliga a medirlo con JS y a tomar el control del abierto/cerrado,
  que es justo lo que rompe el funcionamiento sin bundle.
- **Los enlaces de nav se mudaron a `src/data/navegacion.json`.** El footer
  sirve los mismos cuatro; tenerlos duplicados en dos componentes garantizaba
  que algún día se desincronizaran. Efecto colateral honesto: el footer añade
  un tercer enlace muerto a `#ponentes`.
- **El formateo de fechas se extrajo a `src/scripts/fechas.js`.** La fecha se
  pinta en cuatro sitios y todos comparten la misma trampa (`site.fecha` es una
  fecha sin hora que hay que formatear en UTC o sale el día 6). Tenerla en un
  solo sitio evita que el próximo componente la repita mal.
- **El footer va FUERA de `<main>`.** Es contenido de la página, no del
  contenido principal; metido dentro, «Saltar al contenido» lo habría incluido
  en el mismo salto.
- **La nav del footer se llama «Enlaces del pie de página», no «Secciones del
  sitio».** Ese nombre ya lo usa la cabecera, y dos landmarks de navegación con
  nombre idéntico son indistinguibles al navegar por landmarks. Detectado
  leyendo los `aria-label` renderizados, no a ojo.
- **Los datos pendientes se apagan, no se esconden.** «Por confirmar» va en
  `--text-muted` y cursiva, con la tipografía de cuerpo en vez de la display:
  se lee distinto del resto a propósito, porque el mensaje es «falta este dato»,
  no «aquí no hay nada».
- **El aviso de privacidad es texto plano.** La página `/privacidad` no existe y
  enlazarla sería un 404 — el mismo error que llevamos evitando con las anclas.
- **`soloDigitos` acepta `unknown`.** Hoy las tres claves de contacto son `null`
  y TypeScript infiere ese tipo; cuando lleguen serán texto y pueden traer
  espacios o guiones, de ahí el filtro para `tel:` y `wa.me`.

**Estado**

`npm run build` y `npm run check` pasan con 0 errores, 0 warnings y 0 hints.

Verificado en Chrome 150 headless por CDP:

- **18 enlaces ancla, 15 vivos verificados con clic real**: todos aterrizan a
  161px con la nav acabando en 73px. Los 3 muertos van a `#ponentes`.
- **«Saltar al contenido»** deja el primer texto del hero a 156px, libre de la
  barra. (Medir la caja de `<main>` da 0px y parece tapado: es un falso
  positivo, el hero tiene su propio padding superior.)
- **Acordeón por teclado**: Tab llega al `<summary>` con anillo visible
  (`2px solid` en `--accent`, offset -2px), y Enter y Espacio lo abren y
  cierran. *Nota metodológica: un `Input.dispatchKeyEvent` de Enter sin los
  eventos `text`/`char` NO dispara la acción por defecto y da un falso negativo.
  Hizo falta un experimento de control sobre un `<button>` para descartarlo.*
- **Sin JavaScript**: el acordeón sigue abriendo y cerrando, y ningún
  `[data-anim]` queda oculto.
- **0 px de desbordamiento** en 375/768/1440 × verde/azul, con los 67
  `[data-anim]` visibles al final del recorrido.
- **Interrupción a media animación** (la lección del bug de la Fase 5): al
  activar «reducir movimiento» con las entradas de Sede en vuelo, los 67
  elementos quedan visibles. Ninguna animación nueva usa atributos fuera del
  `clearProps` de `detenerMovimiento()`.
- **Jerarquía de headings**: 1 h1, 11 h2, 22 h3, sin un solo salto de nivel.
- **Contraste**: 38 pares comprobados en los dos temas, 0 por debajo del mínimo.
  El más ajustado es 6.66:1 (texto secundario sobre `--surface` en azul).

---

### Fase 7 — SEO técnico, datos estructurados e indexación · COMPLETADA

Cero secciones nuevas. Todo es cabecera, archivos de indexación y rendimiento.

**Qué se hizo**

- `Base.astro`: `lang="es-MX"`, Open Graph completo con imagen, Twitter card
  `summary_large_image`, `theme-color`, preload de fuentes, `noindex` opcional
  y el JSON-LD del evento tras la bandera `evento`.
- `src/scripts/schema.js`: genera el `Event` de schema.org desde `site.json`,
  `programa.json` y `boletos.json`.
- `astro.config.mjs`: integración `@astrojs/sitemap` filtrando `/404` y
  `/admin`.
- `public/robots.txt` y `src/pages/404.astro`.
- CLS: reserva de ancho en la cuenta regresiva y `width`/`height` en los logos.

**Decisiones**

- **`theme-color` se lee de `--bg` en tiempo de ejecución, no se escribe el hex
  en el `<head>`.** Los colores viven solo en `tokens.css` (convención 1) y
  duplicarlos en el layout era garantizar que un día dejaran de coincidir. El
  script inline lo rellena leyendo la variable computada, y lo vuelve a hacer en
  cada `themechange`. Como la barra del navegador es cromo del sistema y no
  contenido, rellenarla un instante después del primer pintado no provoca ningún
  salto. Verificado: verde da `#0a0f0d` y azul `#0a1428`, ambos idénticos al
  `--bg` real.
- **`limpiar()` poda el JSON-LD antes de emitirlo.** Un `"name": null` dentro de
  un `Place` es peor que no declarar el campo: Google lo lee como dato
  malformado. La poda es recursiva y también quita objetos que se quedan sin
  claves. Verificado con `recinto` y `direccion` en null (no aparecen) y
  rellenándolos a mano (aparecen).
- **Las fechas del schema se derivan de `site.horario`, no de `site.inicio`.**
  El JSON-LD declara 08:00–16:30 porque es la franja en la que el asistente
  puede entrar. De `site.inicio` solo se toma el **desfase horario** (`-06:00`),
  para que la zona del evento viva en un único sitio; su hora no interviene.

  > Corregido después de la Fase 7: `site.inicio` marcaba las 09:00 (la primera
  > conferencia), así que la cuenta regresiva del hero llegaba a cero una hora
  > después de que abrieran las puertas. Ahora son las **08:00**, iguales que el
  > `startDate`. El JSON-LD no cambió ni un byte: nunca dependió de esa hora.
- **«Por confirmar» no entra como `performer`.** Declarar una `Person` con ese
  nombre sería afirmar que existe alguien que se llama así. Los cuatro ponentes
  reales sí entran, y Edgar Oliva —que da dos sesiones— aparece una sola vez.
- **`localidad`, `region` y `pais` son claves nuevas de `site.json`.** El schema
  necesita la dirección desglosada y `ciudad` es una cadena de presentación
  («Tehuacán, Puebla»). Partirla por la coma habría funcionado hoy y se habría
  roto el día que alguien la escriba distinto. **Si se cambia `ciudad`, hay que
  cambiar también estas tres.**
- **`/admin` quedó fuera del sitemap y con `noindex`.** El primer build lo
  incluía: un panel interno invitando a Google a rastrearlo. Lleva las dos
  cosas porque quedar fuera del sitemap no impide que un buscador lo encuentre
  por otro camino.
- **Preload solo de los dos `.woff2` latinos.** Se importan con `?url` para que
  la ruta lleve el hash real del build y el preload no apunte nunca a un archivo
  inexistente.
- **Los 8 subconjuntos restantes se quedan.** Emitirlos no cuesta nada al
  visitante: su `unicode-range` hace que un texto en español no los pida jamás.
  Medido: en una carga completa se descargan **2 woff2, no 10**.
- **La 404 no carga la capa de movimiento.** Bajar 132 KB de GSAP para animar un
  mensaje de error es justo el peso que esta fase quita.

**Estado**

`npm run build` y `npm run check` pasan con 0 errores, 0 warnings y 0 hints.
Tres páginas construidas + sitemap.

Medido sobre el build de producción servido con `astro preview` (no el dev
server, que sirve los módulos sin empaquetar y da cifras engañosas):

| Métrica | Valor |
| :------ | :---- |
| CLS | **0** — cero desplazamientos de layout |
| JS crítico | **10 066 B** en 12 archivos |
| GSAP + Lenis | **133 289 B**, fuera del HTML, solo por import dinámico |
| CSS | 37 178 B en 2 archivos |
| Fuentes descargadas | **2 de 10** (89 600 B); las otras 8 nunca se piden |
| Primera carga total | ~181 KB |

- **JSON-LD**: extraído del HTML compilado y parseado con `JSON.parse`. Válido,
  con los 11 campos exigidos y **cero valores null**.
- **Indexación**: `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml` y `/404`
  responden 200. El sitemap contiene **solo la home**.
- **Cuenta regresiva**: el ancho no se mueve entre el valor de build y el primer
  tick (38,3 px antes y después).

**Observación, no defecto:** la home sirve **11 `<script type="module">`
separados**, uno por componente, de unos 800 B cada uno. Es consecuencia directa
del patrón de script local por componente que usa el proyecto desde la Fase 2.
Con HTTP/2 el coste es bajo y el total son 10 KB, así que **no se tocó**:
unificarlos obligaría a sacar el JS de los once componentes a un punto de
entrada común y a perder la localidad que hace legible cada uno. Queda anotado
por si algún día una auditoría de red lo señala.

---

### Dominio propio — de subpath a raíz

El sitio pasa de `michaelking19rtx-lgtm.github.io/expo-avicola-2026/` a
**`https://expo.visionpecuariamx.com/`**, de un subpath a la raíz.

**Qué se tocó, y fue poco**

| Archivo | Qué cambió |
| :------ | :--------- |
| `public/CNAME` | **NUEVO.** Una línea: `expo.visionpecuariamx.com` |
| `astro.config.mjs` | `site` al dominio nuevo, `base` de `/expo-avicola-2026` a `/` |
| `public/robots.txt` | La URL del `Sitemap:` |
| `README.md`, `CLAUDE.md` | Referencias a producción y al subpath |
| `src/scripts/paths.js` | Solo el comentario del helper |

**Ni un componente.** El barrido no encontró una sola ruta escrita a mano en
`src/`: todas pasan por `asset()` o por `import.meta.env.BASE_URL`. La
convención 9 se pagó sola aquí — cambiar dos líneas de config reescribió las
27 rutas de assets, el canonical, las Open Graph, las de Twitter, el sitemap
entero y el JSON-LD.

> **QUIÉN SOSTIENE EL DOMINIO — y una corrección.** El encargo pedía crear
> `public/CNAME` «porque el deploy sobrescribe la rama del sitio y borraría el
> CNAME que GitHub acaba de crear». **Esa justificación no aplica a este
> repo** y se escribió en el código antes de comprobarla, que es exactamente
> lo que prohíbe la convención 11.
>
> Lo verificado: no existe rama `gh-pages` —solo `main`—, el despliegue es por
> ARTEFACTO (`withastro/action` + `actions/deploy-pages`), y en ese modo la
> documentación de GitHub dice que no se crea ningún CNAME y que el del
> artefacto se ignora. El CNAME manda solo publicando DESDE UNA RAMA, que es
> de donde viene la costumbre.
>
> **El dominio lo sostiene el ajuste Custom domain de Settings → Pages.**
> Comprobado contra producción: `michaelking19rtx-lgtm.github.io/expo-avicola-2026/`
> responde **301 hacia el dominio nuevo**, redirección que GitHub solo emite
> cuando ese ajuste está puesto, y el dominio sirve por HTTPS con certificado
> válido.
>
> `public/CNAME` se conserva igualmente —26 bytes, y es el seguro si algún día
> se vuelve a publicación por rama—, pero **no es lo que mantiene el dominio en
> pie**. `dist/CNAME` sale con una línea exacta, sin protocolo ni barra final.

> **El dominio está escrito a mano en CUATRO sitios**, no en uno: `site` de
> `astro.config.mjs` (de donde se derivan canonical, OG y sitemap),
> `public/CNAME`, la línea `Sitemap:` de `public/robots.txt`, y la
> documentación (README y este archivo). La lista va dentro del propio
> `robots.txt`, que es donde alguien la va a necesitar.

**Verificado sobre el build compilado y sirviéndolo**

- `canonical`, `og:url`, `og:image`, `twitter:image` → dominio nuevo.
- JSON-LD: `url` y `organizer.url` al dominio nuevo; **`offers[0].url` sigue
  apuntando a `buy.stripe.com`**, que es lo correcto. Cero `null`.
- `sitemap-index.xml` y `sitemap-0.xml` → dominio nuevo, solo la home.
- **`noindex` intacto**: sigue pendiente por los nombres placeholder.
- Recorriendo home, `/404` y `/admin/`: **0 respuestas 4xx atribuibles a la
  migración**. `/`, `/CNAME`, `/robots.txt`, los dos sitemaps, `/favicon.svg`
  y los WebP del hero responden 200, y la ruta vieja `/expo-avicola-2026/` da
  404, que es lo que debe dar.
- Aparecen **dos 404 preexistentes**: `avipork.png` y `prosermat.png`. Son el
  pendiente 7 —la carpeta `public/img/patrocinadores/` está vacía— y el
  componente los cubre con su marco punteado. Comprobado en pantalla: los dos
  en `data-state="failed"` con su nombre visible.

#### TRAMPA — `.gitignore` bloqueaba assets que SÍ hay que publicar · CERRADA

Salió al revisar la migración y **no es de la migración**: `.gitignore` ignora
`public/img/**/*.{png,jpg,jpeg,…}` para que no se cuele un original sin
optimizar, pero esa red barre también los entregables ya servibles.

Comprobado con `git check-ignore -v`:

| Archivo | Regla que lo bloquea |
| :------ | :------------------- |
| `public/img/og/og-expo-avicola.jpg` (pendiente 14) | `.gitignore:32` |
| `public/img/patrocinadores/avipork.png` (pendiente 7) | `.gitignore:31` |

**Y ya está ocurriendo.** `public/img/ponentes/` contiene seis fotos
entregadas —`retrato-01.jpeg` … `retrato-06.jpeg`— y `git status` sobre esa
carpeta devuelve **silencio**: están en disco, en la carpeta que se sirve,
invisibles para git y sin aviso en ninguna parte. Como la Fase 3 está
pospuesta todavía no rompen nada, pero el mecanismo es el de «funciona en
local, falta en producción»: el runner compila solo lo commiteado.

Las figuras del hero se salvaron por casualidad, no por diseño: son `.webp` y
esa extensión no está en la lista.

**CERRADA** — ver «Qué entra a `public/img/` y qué no», justo debajo.

---

### Nombres reales en el hero — cinco de seis

**Qué se hizo**

- `hero-ponentes.json`: nombres, temas y `slug` definitivos de los cinco
  confirmados. El destacado pasa de `ponente-02` a `ponente-01` (Edgar).
- `schema.js`: los `performer` del JSON-LD pasan a salir de DOS fuentes.

**Los `performer` unen agenda y hero, y ninguna fuente basta sola.** Salían
solo de `programa.json`, que lista a quien tiene sesión asignada. IBQ. Esteban
Fructuoso Alducin está confirmado y anunciado en el hero pero **todavía no
tiene ponencia**, así que quedaba fuera. Un `performer` es quien participa en
el evento, no quien tiene hueco en el horario. Se unen las dos listas y se
deduplica —Edgar da dos sesiones y aparece una vez— y salen los cinco.

Verificado extrayendo el JSON-LD del HTML compilado: 5 performers, cero
`null`, y ningún «Por confirmar» colado.

**Las etiquetas aguantan los nombres largos.** El más largo, «IAZ. José Ángel
de la Cruz Hernández», ocupa 36 caracteres frente a los 21 del placeholder.
Medido en 360/375/390/430/768/1024/1440 × verde/azul: **0 px de desbordamiento,
ninguna etiqueta se sale del viewport, ninguna tapa una cara** y el nombre no
pasa de dos líneas en ningún ancho. La etiqueta más alta son 90px en
escritorio y 68px en la rejilla de móvil.

#### EL ORDEN DEL ARRAY, y por qué es el que es

`01 · 03 · 05 · 06 · 02 · 04`, con `01` destacado. **No es arbitrario: lo fija
la regla de recorte.**

| | Fila frontal (izq→der) | Coronillas | Diferencia entre laterales |
| :-- | :-- | :-- | :-- |
| Primer intento | `02` · **01** · `03` | 4.50 / 7.54 / 7.63 | **3.13%** ✗ |
| Definitivo | `03` · **01** · `05` | 7.63 / 7.54 / 8.21 | **0.58%** ✓ |

Al pasar el destacado a Edgar (`01`) conservando el orden anterior, las
laterales quedaban a 3.13% —la regla pide 1%— y, peor, **el centro dejaba de
ser el más alto**: medido en pantalla a 1440 con las figuras quietas, la
coronilla de Alejandro quedaba 12px por encima de la del destacado, y el
sombrero lo acentuaba. El arco se invertía por la izquierda y el protagonista
dejaba de leerse como tal, que es justo lo contrario de destacar a alguien.

Con el orden definitivo las tres cabezas frontales quedan **dentro de 2px** y
Alejandro pasa a la fila de fondo, donde su altura asoma entre hombros sin
competir. La fila de fondo queda `06 · 02 · 04` —laterales a 2.38%, y el más
alto en el centro— repitiendo la misma lógica en pequeño.

> **Al medir coronillas en pantalla, hay que apagar el movimiento.** La primera
> medida daba 12-14px de desnivel entre las tres frontales *después* del
> arreglo, y era la FLOTACIÓN: cada figura oscila ±10px con fase distinta. Con
> `prefers-reduced-motion` quedan quietas y la medida es del recorte, no de la
> animación.

---

### Revisión de móvil — el sitio ya cobra y el tráfico llega por WhatsApp

Móvil pasa a ser la versión principal, no la secundaria. Siete arreglos, todos
medidos antes y después, y **ninguno toca escritorio** salvo uno declarado.

| # | Qué pasaba | Cómo quedó |
| - | :--------- | :--------- |
| 1 | CLS 0.028 en 4G: el eyebrow saltaba de 1 a 2 líneas al cargar la fuente y empujaba el título 22px | **CLS 0.0094** |
| 2 | 9 áreas de toque bajo 44px (4 del pie a **20px de alto**) | **0** |
| 3 | El CTA de compra caía **628px** por debajo del precio | **114px**, ambos en pantalla |
| 4 | 52 textos por debajo de 14px | **6** (los `figura__tema`, a 12px por decisión) |
| 5 | Título del programa partido a 23–26 caracteres | 232 → **264px** de ancho |
| 6 | En horizontal los CTAs quedaban en y=543 de 430 | **dentro** a 430 y a 390 de alto |

**Decisiones**

- **El eyebrow se parte por CSS, no por métrica de fuente.** Se eligió el
  salto deliberado en vez de reservar la altura porque arregla dos cosas de
  una: elimina el reflow y además el corte cae donde tiene sentido —lugar
  arriba, fecha abajo— en vez de a mitad de «7 DE / AGOSTO», que es donde caía
  solo. El número de líneas lo decide el layout, así que no hay reflow posible.
- **En móvil el orden de decisión es precio → botón → detalles.** El CTA se
  duplica: uno bajo el precio y otro al final de «incluye», para quien
  necesitó leerla. No se ven recargados porque quedan a ~600px: **nunca
  coinciden en pantalla**. En escritorio el de cabecera no se pinta y la
  tarjeta queda exactamente igual que antes.
- **Las áreas de toque se agrandan solo por debajo de 62rem.** Un blanco de
  44px en escritorio no sobra, pero habría separado el pie sin que nadie lo
  pidiera. Se agranda el área pulsable con padding; **la letra no cambia**.
- **Dos escalones para pantalla baja, no uno.** Aflojar el `min-height` a
  `max-height: 34rem` dejaba los CTAs 23px fuera a 390px de alto, porque el
  contenido ya era más alto que el viewport: hay que comprimir el bloque, no
  la caja. El segundo escalón (`max-height: 26rem`) aprieta más el ritmo. Van
  separados porque a 430px el primero ya entra holgado y comprimirlo más solo
  le quitaría aire.
- **El programa no estrena navegación por horas ni acordeón.** Para un evento
  de un día, 13 filas de scroll continuo son aceptables; se ganó ancho
  recortando la sangría del slot y el relleno de la caja, sin tocar el carril.

> **ESCRITORIO: un solo cambio, y es el pedido.** `figura__tema` pasa de 11 a
> 12px en todos los anchos. Todo lo demás quedó verificado idéntico a 1024,
> 1280, 1440 y 1920: altura del hero, alto de la tarjeta (839/851/852/852),
> tamaño de las figuras (279/357/406/444), eyebrow en una línea, un solo CTA y
> sangría del programa en 40px. El mínimo del clamp de `--step--1` sube a 14px
> pero **el tramo variable ya alcanzaba 14px a partir de 800px de ancho**, así
> que de ahí para arriba manda el mismo máximo de siempre.

**Rendimiento en 4G, móvil 390×844, mediana de 5**

| | Antes | Después |
| :-- | --: | --: |
| LCP | 2180 ms | **2176 ms** |
| CLS | 0.02836 | **0.00939** |
| texto legible | 1865 ms | 1868 ms |
| hero completo | 2548 ms | 2547 ms |

El CLS que queda (0.0094, muy por debajo del 0.1 de «bueno») lo produce el
reflow de las etiquetas bajo las figuras al cargar la fuente. **No se persiguió
a propósito:** reservarles altura fija sería apostar por un largo de nombre que
va a cambiar en cuanto lleguen los nombres reales.

> **Dos falsos negativos propios en esta tanda, los dos de tubería mal puesta.**
> (1) La primera medición de 4G dio «LCP 540 ms, CLS 0.588»: el script apuntaba
> a `localhost:4321/expo-avicola-2026/`, una URL de antes de la migración que un
> preview viejo seguía sirviendo. Se detectó porque 540 ms en 4G es imposible.
> (2) Un `npm run build | grep | head -1` mató el build por SIGPIPE a media
> ejecución y dejó `dist/` con la versión anterior, así que dos verificaciones
> seguidas midieron un build que no era el del código. **No pasar la salida del
> build por `head`.**

**Lo que NO se hizo, y por qué**

- **Barra de compra fija. YA NO: SE IMPLEMENTÓ.** Ver «La barra de compra fija»
  al final de la bitácora. Se aparcó aquí porque competía con el CTA del hero
  durante todo el scroll; se retomó con el diseño de esta entrada intacto
  —`IntersectionObserver` sobre hero y boletos (no listeners de scroll, para no
  tocar Lenis), `visualViewport` para el teclado, reserva de hueco con
  `padding-block-end` en el `body` y `env(safe-area-inset-bottom)`— y el
  conflicto con el hero lo resuelve el propio observer: no aparece hasta que el
  hero sale de vista.
- **Las seis etiquetas «Ponente por confirmar».** Tres pantallas de repetición
  en móvil, pero se resuelve solo al llegar los nombres.

**Lo que ya estaba bien** y se confirmó midiendo: cero scroll horizontal en
360/375/390/414/430 y en horizontal, en ambos temas; el countdown cabe en una
línea en todos los anchos; las 8 anclas aterrizan libres de la nav; y la
hamburguesa, el menú móvil, los `<summary>` del FAQ y las figuras del hero ya
superaban los 44px.

---

### Qué entra a `public/img/` y qué no

> **Léelo antes de subir la imagen Open Graph, los logos de patrocinadores o
> los retratos de la Fase 3.** Aquí se tropezó ya una vez.

**La regla, en una línea:** a `public/img/` entra lo que se sirve; los
originales pesados viven fuera del repo, en
`../expo-avicola-2026-assets-originales/`.

| | Entra al repo | Dónde |
| :-- | :-- | :-- |
| `.webp`, `.svg`, `.avif` | **Sí** | `public/img/…` |
| `.png`, `.jpg`, `.jpeg` **ya optimizados** | **Sí** | `public/img/…` |
| `.png`/`.jpg` **originales de varios MB** | **No** | carpeta hermana de originales |
| `.psd`, `.tif`, `.tiff`, `.ai`, `.xcf` | **No — bloqueados** | carpeta hermana |

**Por qué el criterio es «formato que nunca se sirve» y no «formato pesado».**
Hasta la migración a dominio propio, `.gitignore` bloqueaba `png/jpg/jpeg` bajo
`public/img/` para frenar los originales. El problema es que un `.png` puede
ser tanto un original de 4.79 MB como el logo final de un patrocinador: el
formato no distingue el rol, así que la regla escondía las dos cosas. Y lo
hacía en silencio — se veían en local y faltaban en producción, porque el
runner compila solo lo commiteado.

Ya estaba ocurriendo: seis retratos llevaban tiempo en `public/img/ponentes/`,
invisibles para git, sin un solo aviso.

Ahora solo se bloquean los formatos que **nunca** son servibles (`.psd`,
`.tif`, `.tiff`, `.ai`, `.xcf`): ahí no hay falsos positivos posibles.

**La protección contra el binario pesado no desapareció, cambió de forma.** La
cubre `avisaDeAssetsDePublic()`, una integración mínima en `astro.config.mjs`
que corre en `astro:build:start` y avisa —nunca lanza— de dos cosas:

1. **Archivos servibles que git esté ignorando.** El fallo viejo: invisibles.
2. **Archivos servibles de más de 400 KB.** Probablemente un original.

> El umbral de 400 KB sale de medir este repo: las seis figuras del hero pesan
> entre 26 y 68 KB ya optimizadas y los retratos sin convertir rondan los
> 2.3 MB. Deja holgura de sobra a un entregable legítimo —una Open Graph de
> 1200×630 no llega— y caza cualquier original.

> **`--no-index` en `git check-ignore` es imprescindible, y costó encontrarlo.**
> Sin él, `check-ignore` **omite los archivos ya rastreados**. La primera
> versión del guardián parecía no funcionar porque se probó contra los WebP del
> hero, que ya estaban commiteados y por eso quedaban fuera del informe.

**Las dos ramas se probaron haciéndolas fallar** (convención 14), no solo
viéndolas pasar: con una regla temporal que ocultaba `hero/*.webp` el build
listó los seis archivos y volvió a 0 avisos al quitarla; la de peso dispara
hoy con los seis retratos reales.

**Al subir un asset nuevo:** déjalo en su carpeta, compila, y **lee la salida
del build**. Si sale en cualquiera de las dos listas, algo hay que corregir
antes de commitear.

> **LEE LA SALIDA ENTERA, no el final.** El guardián corre en
> `astro:build:start`, así que imprime al ARRANCAR: un `tail` del log no lo ve.
> Ya llevó una vez a concluir que la protección contra binarios pesados «no
> existía» —con `fondo-hero.jpeg`, de 2.24 MB, siendo señalado en cada build—
> y de ahí a proponer restaurar el bloqueo por extensión que se acababa de
> retirar a propósito. **Ausencia de señal en un log recortado no es ausencia
> de señal.** Es la convención 14 aplicada a la consola: mirar donde no hay
> que mirar y creerle al hueco.

---

### Pasarela conectada — Payment Link de Stripe

Cierra el pendiente 12. **El sitio ya vende.**

**Qué se hizo**

- `boletos.json`: `checkoutUrl` con el Payment Link. **`priceId` se queda en
  null a propósito** — ese campo solo haría falta para crear una Checkout
  Session por API, y aquí no hay backend.
- `Boletos.astro`: la lógica de los tres estados, que **no existía**.
- El texto bajo el botón pasa a nombrar los métodos reales.
- FAQ «¿Cómo puedo pagar?» actualizada.

> **OJO: la lógica del checkout no estaba escrita, solo comentada.** El
> componente pintaba SIEMPRE el `<button>` con aviso; el bloque «SUSTITUIR
> este bloque cuando exista la pasarela» era un comentario describiendo qué
> hacer, no código condicional. Rellenar `checkoutUrl` en el JSON no habría
> cambiado absolutamente nada en pantalla. Ahora sí: `compraAbierta` se deriva
> de `disponible && checkoutUrl` y de ahí salen los tres estados.
>
> **Lección para los otros «SUSTITUIR cuando…» del repo** (queda el del vídeo
> en `VideoSection.astro`): un comentario que describe el marcado futuro NO es
> una rama que se active sola. Antes de dar por hecho que «el componente ya lo
> lee», comprobar que existe la condición.

**Los tres estados, todos desde `boletos.json`**

| Estado | Condición | Qué se pinta |
| :----- | :-------- | :----------- |
| Compra abierta | `disponible && checkoutUrl` | `<a>` al checkout, en pestaña nueva |
| Venta sin abrir | `disponible && !checkoutUrl` | `<button>` + aviso en región viva |
| Agotado | `!disponible` | `<button disabled>` |

Con la compra abierta desaparece el aviso ENTERO —región, plantilla y respaldo
sin JS—, no se queda vacío ocupando marcado. Verificado sobre el HTML
compilado: 0 ocurrencias de `data-comprar`, `data-aviso` y del texto «la venta
en línea abre muy pronto».

**Decisiones**

- **Los otros cinco CTAs siguen anclando a `#boletos`**, no al checkout: nav de
  escritorio, menú móvil, los dos del hero y el CTA final. El comprador tiene
  que ver qué incluye antes de pagar. Verificado uno por uno.
- **El CTA abre en pestaña nueva** con `rel="noopener noreferrer"` y un
  `.sr-only` que lo anuncia: irse a un dominio de pago sin avisar, y sin dejar
  la página del evento detrás, es peor experiencia.
- **El texto de métodos nombra tarjeta, OXXO y Stripe, y avisa del retraso de
  OXXO** sin alarmar. No se escribió de memoria: se leyó del propio checkout
  (ver abajo).

**Verificado con un clic REAL, no leyendo el código**

Se pulsó el CTA con ratón, se esperó la pestaña nueva y se leyó su contenido:

| | |
| :-- | :-- |
| Pestañas | 1 → 2 |
| URL | `https://buy.stripe.com/fZufZh9GB2vm6DPeTZ5c408` |
| Importe | **699,00 MXN** — coincide con `boletos.json` |
| Métodos ofrecidos | **Tarjeta y OXXO** — coinciden con el texto del sitio |
| ¿Página de error? | No |

Y 0 px de desbordamiento con el CTA como `<a>` en 375/768/1440 × verde/azul.

#### RIESGO ABIERTO — los nombres del checkout NO coinciden con los del sitio

**No es un problema de código y no se puede arreglar desde el repo:** vive en
el panel de Stripe.

| | En el sitio | En el checkout |
| :-- | :---------- | :------------- |
| Comercio | Expo Avícola Productiva 2026 | **Bioorigen** |
| Producto | Acceso general | **1er Congreso Avícola 2026 - Acceso** |
| Qué promete | 7 puntos: conferencias, panel, show, coffee break, stands, networking y constancia con QR | «conferencias magistrales y **talleres**» |

Tres cosas que conviene resolver antes de promocionar:

1. Quien pulsa «Comprar mi boleto» de la **Expo Avícola Productiva** aterriza
   en un cobro de **Bioorigen** por el **1er Congreso Avícola**. Aunque sea la
   misma empresa y el mismo evento, el comprador no tiene forma de saberlo:
   es un patrón clásico de carrito abandonado y de contracargo.
2. La descripción del Payment Link menciona **talleres**, que no aparecen ni en
   `programa.json` ni en la lista de «incluye». Se está prometiendo algo que el
   sitio no vende.
3. La descripción **no menciona** la constancia con QR, el coffee break, el
   show ni los stands, que sí son argumentos de venta en la tarjeta.

#### `boletos.descripcion` — EL ESPEJO DE STRIPE

El boleto estrena `descripcion`, y su razón de ser es doble: alimenta el
`description` del `Offer` en el JSON-LD **y es el texto que hay que copiar a
mano a la descripción del producto en el panel de Stripe.** Junto a él va
`descripcionNota`, que lo dice explícitamente para quien abra el JSON sin
haber leído esto. Ninguno de los dos llega al cliente: `boletos.json` se
importa solo en build (verificado: la nota no aparece ni en el HTML ni en el
JSON-LD).

**Es TEXTO PLANO a propósito, no una plantilla.** Se valoró escribirlo como
`"...en el {recinto}, {ciudad}..."` y resolverlo en build, que es lo que pide
la costumbre del proyecto. **Se descartó porque rompería justo el flujo para
el que existe el campo:** quien lo abra para copiarlo a Stripe se encontraría
marcadores y tendría que compilar el sitio para obtener el texto final.

Lo que sí protege de la desincronización es
`avisaSiLaDescripcionSeDesfasa()` en `schema.js`: en cada build comprueba que
la descripción siga nombrando el `recinto` y la `ciudad` de `site.json`, y
avisa por consola si no. Es aviso y no excepción — reescribir la descripción
sin nombrar la sede es una decisión editorial legítima; lo que no puede es
pasar en silencio.

> **Probado haciéndolo fallar**, no solo viéndolo pasar: se cambió
> `site.recinto` a otro valor, el build escupió el aviso nombrando el recinto
> nuevo, y al restaurar volvió a 0 avisos. Un guardián que nunca se ha visto
> disparar no está verificado (convención 14).

El caso que evita: cambia la sede, alguien actualiza `site.json`, y la
descripción se queda nombrando el salón anterior — texto que acaba en el
JSON-LD y, peor, que alguien copia a Stripe, así que el comprador ve una sede
equivocada justo al pagar.

**PENDIENTE DE FASE FUTURA — no hay webhook ni constancia automática.** Al ser
un Payment Link sin backend, el sitio no se entera de que alguien pagó: no hay
página de gracias propia, ni registro de asistentes, ni emisión de la
«constancia digital con código QR verificable» que promete la tarjeta. Hoy eso
lo cubre Stripe con su correo de confirmación y el organizador a mano. Montar
webhook, lista de asistentes y generación de constancias es una fase aparte.

---

### Sede confirmada — recinto, dirección y mapa real

Cierra los pendientes 1, 2 y 3. **No hizo falta tocar la lógica de ninguna
sección**: `Sede.astro`, el JSON-LD y la ficha ya leían de `site.json`, así que
el estado «Por confirmar» y el aviso de «estamos cerrando el recinto»
desaparecieron solos al dejar de ser null. Verificado sobre el HTML compilado:
0 ocurrencias del aviso y el único «Por confirmar» que queda es el ponente de
la sesión de IA, que es otro pendiente distinto.

**Datos nuevos en `site.json`**

| Clave | Valor |
| :---- | :---- |
| `recinto` | Salón de Eventos Bugambilias |
| `direccion` | López Rayón 3, Centro de la Ciudad, 75700 Tehuacán, Pue. |
| `telefonoRecinto` | +52 238 383 2490 |
| `coordenadas` | `{ lat: 18.462627, lng: -97.391909 }` |

**`telefonoRecinto` va fuera de `contacto` a propósito.** Ese objeto es el
contacto DEL EVENTO (sus tres claves siguen en null); el teléfono del salón es
un dato de la sede. **Y no se muestra en ninguna parte**: publicarlo mandaría a
los asistentes a llamar a un recinto que no puede responder dudas del congreso.
Queda como dato por si hace falta para logística.

**Decisiones**

- **El embed usa `output=embed`, que no pide clave de API.** Es la única vía sin
  dar de alta un proyecto en Google Cloud; a cambio no está documentada como API
  pública. Si algún día deja de responder, el sustituto con soporte oficial es
  Maps Embed API (`/maps/embed/v1/place`), que sí exige clave. El enlace «Cómo
  llegar» sí usa las URLs universales de Maps, esas documentadas.
- **Las dos URLs se derivan de `site.coordenadas`.** Ni el embed ni el enlace
  llevan una coordenada escrita a mano: mover la sede es cambiar dos números.
- **El iframe va en `loading="lazy"` y el alto lo reserva `.mapa__marco` con
  `aspect-ratio`.** Sin esa reserva el hueco valdría 0 hasta que Maps
  respondiera y la página daría un tirón justo al llegar scrolleando. Medido
  recorriendo la página entera: **CLS 0** sin limitar y 0.00007 en 4G —el mismo
  salto de la nav que ya existía—, LCP intacto y **una sola petición a Google,
  y solo después de hacer scroll**.
- **`geo` entra en el JSON-LD.** Permite a un buscador situar el evento sin
  geocodificar la calle, que con una dirección mexicana abreviada («Pue.») no
  siempre acierta. Si `coordenadas` faltara, queda `undefined` y `limpiar()` lo
  poda igual que a los demás nulos.
- **El estado «Por confirmar» NO se borró del código.** Sigue en `Sede.astro`
  como respaldo: es la misma pieza que cubriría un cambio de sede de última
  hora. Mientras el valor exista, no se ve.

#### EL MAPA VA BAJO DEMANDA

El embed de Maps es blanco y era el único rectángulo claro de una página
deliberadamente oscura: se llevaba la atención y se leía como widget
incrustado. Se compararon cuatro salidas y se eligió la cuarta:

| Opción | Qué implicaba |
| :----- | :------------ |
| 1. Tal cual | Cumple los términos de Google al pie de la letra. Desentonaba. |
| 2. `filter: invert + hue-rotate` | Integraba bien, pero invierte también el logo y la atribución de Google — alterar esa presentación choca con sus términos. |
| 3. Atenuar (`grayscale` + `brightness`) | Apenas cambiaba el golpe visual. Seguía siendo alteración. |
| **4. Bajo demanda** ← elegida | Carátula oscura propia con recinto y dirección; Maps solo carga al pulsar. |

**Cómo funciona.** `.mapa__marco` reserva la caja con `aspect-ratio: 4/3` y
trae dentro una carátula con el pin, el recinto, la dirección y la acción. Al
pulsar, el JS crea el iframe, lo mete en el mismo marco en `position:absolute`
y, al confirmar `load`, pone `data-estado="cargado"`: aparece el mapa y la
carátula se oculta con `visibility`. Si una extensión bloqueara Maps, el
`load` no llega, la carátula sigue ahí y el marco no se queda en blanco.

- **Sin JS manda el enlace, no el botón.** `.mapa__accion--js` nace en
  `display:none` y solo `[data-js]` la enciende, apagando a la vez el enlace.
  Un botón que no puede hacer nada es peor que no ofrecerlo — mismo reparto
  que el aviso de Boletos.
- **El foco se lleva al iframe tras cargar.** El botón que lo disparó
  desaparece, así que sin esto el foco caería al `<body>` y quien navega con
  teclado perdería el sitio. El `title` del iframe lo anuncia.
- **`aria-label="Ver mapa de {recinto}"` EMPIEZA por el texto visible** («Ver
  mapa»): el nombre accesible tiene que contener la etiqueta visible
  (WCAG 2.5.3).

> **TRAMPA DE ASTRO, y costó verla.** El iframe lo crea el JS con
> `createElement`, así que **NO lleva el atributo `data-astro-cid-*`** con el
> que Astro acota los estilos del componente: sin `:global()`, ninguna regla
> de `.mapa__iframe` le aplica y el mapa sale como un iframe por defecto
> —`display:inline`, 304×154— dentro de un marco de 504×378.
>
> Lo que hace esto digno de anotarse es cómo se escapó: la comprobación
> numérica daba TODO correcto —`data-estado="cargado"`, 1 iframe en el DOM, 1
> petición a Google, el foco aterrizando en el iframe— y el marco estaba
> vacío. **Lo enseñó la captura.** Cualquier elemento que el JS inyecte en un
> componente de Astro necesita `:global()` en su regla.

**Verificado con clic y con teclado reales:**

| | Antes de pulsar | Después |
| :-- | --: | --: |
| CLS | **0** | **0** |
| Peticiones a Google | **0** | 1 |
| `<iframe>` en el DOM | 0 | 1 |
| Caja del marco | 504×378 | 504×378 |

Recorriendo la página entera antes de pulsar: **cero peticiones a Google**. Con
Tab real, el botón recibe anillo de foco (`:focus-visible`, 2px en `--accent`)
y Enter carga el mapa dejando el foco dentro.

---

### Los dos datos que faltaban — el sitio sale a buscadores

Llegan el nombre de `ponente-04` y la ponencia de `ponente-06`, los dos últimos
huecos del hero. Con ellos **se retira el `noindex` y la home queda publicable**.

**Qué se hizo**

- `hero-ponentes.json`: `04` pasa a «Ing. Ricardo Olmos Rivera» con slug
  definitivo `ricardo-olmos-rivera`, y se borra `slugProvisional`. `06` cambia
  su credencial por su tema real y se borra `temaEsCredencial`.
- `ponentes.json`: ficha completa de Ricardo y, en Esteban, su ponencia y su
  `queSeLleva`. **Cero marcadores `PENDIENTE` en el archivo.**
- `index.astro`: fuera el `noindex`.
- `programa.json`: el bloque de las 13:10 deja de decir «Por confirmar».

**Decisiones**

- **`temaEsCredencial` se borra sin tocar código porque nunca lo hubo.** Era
  una anotación de datos: `grep` por ella en `src/` da cero usos. Servía para
  documentar por qué esa figura enseñaba una credencial donde las demás
  enseñaban un tema, y al llegar el tema dejó de tener sentido.
- **El nombre del ponente de IA se rellenó en `programa.json` aunque el encargo
  solo pedía proponer dónde encaja la sesión de Esteban.** No es reacomodar
  horarios: es el pendiente 11 de esta lista, el título del bloque ya coincidía
  palabra por palabra con la ponencia de Ricardo, y dejarlo habría publicado
  una página donde el hero dice «Ing. Ricardo Olmos Rivera» y la agenda, tres
  secciones más abajo, «Por confirmar» para esa misma sesión.
- **El comentario de `ponentes()` en `schema.js` se corrigió.** Explicaba la
  unión agenda + hero diciendo que Esteban «aparece con su credencial en vez de
  tema porque su ponencia no está asignada». Ya tiene tema; lo que no tiene es
  HORARIO. La unión sigue siendo necesaria por eso, pero por otra razón, y un
  comentario que justifica código con un hecho caducado es peor que ninguno.

**LA AGENDA SIGUE CON 6 SESIONES Y HAY 7 PONENCIAS.** No se tocó ningún horario:
se le pasaron al cliente tres opciones con su coste y decide él. Ver el riesgo
abierto «La séptima ponencia no tiene hueco en la agenda».

**Estado**

`npm run build` y `npm run check`: 0 errores, 0 warnings, 0 hints.

Verificado sobre el **HTML compilado**, no sobre el fuente:

| Comprobación | Resultado |
| :----------- | :-------- |
| «Por confirmar» en `dist/index.html` | **0 ocurrencias** |
| `<figcaption>` del hero | 6, los seis con nombre y tema reales |
| `performer` del JSON-LD | **6**, sin nulos y sin «confirmar» |
| `<meta robots>` en la home | **no existe** |
| `<meta robots>` en `/admin` | `noindex, follow` — intacto |
| `robots.txt` → sitemap declarado | existe en `dist`, y la home está dentro |
| `/admin` en el sitemap | fuera, como debe |
| slug + nombre, hero vs fichas | **coinciden los seis** |
| `slugProvisional` restantes | 0 |

Y en pantalla, con `prefers-reduced-motion` activo, en 360 / 375 / 390 / 430 /
768 / 1024 / 1440 y en los dos temas:

- **0 px de desbordamiento horizontal** en los catorce casos.
- Las dos etiquetas nuevas —Ricardo, el nombre más largo; Esteban, el tema más
  largo con diferencia— **nunca se salen del viewport, nunca se recortan y no
  tocan ninguna silueta**. Holgura mínima a la coronilla ajena: 9 px.
- Barrido de 700 a 1279 px (el tramo de una sola columna, donde la etiqueta se
  pinta encima): **0 choques** con CTAs, cuenta regresiva, tagline o título.
  Margen más ajustado, 107 px.

**Nota de método: un aserto que FALLA tampoco prueba que se vea mal.** El primer
chequeo dio 12 fallas de «la etiqueta pisa a Alejandro» comparando contra
`.figura__marco`, que es el lienzo entero y trae ~38 % de margen transparente.
La etiqueta se pinta en el cielo vacío por encima del conjunto, así que solapaba
el hueco sobre su cabeza y ni una cara. Al medir contra la SILUETA real
—decodificando la alfa del WebP en un canvas— las 12 desaparecen. **Es la
convención 14 en el sentido contrario: el número decía «falla» y la captura
decía «bien», y mandaba la captura.**

Y una segunda, del mismo día: el chequeo contra siluetas eligió la etiqueta con
«la primera cuya opacidad > 0.5» y devolvió cajas IDÉNTICAS para Ricardo y para
Esteban. No podían serlo. Entre 700 y 1279 px el nombre va siempre visible bajo
cada figura, así que la condición casaba con la primera del DOM y no con la que
se había encendido. Seleccionando por nombre, las cajas cuadran con las del
primer script. **Dos medidas que coinciden cuando no deberían son una señal de
que se está midiendo el elemento equivocado** — la misma familia que la
convención 13.

---

### La séptima ponencia y el reparto 4+3

Entra la sesión de Esteban y la agenda pasa de 6 a 7 ponencias **sin mover el
final del día ni la comida**.

**La aritmética que lo hizo posible**

El día está lleno al minuto: 08:00–16:30 son 510 min y los bloques sumaban 510.
Pero `7 × 30 = 210 = 6 × 35`: bajando la ponencia de 35 a 30 min, siete ocupan
exactamente lo que ocupaban seis. **Comida (13:45), panel (14:45), networking
final (15:30) y clausura (16:30) se quedan donde estaban.** Solo se movieron el
coffee (10:45 → 11:00) y el show (11:30 → 11:45).

**Y el recorte no le quita escenario a nadie.** `notaDuracion` decía «30 minutos
de exposición y 5 de preguntas»: los 35 nunca fueron 35 de exposición. Lo que
desaparece son los 5 de preguntas de cada sesión, que el panel de la tarde ya
cubre con los seis ponentes presentes. Es un aviso a los ponentes, no una
renegociación.

**El reparto es 4 + 3, y el orden cambió**

| | Mañana (4 seguidas, 120 min) | Tarde (3 seguidas, 90 min) |
| :- | :-- | :-- |
| | Productividad · Diagnóstico · Mortalidad | Bioseguridad ┐ |
| | **IA (Ricardo)** ← subió de la tarde | Vacunación │ sanidad |
| | | **Detrás de la vacuna** ┘ |

Dos razones, y la segunda pesa más que la primera:

- **El show cae en el medio literal.** Termina a las 12:15, que es el punto medio
  exacto de 08:00–16:30, y tras 4 de 7 ponencias. Con reparto 3+4 caía a las
  11:45 y tras 3 de 7.
- **Ricardo cierra la mañana porque responde lo que las otras tres dejan
  abierto.** Su ficha lo dice: «Los demás ponentes coinciden en que hay que
  medir. Él responde la pregunta que queda flotando después: cómo medirlo».
  Productividad, Diagnóstico y Mortalidad son justamente las tres que dicen «hay
  que medir». En el reparto 3+4 esa respuesta llegaba hora y media más tarde,
  al final del día, cuando ya nadie la conecta.

Se descartó el reparto 4+3 **con el orden anterior** porque partía el trío de
sanidad: Bioseguridad cerraba la mañana y Vacunación abría la tarde, con 75 min
de coffee y show en medio.

**Decisiones**

- **El panel se queda en 45 min y el networking final en 60.** Se propuso pasar
  el panel a 60 quitando 15 al networking, porque las preguntas totales del día
  bajan de 75 min a 45 (6.4 min por ponente). El cliente lo rechazó con dos
  razones que quedan aquí porque no se deducen del código: **el networking final
  es donde los patrocinadores rentabilizan su stand**, y un panel de 7 personas
  después de comer se arrastra más de lo que aporta.
- **El «6» estaba escrito en cinco sitios de cuatro archivos**, ninguno derivado
  de `programa.json`: el lead de `Programa.astro` (que además prometía los 5 min
  de preguntas), el lead de `VideoSection.astro`, la `descripcion` y el
  `incluye[0]` de `boletos.json`, y la respuesta «¿Qué incluye mi boleto?» de
  `faq.json`. **Ese número no se deriva de los datos y volverá a desfasarse.**
  Si algún día se toca esta zona, considerar calcularlo desde
  `programa.bloques.filter(b => b.tipo === 'ponencia').length`.
- **La `descripcion` de `boletos.json` dice ya «7 conferencias» y STRIPE SIGUE
  DICIENDO 6.** Ese texto es espejo de un producto que vive fuera del repo;
  cambiarlo aquí no lo cambia allá. Queda como pendiente 16.

**El JSON-LD no tiene `subEvent`, y nunca lo tuvo**

Al pedir la verificación se dio por hecho que la agenda estaba en el marcado
como 6 `subEvent` que pasarían a 7. **No es así:** `schema.js` emite un único
`Event` con `performer`, `offers` y `location`, y sus únicas horas son
`startDate` y `endDate` (08:00–16:30), que este cambio no toca. No había 6 que
pasaran a 7.

Declarar cada sesión como `subEvent` sería una mejora real —permite a Google
enseñar el detalle por sesión— y ahora que la agenda está completa es el momento
en que tendría sentido. **No se hizo: no estaba en el encargo y añade una
superficie nueva de schema.org.** Si se hace, la fuente es `programa.json`
filtrando `tipo === 'ponencia'`, y cada `subEvent` necesita `startDate`/`endDate`
absolutos, que salen de componer `site.fecha` + la hora del bloque + el desfase
—exactamente lo que ya hace `momento()`.

**Estado**

`npm run build` y `npm run check`: 0 errores, 0 warnings, 0 hints.

- **Parrilla validada por script**: 7 ponencias, cadena sin huecos ni solapes
  entre bloques consecutivos, y cierre en 16:30 exacto.
- **`grep` de «6/seis conferencias» en `src/`, `public/`, `dist/` y el
  README: 0 ocurrencias.**
- **JSON-LD**: `performer` sigue en **6** —Esteban ya está en las dos fuentes y
  la deduplicación funciona—, `startDate`/`endDate` intactos, y
  `offers[0].description` dice ya «7 conferencias».
- **`notaDuracion`** pasa de 63 a 133 caracteres: cae en **4 líneas** a 360/375/
  390 y en **3** a 430, con **0 px** de desborde de caja y **0 px** de desborde
  horizontal en los cuatro. Comprobado en captura que no deja palabra huérfana.
- **La sección de programa creció +119 px** (una fila), de 2150 a 2269 px a
  360 px de ancho: de 2.69 a **2.84 pantallas**. Sigue siendo aceptable —es una
  agenda, se recorre— y el crecimiento es del 5.5%, proporcional a la fila que
  se añadió. No hay efecto de segundo orden: ninguna otra fila cambió de alto.

---

### `subEvent` en el JSON-LD y el conteo derivado de la agenda

Dos cosas de la misma zona: cada conferencia pasa a declararse como `subEvent`, y
el número de conferencias deja de estar escrito a mano.

**Qué se hizo**

- `schema.js`: nueva `sesiones()`, que emite un `Event` por cada bloque
  `tipo === 'ponencia'`. `franjaHoraria()` se generalizó para partir cualquier
  rango («09:00 – 09:30») en vez de solo `site.horario`, y `esPendiente()` subió
  al ámbito del módulo porque ahora la consultan dos sitios.
- `src/scripts/programa.js` (nuevo): `totalConferencias()`, `enPalabra()` y
  `conConteo()`.
- Cuatro textos pasan a derivarse. El quinto, no: ver abajo.

#### `subEvent`

Solo las ponencias. El registro, el coffee, el show, la comida y la clausura NO
son sub-eventos: son logística del mismo evento, y declararlos como `Event`
propios ensuciaría el grafo con cosas a las que nadie asiste por separado.

**Cada sesión repite `location`, y es deliberado.** Un `subEvent` es un `Event`
completo y Google lo valida como tal —name, startDate y location son
obligatorios—, así que heredar la sede del padre no basta: sin `location` cada
sesión saldría con un aviso.

Se dudó por el peso, y se midió antes de decidir:

| | crudo | gzip | brotli |
| :-- | --: | --: | --: |
| JSON-LD con `subEvent` | 6.59 KB | 1.30 KB | 1.09 KB |
| sin `subEvent` | 1.70 KB | 0.86 KB | 0.73 KB |
| **coste** | **4.89 KB** | **0.45 KB** | **0.36 KB** |

Y sobre la página servida entera, que es lo que cuenta: **+0.19 KB gzip, +0.14 KB
brotli.** Los 4.89 KB crudos colapsan a ~140 bytes porque los siete `location`
son idénticos y es justo lo que un compresor hace mejor. **La duplicación que
parecía cara sale gratis.** Decidir por el número crudo habría sido decidir por
un número que nadie descarga.

Una sesión sin ponente confirmado se declara igual —existe y tiene hora— pero
**sin `performer`**: afirmar que actúa alguien llamado «Por confirmar» es peor
que no decir quién actúa. Hoy no se da el caso, pero se dio hace dos commits.

#### El conteo derivado, y el texto que NO se derivó

El número estaba a mano en cinco sitios de cuatro archivos. Cuatro se derivan ya
de `programa.bloques.filter(b => b.tipo === 'ponencia').length`:

| Dónde | Cómo | Forma |
| :---- | :--- | :---- |
| `Programa.astro` | interpolación directa | «siete» |
| `VideoSection.astro` | interpolación directa, capitalizada | «Siete» (abre frase) |
| `faq.json` | marcador `{conferenciasPalabra}` | «siete» |
| `boletos.json` → `incluye[0]` | marcador `{conferencias}` | «7» |

Los `.astro` interpolan y ya. Los JSON no pueden ejecutar código, así que llevan
un marcador que sustituye `conConteo()` al pintar. **Hay dos marcadores porque
los textos no comparten estilo** —la lista de boletos usa cifra y la FAQ usa
letra—; unificarlos sería una decisión editorial, no técnica.

**`boletos.descripcion` SIGUE A MANO, y debe seguir.** Es texto plano a propósito
para que una persona lo copie tal cual a Stripe; con un marcador dentro habría
que compilar el sitio para obtener el texto final, que es exactamente lo que ese
campo existe para evitar. Lo que lo protege es
`avisaSiLaDescripcionSeDesfasa()`, que ya vigilaba el recinto y ahora vigila
también el conteo: si la agenda pasa a 8 y la descripción sigue diciendo 7,
salta en build.

> **El guardián no puede ver Stripe.** Avisa de que `boletos.json` se desfasó de
> la agenda; que la descripción del producto en el panel de Stripe siga diciendo
> otra cosa no lo detecta nadie desde aquí. Es el pendiente 16.

**Estado**

`npm run build` y `npm run check`: 0 errores, 0 warnings, 0 hints.

- **Los 7 `subEvent` cotejados uno a uno contra `programa.json`**: horas, título,
  `performer`, `location` y huso (−06:00) cuadran en los siete. Sin nulos y sin
  «confirmar» en todo el marcado. El `performer` del evento padre sigue en 6.
- **El guardián se probó haciéndolo fallar**, no viéndolo pasar: quitando la
  ponencia de Esteban de la agenda, el build escupe el aviso —«no dice "6
  conferencias", y la agenda tiene 6»— y **los cuatro textos derivados pasan
  solos de «siete» a «seis» y de «7» a «6»**. Restaurado después, verificando
  con `git diff` que lo descartado eran exactamente las 6 líneas de la prueba.
- **Cero marcadores `{…}` sin sustituir** en el HTML compilado.
- 0 px de desbordamiento en los cuatro textos, y comprobado en captura que
  «Siete conferencias» abre frase con mayúscula.

> **Otra vez la cirugía de strings en shell.** El script de verificación se
> escribió con un heredoc y perdió un backslash por el camino: `/\s+/g` acabó
> siendo `/s+/g`, y el informe salió con todas las eses convertidas en espacios
> («conferencias» → «conferencia »). Las MEDIDAS eran correctas; el texto
> mostrado, no. Es la tercera vez que pasa en este proyecto. **Los scripts se
> escriben con Write, no con heredoc ni `node -e`.**

---

### Fase 3 — Ponentes: rejilla y ficha en `<dialog>` · COMPLETADA

La última sección grande. Cierra el ancla muerta `#ponentes` y añade seis
anclas nuevas, `#ponente-{slug}`.

**Qué se hizo**

- `Ponentes.astro`: encabezado, rejilla de seis tarjetas y seis fichas
  completas. Todo sale de `ponentes.json`.
- Los seis retratos, de JPEG 1792×2400 (12.99 MB) a **WebP 800×960 (243 KB)**,
  con el reencuadre horneado. Los originales salieron a la carpeta hermana.
- `Hero.astro`: cada figura pasa a ser `<a href="#ponente-{slug}">` y pierde su
  `tabindex="0"`.

#### LA FICHA COMPLETA NO VIVE EN EL MODAL

Cada ficha se emite como un **`<dialog>` con el atributo `open`**. Un
`<dialog open>` no es modal: se pinta como un bloque en el flujo. Sin
JavaScript la página enseña la rejilla y debajo las seis fichas completas, y
`#ponente-{slug}` es un ancla a un elemento que existe de verdad. Con
JavaScript el script los cierra al arrancar y a partir de ahí usa
`showModal()`.

> **EL MODAL SE ABRE IN SITU Y NO MUEVE EL SCROLL.** Lo de arriba sigue siendo
> cierto, pero el comportamiento al pulsar cambió: ver «El modal se abría
> llevándose al usuario» al final de la bitácora.

**`showModal()` da gratis lo que costaría cientos de líneas:** foco atrapado,
Escape, `aria-modal`, resto de la página inerte, capa superior por encima de
cualquier `z-index`, y **el foco de vuelta al elemento que lo abrió**. No se
reimplementó nada de eso.

> **`display: block` SOLO con `[open]`.** El navegador trae
> `dialog:not([open]) { display: none }`, pero es una regla de ELEMENTO y
> `.ficha` es de CLASE: la clase gana. Con `.ficha { display: block }` las seis
> fichas cerradas seguían ocupando **1669 px cada una** por detrás del modal.
> No se veía, porque el modal se pinta encima.

#### EL FONDO BLANCO DE LOS RETRATOS

Venían de estudio sobre blanco, y el sitio es oscuro. Puestos tal cual serían
seis rectángulos blancos pegados sobre el fondo.

**Se quitó el BORDE DURO, no el blanco:** un degradado de transparente a
`var(--surface)` sobre el 55% inferior de la foto. El retrato se disuelve en la
tarjeta y el nombre emerge de esa disolución, así que no hay ninguna línea
donde acabe la foto y empiece el fondo. Usa el token, no un color fijo, así que
sigue al tema activo sin una regla extra.

#### LOS RETRATOS NO CUMPLÍAN, Y EL ARREGLO OBVIO EMPEORABA

La regla del hero pide que las coronillas coincidan dentro del 1–2%. Medido:
**3.83% a 9.00%, dispersión 5.17 puntos.** Y peor, el tamaño de cara variaba
28% en relativo: Ricardo se leía lejano junto a José Ángel.

Se probó alinear coronillas y **quedó peor**: Alejandro lleva sombrero, así que
su «coronilla» es el ala y al alinearla su cara se hunde. **La coronilla es
mala referencia para este conjunto.**

La solución fue normalizar por **CARA**: cada retrato se escala para que su
cara ocupe el 53% del alto de salida, con el centro al 31%. Zooms x1.01–x1.34,
todos ≥1 —acercarse siempre cubre; alejarse dejaba hueco, que fue el primer
intento fallido—. Va horneado en el WebP: coste cero en runtime, y de paso
recorta fondo blanco.

> **Método:** la cara se localiza por TONO DE PIEL, no por silueta. Se
> intentaron tres detectores de «altura de cabeza» por línea de hombros y los
> tres dieron respuestas incompatibles —uno daba 10% para Alejandro, imposible—
> porque el pelo, el sombrero y el cuello contaminan cada foto distinto.
> **Cuando tres métodos discrepan, el número no es evidencia: hay que mirar.**
> La decisión se tomó sobre una hoja de contacto de antes/después.
>
> El 31% de centro sale de Alejandro: es quien tiene la cara más grande de
> origen y con 36% su recorte pedía 94 px por encima del borde. A 31% los seis
> caben enteros y nadie se pega a ningún borde.

#### CALIDAD POR IMAGEN, otra vez por la camisa a cuadros

A calidad 90 los seis sumaban **368 KB**, fuera del presupuesto de 250. El
culpable, el mismo que en el hero: Alejandro, **109 KB él solo**, con **2.78×
la energía de alta frecuencia** de la mediana.

Bajar los seis por igual castigaría a los cinco que no tienen el problema. Se
midió la curva peso/calidad de cada uno y se asignó la más alta que cupiera:

| id | calidad | KB | por qué |
| :- | ------: | -: | :------ |
| 01 | 84 | 37.6 | |
| 02 | 76 | 56.2 | hf ×2.78, camisa a cuadros |
| 03 | 84 | 39.4 | |
| 04 | 90 | 34.8 | hf ×0.53, traje liso |
| 05 | 80 | 33.1 | |
| 06 | 88 | 42.1 | |

**Total 243.2 KB.** Comprobado en captura a 2.4× que la camisa de Alejandro
—que es lo que la compresión castiga— sale limpia a 76.

**Ancho de origen: 800 px, medido y no supuesto.** El render máximo del retrato
en la rejilla es **385 px** (a 430 px de ancho, una columna), así que DPR2 pide
770.

**Dos fallos que pasaron TODAS las comprobaciones**

Los dos se vieron mirando la captura, con quince asertos en verde:

1. **El modal salía roto.** `.ficha__retrato` medía 152×960 en vez de 152×182:
   el `<img>` lleva `width`/`height` para evitar CLS, esos atributos actúan
   como CSS presentacional, y con las dos dimensiones ya fijadas
   **`aspect-ratio` no tiene nada que calcular y se ignora en silencio**. El
   retrato estiraba la cabecera a 960 px y empujaba los seis bloques de la
   ficha fuera del área visible. En pantalla: un primerísimo plano y medio
   modal vacío. Se arregla con **`block-size: auto`**.
2. **Los modales se APILABAN.** Pedir otra ficha con una abierta ponía la
   segunda encima en vez de cambiar: `showModal()` apila. Pasa al pulsar una
   figura del hero con una ficha abierta y al llegar a otro `#ponente-slug` por
   `hashchange`. Se detectó porque **se pidió la ficha de Edgar y la captura
   mostró la de Esteban.** Ningún aserto lo vio porque cada prueba navegaba en
   limpio. `abrir()` cierra ahora cualquier otra antes de abrir.

**Y uno más, del mismo día: `.ficha` ya existía en `Sede.astro`.** El CSS estaba
a salvo porque Astro lo acota, pero **el script del cliente NO está acotado**:
`querySelectorAll('.ficha')` se tragaba el `<dl>` del recinto y `close()`
—que no existe en un `<dl>`— lanzaba TypeError en el nivel superior del módulo,
dejando el modal entero muerto. De ahí el `[data-ficha]`.

#### LOS TRES BUGS QUE SOLO EXISTÍAN SIN JAVASCRIPT

Los dos anteriores se cazaron mirando capturas. **Estos tres eran invisibles
desde donde se estaba mirando**, porque las 17 comprobaciones del modal corrían
con JavaScript y estos fallos viven en el otro modo. Los encontró una revisión
en paralelo a la que se le pidió explícitamente medir sin JS.

**Una sola causa raíz para los tres: la hoja del navegador da
`position: absolute` a TODO `<dialog>`.** Con `showModal()` da igual, porque
entonces pasa a `fixed` y a la capa superior — por eso el modo con JS estaba
impecable. Pero con el atributo `open` en el flujo, ese `absolute` se resuelve
contra el bloque contenedor inicial, porque ni `.fichas` ni `.ponentes` ni
`body` están posicionados.

| # | Qué se veía sin JS | Medido |
| - | :----------------- | :----- |
| 1 | Las **seis fichas apiladas en la misma coordenada**; solo se veía la última, Esteban | Seis con `top` idéntico; cinco con el **0.0%** de su superficie visible |
| 2 | Las fichas **encima de Pilares y Programa**, texto sobre texto | `.fichas` medía **0 px** frente a los **5328** que suman las seis; 574 px de solape con Pilares |
| 3 | La ficha **sangrando a ancho completo**, sin gutter | 1440 px de ancho con contenedor de 1200 |

Se arreglan con **`position: static` en `.ficha[open]`**, y los tres a la vez.

> El verificador montó un experimento de control con dos `<dialog open>` limpios
> creados a mano en el mismo Chrome: se apilan igual aun con `display: block`, y
> al añadir `position: static` se separan. Así que la causa está confirmada
> contra el comportamiento del navegador, no inferida del síntoma.

Verificado tras el arreglo, con JavaScript desactivado por CDP: `position`
static, **las seis en coordenadas distintas**, contenedor de 6178 px, ninguna
sangra fuera de los 1200, ninguna invade `#pilares`, las seis con sus seis
bloques, y el botón de cerrar oculto —no significa nada si no hay modal—.

#### EL CONTRASTE QUE FALLABA EN EL TRAMO QUE NADIE MUESTREÓ

La misma revisión encontró que `.tarjeta__credencial` caía a **4.18:1 en tema
azul alrededor de los 540 px de viewport**, por debajo del 4.5 de AA, con los
retratos que ya están en el repo. El tramo 460–543 px no lo había muestreado
nadie: ni las medidas propias ni las del primer agente, que saltaban de 390 a
1440.

La causa: el degradado terminaba en el **100%** de la foto, y el texto de la
tarjeta sube sobre ella por el margen negativo de `.tarjeta__cuerpo`. Justo
donde cae la credencial —que va en `--text-muted`, el color más tenue— todavía
se filtraba blanco del retrato, **así que el contraste dependía de qué foto
hubiera detrás**.

Cerrando el degradado en el **86%**, ese tramo es `--surface` plano. Medido por
muestreo de píxel real (texto en `color: transparent`, captura, y lectura del
fondo) en 11 anchos × 2 temas: **6.66:1 en azul y 7.76:1 en verde, idénticos en
todos los anchos** — y esa identidad es la prueba de que el fondo ya no depende
de la foto. El peor par del conjunto queda en 6.66:1.

#### RENDIMIENTO

Medido en 4G lento (150 ms, 1.6 Mbps), 7 pasadas por viewport, mediana:

| | 1440×900 | 390×844 |
| :-- | --: | --: |
| LCP | 3016 ms | 3000 ms |
| Elemento LCP | `IMG.figura__img` **7/7** | `IMG.figura__img` **7/7** |
| CLS | 0.00083 | 0.01423 |
| Retratos cargados SIN hacer scroll | **0** | **0** |

**La sección es neutra en la carga inicial.** El LCP sigue siendo una figura del
hero en las 14 pasadas —ningún retrato entra en la cadena de candidatos— y el
`loading="lazy"` funciona: cero de los seis se piden sin bajar hasta ellos.

El CLS de móvil se atribuyó en una pasada: **un único desplazamiento a 2811 ms
con fuentes `DIV.hero__media`, `DIV.countdown`, `DIV.hero__ctas` y un nodo de
texto — todo del HERO, cero elementos de Ponentes.** Es el reflow al entrar la
fuente display, ya identificado y descartado en su momento porque reservarle
alto fijo sería apostar por un largo de nombre que cambia. Contra el 0.00939 de
móvil de la revisión anterior, el delta real es de 0.005, y sigue 7× por debajo
del umbral de «bueno».

> **CAVEAT DE MÉTODO, y hay que declararlo siempre con estas cifras:** el
> servidor local NO comprime, ni pidiéndoselo. En producción GitHub Pages sirve
> gzip: el documento pasa de 93.3 a 15.0 KB y el conjunto JS+CSS de ~200 a
> ~66 KB. **Estos ms sirven para comparar contra otra medida hecha igual, no
> como cifra de producción.** Quien compare estos números contra una medida
> futura hecha sobre el dominio real va a ver una mejora que no existe.

> **Trampa de Astro, variante nueva.** Ya estaba documentado que un `{/* */}`
> entre los atributos de una etiqueta rompe `astro check`. Aquí apareció otra:
> un `{/* */}` dentro del cuerpo con paréntesis de un `.map()` son DOS
> expresiones y **el compilador lo rechaza con `Expected , or ) but found
> class`**, que no dice nada de comentarios. Los comentarios de un `.map()` van
> fuera del `.map()`.

**Estado**

`npm run build` y `npm run check`: 0 errores, 0 warnings, 0 hints.

Modal verificado con interacción real (ratón y teclado), 17 comprobaciones en
verde: se abre como `:modal`, escribe el hash, el foco entra, 14 tabulaciones
sin alcanzar nada interactivo de fuera, Escape cierra, el foco vuelve al enlace
que abrió, el hash se limpia, llegar con `#hash` lo abre solo, las seis figuras
del hero son enlaces y abren su ficha, el clic en el fondo cierra, y cambiar de
ficha no apila.

> *Nota metodológica:* el aserto de foco atrapado falló al principio con «4 de
> 14 tabulaciones salen». El recorrido era `BODY → ficha → cerrar → …`: el foco
> **nunca alcanzaba un elemento interactivo de fuera**, y `<body>` es el punto
> de vuelta del ciclo, no una fuga. Se corrigió el TEST, no el producto.

---

### Imagen del hero — entregada y optimizada · SUPERADA POR LA FASE 2b

> Esta sección documenta la imagen GRUPAL, que ya no se sirve. Se conserva
> porque el método de conversión y la política de originales fuera del repo
> siguen vigentes. Para el hero actual, ver la Fase 2b.

El cliente entregó `ponentes.png`: foto grupal de los seis ponentes, recortada
sobre fondo transparente. **2752×1536 px y 4.79 MB.**

**Auditoría del original**

- Alfa **real**, no un fondo blanco horneado: 40.6% de píxeles transparentes,
  las cuatro esquinas a `(0,0,0,0)`. Verificado también en el navegador contra
  el halo, en los dos temas.
- Recorte **limpio**: sobre los 20 664 píxeles del anillo de alfa parcial, solo
  un 3.4% queda casi blanco y el histograma está repartido. A 3× de zoom no se
  ve fleco. (Una primera medición sugirió un 34% de borde claro: era un
  artefacto del muestreo, que tomaba el primer píxel de cada fila y caía
  sistemáticamente en camisas blancas.)
- Sin metadatos que inflen (21 B) y **ya óptimamente comprimida como PNG**:
  re-codificarla sin pérdida daba exactamente el mismo tamaño.
- El problema no era la imagen, era el formato: **1.19 bytes por píxel**, que es
  lo que pasa al guardar una fotografía en PNG.

**Lo que se hizo**

| | Antes | Después |
| :-- | --: | --: |
| Archivo | `ponentes.png` | `ponentes.webp` |
| Dimensiones | 2752×1536 | **1400×781** |
| Peso | 4 904 KB | **125 KB** (−97.4%) |
| Primera carga | 5 060 KB | **282 KB** |
| Descarga en 4G lento | 25.7 s | **1.5 s** |
| LCP (sin limitar) | 320 ms | 320 ms |
| CLS | 0 | **0** |

- **WebP a 1400 px, calidad 90, sin respaldo PNG.** 1400 px cubre DPR2 en el
  breakpoint más exigente (el render más ancho son 681 px, en 768 px de
  viewport). WebP con alfa lo soportan todos los navegadores desde 2020.
- **`.hero__frame` pasó de 4/3 a 16/9.** Con 4/3 el marco reservaba entre 32 y
  65 px de alto que la imagen nunca ocupaba. Ahora el desajuste es de 0.8–1.6 px.
  Esto **no agranda la imagen** —el `contain` está limitado por el ancho en los
  tres breakpoints—, solo elimina alto muerto.
- **Desvanecido inferior con `mask-image`.** Los ponentes están recortados a
  media altura del torso y ese corte recto, flotando sobre el halo, se leía como
  un tajo. El degradado ocupa el último 12%. Va en el `<img>` y no en el marco,
  para que el placeholder punteado —que es hermano, no hijo— siga intacto cuando
  la imagen no carga. Verificado bloqueando la petición: `data-state=failed`,
  placeholder visible y con `mask-image: none`.

**EL ORIGINAL NO ESTÁ EN EL REPO.** Un binario de 4.79 MB commiteado se queda en
el historial para siempre, aunque después se borre: cada `git clone` lo sigue
descargando. El original vive en:

```text
C:\dev\expo-avicola-2026-assets-originales\ponentes.png
```

Es una carpeta hermana del repo, **fuera de control de versiones**. Guárdala
aparte (copia de seguridad o almacenamiento del cliente): es la única fuente si
algún día hay que regenerar la imagen a otro tamaño.

> **ESTE CRITERIO YA NO RIGE — SE CAMBIÓ A PROPÓSITO EN LA MIGRACIÓN A DOMINIO
> PROPIO. No lo restaures.** Lo que sigue describe cómo se hacía en la Fase 2b
> y se conserva solo por el registro.
>
> En su momento, `.gitignore` bloqueaba
> `public/img/**/*.{png,jpg,jpeg,tif,tiff,psd}` para que no volviera a colarse
> un original sin optimizar.
>
> **Por qué se retiró:** la extensión no distingue el ROL. Un `.png` puede ser
> un original de 4.79 MB o el logo final de un patrocinador, así que la regla
> escondía las dos cosas —y en silencio—. Así fue como seis retratos de
> ponentes quedaron invisibles para git: se veían en local y faltaban en
> producción, porque el runner compila solo lo commiteado.
>
> **Qué rige hoy:** `.gitignore` bloquea solo los formatos que NUNCA se sirven
> en una web (`.psd`, `.tif`, `.tiff`, `.ai`, `.xcf`), donde no caben falsos
> positivos. **La protección contra el binario pesado no desapareció: cambió
> de bloqueo silencioso a AVISO RUIDOSO.** La ejerce el guardián de assets de
> `astro.config.mjs`, que en cada build señala por nombre y peso cualquier
> archivo de `public/img/` que pase de 400 KB. Ver «La trampa del `.gitignore`»
> en la migración a dominio propio, que es donde está el criterio completo.
>
> **Si concluyes que falta protección, mira la salida ENTERA del build.** El
> guardián imprime al ARRANCAR, no al cerrar: un `tail` del log no lo ve y
> parece que no existe. Ya pasó una vez.

> **Cómo regenerar el WebP si hace falta:** no hay herramienta de imagen en el
> proyecto ni se añadió ninguna dependencia. La conversión se hizo conduciendo
> Chrome headless por CDP y volcando `canvas.toDataURL('image/webp', 0.90)` a
> disco. Si mañana hace falta otro tamaño, o se repite ese método, o se usa
> `astro:assets` moviendo el original a `src/assets/` (que además generaría el
> `srcset` responsive solo).

---

### Superficies claras — claro donde se lee, oscuro donde se decide · COMPLETADA

El sitio era oscuro de arriba a abajo y se leía monótono. Cuatro secciones
pasan a superficie clara: **Programa, ¿Para quién?, Patrocinadores y FAQ**.
Siguen oscuras hero, Ponentes, Pilares, Sede, Boletos, CTA final y pie.

**Qué se hizo**

- `tokens.css`: paleta clara completa por tema (`--claro-*`) y **`--oscuro-bg`**,
  el fondo oscuro accesible desde DENTRO de una sección clara.
- `global.css`, sección 5: el mecanismo entero —remapeo, bandas de frontera y
  supresión entre claras seguidas.
- `index.astro`: qué secciones son claras y dónde están sus fronteras.
- `Nav.astro`: la barra pasa a `--oscuro-bg` al 94%.
- Los cuatro componentes reciben `{...Astro.props}` en su `<section>`.

**El mecanismo**

Los componentes no se tocaron: ya consumían `--text`, `--surface`, `--border` y
`--accent`, así que `[data-superficie='clara']` remapea esas variables dentro
del ámbito y **todo se invierte solo** — incluidos el carril y los puntos del
timeline, los divisores del FAQ y los marcadores de `<summary>`, que salen de
`var(--border)` y `var(--accent)` sin una línea de CSS nueva.

**Decisiones**

- **`--accent` NO puede ser el lima/cian sobre claro.** Dan 1.24:1 y 1.53:1 y
  se usan como color de TEXTO (eyebrows, horas del programa, ponentes). Se
  remapean al `--primary` profundo de cada tema: misma identidad, y medidos
  dan 6.24:1 (verde) y 6.35:1 (azul).
- **`color: var(--text)` en el bloque del remapeo es OBLIGATORIO.** Es la
  convención 16; sin esa línea los `<h2>` salen invisibles.
- **La nav se queda oscura siempre**: es la barra del SITIO, no la de la
  sección. Con alfa 0.82 sobre claro computaba `#2f322e`, un panel gris sucio.
  A **0.94** sobre oscuro el cambio es imperceptible y sobre claro queda negra
  y nítida. Usa `--oscuro-bg`, no `--bg`, para no depender de dónde esté.
- ~~**Las bandas no añaden altura.**~~ · **LAS BANDAS SE RETIRARON.** Ver
  «Fronteras a corte seco» al final de la bitácora. Lo que sigue describe el
  mecanismo que hubo, no el que hay: hoy el paso de oscuro a claro es un corte
  limpio, sin degradado y sin `data-borde`.
- ~~**Las fronteras van EXPLÍCITAS con `data-borde`, no con `:has()`.**~~ El
  atributo existía solo para decidir qué banda pintaba cada sección; sin bandas
  no decidía nada y se retiró en vez de quedarse como marcado muerto.
- **Sombras invertidas**: negro al 40-55% sobre claro se ve sucio. Las tres
  (`sm`, `md`, `lg`) pasan a tintes del propio color de texto a baja alfa.
- **`color-scheme: light`** dentro de las claras, para que scrollbars y
  controles nativos no desentonen.

**Estado — verificado sobre el sitio REAL COMPILADO, no sobre la maqueta**

`npm run build` y `npm run check`: 0 errores, 0 warnings, 0 hints.

| Comprobación | Resultado |
| :----------- | :-------- |
| Contraste, 26 pares, ambos temas | todo **AA**; peor par **5.31:1** (atenuado sobre recuadro hundido), idéntico en verde y azul |
| Eyebrows y ponentes (`--accent` como texto) | 6.24:1 verde · 6.35:1 azul |
| Títulos `<h2>` | 13.87:1 verde · 15.37:1 azul |
| Altura de scroll vs build anterior | **0 px** en 390 y 1440, ambos temas |
| Desborde horizontal | 0 px en 320 / 390 / 768 / 1440 |
| Fondo computado de la nav | alfa 0.94 en los dos temas |

Mirado en captura (convención 14), no solo medido: las **4 fronteras a 390 y
1440 en ambos temas**, la unión entre las dos claras seguidas —sin banda oscura,
que era el riesgo del `:has()`—, la nav sobre sección clara, el timeline, el FAQ
abierto y Boletos.

> **El carril del timeline era la duda**: sale de `--border` y sobre claro podía
> desaparecer o volverse una línea dura. Con `--claro-border` a alfa 0.14 queda
> **suave y presente**, ni tajo ni ausencia, y los puntos de conferencia
> —rellenos de `--accent`— son lo que más resalta de la columna. Los de pausa
> quedan huecos y discretos, que es la jerarquía que ya tenían en oscuro.

> **Boletos queda entre dos claras y NO se lee como un hueco.** Al contrario:
> saliendo del claro, el lima del CTA y el filo de acento de la tarjeta ganan
> fuerza. Sigue siendo el punto de conversión de la página.

---

### La barra de compra fija · COMPLETADA

Recuperada del diseño que quedó aparcado en la revisión de móvil, sin
reinventarlo: `IntersectionObserver` sobre hero y Boletos, `visualViewport`
para el teclado, hueco reservado en el `body` y `env(safe-area-inset-bottom)`.
Componente nuevo `BarraCompra.astro`, fuera de `<main>`, junto al pie.

**Por qué ahora sí.** Se aparcó porque competía con el CTA del hero durante
todo el scroll. Eso lo resuelve el propio observer: la barra no existe hasta
que el hero sale de vista, así que los dos CTAs no coinciden nunca. El sitio
cobra $699 reales y el canal de difusión es WhatsApp, así que el tráfico llega
en celular y esta barra es el CTA que acompaña el scroll entero.

**Decisiones**

- **Precio y URL salen de `boletos.json`**, el mismo sitio que la tarjeta. No
  hay un segundo lugar que actualizar. Comparte también la condición
  `disponible && checkoutUrl`: sin pasarela la barra no se pinta, porque un
  botón que no compra ocupando el borde inferior de cada pantalla es peor que
  nada.
- **El texto es «Comprar mi boleto»**, el mismo de la tarjeta. Una tercera
  palabra para la misma acción —«reservar», «entrada»— confunde.
- **El precio va en la barra** porque hace dos cosas: quita la fricción de
  «¿cuánto era?» y evita que se lea como banner publicitario.
- **`IntersectionObserver`, nunca un listener de scroll.** El scroll lo conduce
  Lenis; engancharse ahí sería correr en cada frame del scroll suave. El
  observer no consulta nada, lo avisa el navegador. Y no importa GSAP ni Lenis:
  si el chunk de animación no llega, la barra sigue funcionando.
- **Estado inicial explícito en el `Map`.** Se arranca dentro del hero. Dejarlo
  a que lo dedujera el primer callback daba un fotograma con el estado
  equivocado en un deep-link con hash a mitad de página.
- **`visibility`, no solo `transform`.** Saca la barra del orden de tabulación
  y del árbol de accesibilidad mientras está fuera: si solo se desplazara, se
  podría enfocar a ciegas un botón invisible. Su transición lleva retardo para
  que desaparezca DESPUÉS de terminar de bajar.
- **El hueco del `body` es CONSTANTE**, no solo cuando la barra se ve. Si
  apareciera y desapareciera con ella, cada entrada movería el documento. Como
  está desde el primer pintado, no puede generar un salto de layout.
- **Alfa 94%, la misma que la nav y por la misma razón medida.** La barra flota
  sobre contenido que cambia de superficie al hacer scroll. `--surface`
  resuelve siempre al oscuro —la barra vive fuera de `<main>`, así que ningún
  `[data-superficie='clara']` la alcanza—, pero el 6% translúcido más el
  desenfoque dejan subir el claro de debajo.
- **El bloque visual del precio va entero en `aria-hidden` y la lectura la da
  el `sr-only`.** Sin eso el lector recita los trozos y luego la frase completa.

> **PENDIENTE HEREDADO · CERRADO.** La tarjeta de Boletos tenía esa misma
> duplicación: su `sr-only` se añadió sin ocultar `.precio__valor` ni
> `.precio__moneda`, así que un lector anunciaba «699 MXN 699 pesos MXN». Se
> cerró aplicando el criterio de la barra —el bloque visual entero fuera del
> árbol de accesibilidad— con `aria-hidden="true"` en los dos tramos que
> faltaban. `.precio__simbolo` ya lo llevaba. Verificado sobre el HTML
> COMPILADO, no sobre el fuente: los dos `<span>` salen con el atributo en
> `dist/index.html`.

**Estado — medido y mirado**

| Comprobación | Resultado |
| :----------- | :-------- |
| Aparece / desaparece | oculta en el hero, visible en Programa y FAQ, **oculta en Boletos**, visible al final |
| Parpadeo al entrar en Boletos | **una sola transición**, sin oscilación |
| Área de toque del botón | **173×44 px** reales en 360, 390 y 430 |
| Escritorio (768 / 1024 / 1440) | `display: none` |
| Sin JavaScript | `data-js` ausente → `display: none`, también al final del scroll |
| El pie no queda tapado | **−23 px** de solape (holgura) en 360, 390 y 430 |

**Color compuesto de la barra, leído del PÍXEL del render** (no del
`getComputedStyle`, que solo devuelve el `color-mix` declarado y no lo que se
ve tras el desenfoque):

| Tema | Sobre oscura | Sobre clara |
| :--- | :----------- | :---------- |
| Verde | `#1e2520` | `#2b312c` |
| Azul | `#1c2942` | `#29354e` |

Sobre claro sube, pero **se mantiene como barra oscura y nítida**: confirmado
en captura a 360, 390 y 430 en ambos temas, sobre sección oscura y sobre
sección clara. No reaparece el «panel gris sucio» de la nav.

> **NOTA PARA EL FUTURO — el botón de WhatsApp.** Si algún día se añade, va
> DENTRO de esta barra, como icono a la izquierda del precio. **No flotando
> aparte.** Dos elementos peleándose la esquina inferior derecha es peor que
> ninguno de los dos: se tapan entre sí, y en un teléfono esa esquina es justo
> donde cae el pulgar.

#### RENDIMIENTO — medido, y con una advertencia sobre con qué se compara

390×844, 4G lento (150 ms, 1.6 Mbps), 7 pasadas, mediana, **con
`prefers-reduced-motion` activo**. La huella SHA de `dist/` se tomó antes y
después de la corrida y **salió idéntica**: la medida no está contaminada.

| | Baseline (Fase 3) | Ahora | |
| :-- | --: | --: | :-- |
| LCP | 3000 ms | **1984 ms** | comparable en elemento, NO en condiciones |
| Elemento LCP | `IMG.figura__img` 7/7 | `IMG.figura__img` **7/7** | mismo elemento, área 35 996 px² |
| CLS | 0.01423 | **0.00000** | |

**La barra no mete ni un desplazamiento.** CLS 0.00000 en las 14 pasadas —los
dos modos de movimiento— y también en una pasada con recorrido completo en la
que la barra ENTRA y SALE de vista, con la lista de turnos de `layout-shift`
literalmente vacía. Es lo que buscaba el diseño: el hueco del `body` es
constante desde el primer pintado y la barra es `position: fixed` movida por
`transform`, así que no hay nada que pueda empujar al documento.

> **EL DELTA DE LCP NO ES MÉRITO DE LA BARRA, Y HAY QUE DECIRLO.** Una barra
> fija no puede mejorar el LCP: no toca la cadena crítica. Los 1016 ms de
> diferencia contra el baseline se reparten así, y solo el primer tramo está
> aislado de verdad:
>
> - **~492 ms son `prefers-reduced-motion`.** Se aisló midiendo EL MISMO
>   `dist/` sin él: 2476 ms de mediana, mismo elemento LCP, 7/7. Es la variable
>   que el enunciado de la sesión mandaba fijar, y sola explica la mitad.
> - **El resto (~492 ms) queda SIN ATRIBUIR.** El baseline es de la Fase 3 y
>   entre medias entraron las Fases 4, 5, 6 y 7 y las superficies claras, sin
>   que ninguna dejara una medición de 4G en la bitácora. Además el baseline no
>   declara en qué modo de movimiento se tomó.
>
> Así que lo que se puede afirmar es: **el elemento LCP no cambió** (convención
> 13 satisfecha, 14/14 pasadas) y **la barra es neutra en carga y cero en CLS**.
> Lo que NO se puede afirmar es que la página haya mejorado 1016 ms por esta
> fase. Quien quiera esa cifra tiene que remedir el baseline en las mismas
> condiciones.

> **CAVEAT DE MÉTODO, el de siempre:** el servidor local NO comprime. Estos ms
> solo valen contra otra medida hecha igual, nunca contra el dominio real.


---

### Fronteras a corte seco — fuera las bandas de degradado · COMPLETADA

Las franjas que fundían `--oscuro-bg` hacia `--claro-bg` en cada frontera se
eliminaron. **El paso de oscuro a claro es ahora un corte limpio.**

**Qué se quitó**

- Los dos pseudo-elementos `[data-superficie='clara']::before` y `::after`.
- El `clamp(72px, 11vh, 104px)` que les daba altura, y la variable `--banda`.
- La regla `[data-superficie='clara'] > *` con `z-index: 1`, que solo existía
  para levantar el contenido por encima de las bandas.
- El atributo `data-borde` de `index.astro` y su regla de supresión.

`--oscuro-bg` **NO se tocó**: lo sigue usando la nav, que es la barra del sitio
y tiene que quedarse oscura sobre sección clara.

**Verificado — las 4 fronteras × 2 anchos × 2 temas = 16 comprobaciones**

Dos evidencias por frontera, porque el número solo no basta (convención 14):

| Frontera | 390 | 1440 |
| :------- | :-- | :--- |
| Pilares → Programa | corte seco | corte seco |
| ¿Para quién? → Boletos | corte seco | corte seco |
| Sede → Patrocinadores | corte seco | corte seco |
| FAQ → CTA final | corte seco | corte seco |

El muestreo lee una columna de píxeles de 240 px a caballo de la frontera y
saca su codificación por bloques. Sale **un bloque plano de 240 px, un salto de
UN píxel, y otro bloque plano de 240 px**. Un degradado de 72–104 px habría
dado decenas de colores intermedios.

> **EL PRIMER VEREDICTO FUE UN FALSO POSITIVO, y conviene saber por qué.** El
> criterio inicial contaba TRANSICIONES de color, y a 390 px daba 3–4 por
> frontera: «rampa». No lo era. El gutter a 390 es de 20 px y la sonda estaba
> a x=8, así que rozaba bordes de tarjeta de 2 px. **Lo que distingue un corte
> de una rampa no es cuántas veces cambia el color, sino CUÁNTOS COLORES
> DISTINTOS hay**: 2–5 discretos es un corte con bordes; decenas es un
> degradado. Con el criterio corregido, las 16 dan corte seco.

Y mirado en captura, no solo medido: el corte se lee limpio en las dos
direcciones (entrando al claro y saliendo de él).

---

### Fondo del hero — fotografía bajo velo, solo escritorio · COMPLETADA

`fondo-hero.jpeg` (2752×1536, 2.24 MB) entra como fondo del hero.

**Qué se hizo**

- Dos WebP: `fondo-hero-1920.webp` (24.2 KB) y `fondo-hero-1280.webp`
  (12.8 KB). **37.0 KB los dos**, contra un presupuesto de 40.
- `Hero.astro`: dos capas nuevas en `::before` (imagen enmascarada) y
  `::after` (velo), ambas dentro de `@media (min-width: 48rem)`.
- El JPEG original salió a `../expo-avicola-2026-assets-originales/` y el
  guardián del build dejó de avisar (comprobado leyendo la CABECERA del log,
  que es donde imprime).

**Decisiones**

- **Calidad 0.85, no 0.90 ni 0.80.** Barrido medido: a 0.90 el de 1920 solo ya
  pesa 47.9 KB y se sale del presupuesto; a 0.85 el par entra en 37.0 KB. La
  foto es de por sí suave y oscura —un crepúsculo desenfocado con una silueta
  de granja al horizonte—, así que comprime bien y no se ensucia.
- **`background-image` de CSS y NO un `<img>`.** Así degrada solo: si el
  archivo falta, se ve el `--bg` de siempre en vez de un icono de imagen rota.
  Mismo criterio que el halo.
- **Solo ≥768px, y dentro de la media query.** Un fondo declarado fuera y
  anulado dentro SÍ se descarga. Declarado dentro de una consulta que no casa,
  no. Comprobado: a 390 px hay **0 peticiones y 0 bytes** de fondo.
- **El de 1920 solo entra a partir de 90rem.** Un portátil de 1280 se lleva
  12.8 KB en vez de 24.2. Comprobado: una sola petición por viewport, nunca
  las dos.
- **Máscara con `mask-composite: intersect`, no la suma por defecto.** Son dos
  degradados cruzados (horizontal y vertical) y con la suma cada eje
  «rescataba» lo que el otro ocultaba: las esquinas se quedaban opacas, que es
  justo lo que la máscara venía a evitar.
- **El velo es más denso a la IZQUIERDA** porque ahí va el título: su contraste
  no puede depender de qué haya salido en la foto. A la derecha se abre para
  que la fotografía respire detrás de las figuras.
- **`@supports` doble en el velo**, la misma trampa que la nav: como el valor
  lleva `var()`, un navegador sin `color-mix` no descarta la declaración al
  parsear sino al computar, y cada parada caería a `transparent` — título
  sobre foto. El respaldo tapa con un velo plano: se pierde el efecto, no la
  legibilidad.
- **`isolation: isolate` en `.hero`.** Las dos capas van en z-index negativo
  para no tocar el z-index de nada más; sin aislar, un z-index negativo puede
  colarse por detrás del fondo de un ancestro y desaparecer.

**Rendimiento — medido antes y después, 4G lento, `prefers-reduced-motion`**

| 1440×900 | Antes | Después |
| :------- | ----: | ------: |
| LCP | 1976 ms | **1996 ms** (+20) |
| Hero completo | 3112 ms | **3207 ms** (+95) |
| Elemento LCP | `IMG.figura__img` 7/7 | `IMG.figura__img` **7/7** |
| CLS | 0 | **0** |

| 390×844 | Antes | Después |
| :------ | ----: | ------: |
| LCP | 1980 ms | **1980 ms** (0) |
| Hero completo | 3186 ms | **3195 ms** (+9) |
| Fondo descargado | — | **nada: 0 peticiones** |

**+95 ms contra un umbral de 200: entra, y sin plan B.** El elemento LCP es el
mismo en las 14 pasadas, así que la comparación es legítima (convención 13). La
huella SHA de `dist/` se comprobó antes y después de cada corrida.

> **AQUÍ NACIÓ LA CONVENCIÓN 17, y la primera versión de esto casi se publica
> mal.** La integración inicial usaba `define:vars` y daba +104 ms a 1440. Bajo
> el umbral, así que se habría aceptado. Lo que no cuadraba: **+92 ms a 390 px,
> donde el fondo no se descarga**. Una imagen que no se pide no cuesta 92 ms.
> Era `define:vars` inflando el HTML en 17 882 bytes. Corregido, el coste real
> de la imagen son 20 ms. Ver la convención 17.

---

### Tarjeta de boletos partida en dos mitades · COMPLETADA

La tarjeta se leía genérica: un número arriba y una lista debajo, todo del
mismo color. Ahora son **dos mitades**.

**Qué se hizo**

- **Izquierda:** el precio, dominante, sobre `--accent` con `--accent-ink`.
- **Derecha:** qué incluye y el CTA, justo detrás del último punto.
- **En móvil se apilan**: precio arriba, lista y botón abajo.
- Ancho máximo de 560 a **880 px** (a 560 la lista partía cada punto en tres
  líneas).

**Decisiones**

- **La columna del precio es la MENOR de las dos** (0.72fr contra 1fr). Domina
  por tamaño de cifra y por color, no por superficie: al 50/50 el panel de
  acento se comía la tarjeta y la lista quedaba apretada.
- **`color: var(--accent-ink)` en el propio panel es OBLIGATORIO.** Es la
  convención 16: los hijos sin color propio heredan el valor YA COMPUTADO de
  `body` —el claro del tema oscuro— y saldrían casi invisibles sobre el lima.
- **`--text-muted` no existe sobre `--accent`.** Es un gris pensado para fondo
  oscuro. Los textos atenuados del panel se mezclan con `color-mix` entre la
  tinta y su propio fondo: misma jerarquía, sin inventar tokens.
- **DESAPARECE `.cta--movil`, el CTA duplicado de cabecera.** Existía solo
  porque en la tarjeta de una columna el botón caía 628 px por debajo del
  precio. Con el precio en su propio panel compacto la distancia se desploma y
  el duplicado sobra — un CTA repetido dos veces en la misma tarjeta es ruido.
- **El borde superior de `.incluye` se fue.** Separaba la lista del precio
  cuando compartían columna; con el precio en la otra mitad no separaba nada, y
  en móvil dibujaba una segunda línea justo bajo el canto del panel de acento.
- **El conteo de conferencias sigue siendo DERIVADO.** Sale de
  `totalConferencias()`, que cuenta `tipo: 'ponencia'` en `programa.json`. No
  se tocó. Hoy da 7 (con 6 ponentes: Edgar repite).

**Verificado — 4 anchos × 2 temas**

| | 360 | 768 | 1024 | 1440 |
| :-- | --: | --: | --: | --: |
| Alto de la tarjeta | 893 | 731 | 637 | 676 |
| Tramo precio → CTA | **682** | 249 | 216 | 238 |
| ¿Cabe en 800 de alto? | **SÍ** | SÍ | SÍ | SÍ |
| Alto del CTA | 58 | 59 | 60 | 61 |
| Desborde horizontal | 0 | 0 | 0 | 0 |
| `href` = `checkoutUrl` | SÍ | SÍ | SÍ | SÍ |

**Contraste leído del PÍXEL del render**, no del token: 7 elementos × 2 anchos
× 2 temas, **todo por encima de 4.5:1**. Peor par **6.65:1** (la nota del
precio en tema azul). El precio: 12.86:1 en verde y 10.55:1 en azul.

> **DOS TRAMPAS DE MEDICIÓN EN ESTA MISMA TAREA, las dos de la familia 14.**
>
> **(1) Se midió la tarjeta equivocada.** `querySelector('.tarjeta')` devuelve
> la PRIMERA del documento, y Ponentes usa esa misma clase y va antes. Las
> capturas salían con la ficha de Edgar y los números eran de otro elemento.
> Se destapó al MIRAR la captura, no leyendo la tabla. **Todo selector de
> verificación va acotado a su sección** (`#boletos .tarjeta`).
>
> **(2) El contraste por `getComputedStyle` daba 77 000 000:1.** Con
> `color-mix`, Chrome devuelve el color resuelto como `color(srgb 0.02 0.06
> 0.04)` y un parser de enteros saca basura de los decimales. **El contraste se
> lee del píxel**, por histograma de la caja del elemento: el color más
> frecuente es el fondo y el más lejano con presencia ≥1.5% es la tinta.


---

### El modal se abría llevándose al usuario · CORREGIDO

Pulsar una figura del hero —o una tarjeta de la sección— abría la ficha PERO
además desplazaba la página. El modal debe abrirse **in situ**, sin tocar el
scroll.

**Eran DOS fallos independientes, y el segundo es el gordo**

**(1) El gestor de anclas se desplazaba a la ficha.** `bindAnchors()` de
`animations.js` intercepta todo `a[href^="#"]` cuyo destino EXISTA, y el
`<dialog id="ponente-slug">` existe. Hacía `lenis.scrollTo(ficha)`. El
`preventDefault()` que ya hacía `Ponentes.astro` frena la navegación nativa,
pero **no frena a otro listener**.

Y no llevaba a la sección de Ponentes, como parecía: **llevaba al PRINCIPIO de
la página.** Con la ficha ya en la capa superior su `offsetTop` resuelve a ~0,
así que «desplázate hasta ella» significa «vete a 0». Medido: con la página a
2299 px, tras el clic quedaba en 4.

**(2) El modal no era `position: fixed`, y el foco arrastraba la página.**
Este es el de verdad, porque **pasa aunque no haya Lenis**.

`.ficha[open]` declara `position: static` —lo que hace posible el modo sin
JS— y `showModal()` **también pone el atributo `open`**, así que esa regla
alcanzaba al modal. Un elemento de la capa superior con `static` se trata como
absolutamente posicionado, pero **contra el bloque contenedor inicial, que es
el DOCUMENTO, no el viewport**.

Medido con movimiento reducido, para aislarlo de Lenis:

| | Antes | Después |
| :-- | --: | --: |
| scroll antes de abrir | 2299 | 2299 |
| scroll tras `showModal()` | **0** | **2299** |
| `rect.top` de la ficha tras abrir | 45 | 45 |
| `rect.top` tras forzar scroll a 2000 | **−1955** | **45** |
| `position` computada | `absolute` | `fixed` |

Esa cuarta fila es la prueba: la ficha **se movía con el documento**. Estaba
dibujada en y≈45 del DOCUMENTO, y como `showModal()` mueve el foco al diálogo,
el navegador lo traía a la vista desplazando la página hasta 0.

**Qué se hizo**

- `Ponentes.astro`, CSS: **`position: fixed; inset: 0` en `.ficha:modal`**.
  Se declara ahí y NO acotando la regla de arriba con `:not(:modal)`: un
  navegador que no entienda `:modal` descarta este bloque entero y
  `.ficha[open]` sigue dando `static`, que es justo lo que ese navegador
  necesita. Al revés, un selector inválido se llevaría por delante el `static`
  y con él las tres roturas sin JS de la Fase 3.
- `animations.js`: `fichaDeHash()`. Si el destino de un ancla es una ficha,
  `bindAnchors()` **se sale sin `preventDefault()`** y no toca el scroll.
  Sin cancelar a propósito: si el script de Ponentes no corriera, el `<a>`
  tiene que seguir siendo un ancla normal. Y no depende del orden de registro
  de los dos listeners —los dos en documento y en burbuja—, porque cualquiera
  de los dos órdenes da el mismo resultado.
- `animations.js`, deep-link: llegar con `#ponente-slug` desplaza a
  **`#ponentes`**, la sección, no a la ficha.
- `Ponentes.astro`: `llevarALaSeccion()` hace lo mismo por la vía nativa, que
  es la que queda cuando no hay Lenis (movimiento reducido).
- `Ponentes.astro`: **«Atrás» ahora cierra el modal.** Al abrir se hace
  `pushState`, así que la entrada anterior es la URL sin hash; antes el
  `hashchange` solo sabía abrir y la ficha se quedaba abierta con la URL ya
  limpia.

**Verificado — 7 casos × 2 modos de movimiento, con clics y teclas REALES**

No llamando a `abrir()` por dentro: la queja era sobre lo que pasa al pulsar,
y eso solo sale ejercitando el evento de verdad.

| | Caso | Resultado |
| - | :--- | :-------- |
| 1 | Clic en figura del hero | modal abre · **scroll delta 0** · hash puesto |
| 2 | Clic en tarjeta de la sección | modal abre · **delta 0** (antes −2295) |
| 3 | Escape | cierra · hash limpio · **scroll intacto** |
| 4 | Entrada directa con hash | modal abierto · **scroll en `#ponentes`** |
| 5 | Sin JavaScript | ancla normal · 6 fichas en el flujo · `position: static` |
| 6 | Botón de cerrar | cierra · hash limpio · scroll intacto |
| 7 | «Atrás» | cierra · hash limpio · scroll intacto |

Los 7 pasan **con movimiento y con `prefers-reduced-motion`** (convención 15:
el camino sin Lenis es otro camino, y el fallo (2) solo se veía ahí en limpio).
Mirado en captura además de medido: tras pulsar en el hero se ve el HERO detrás
del velo, y en la entrada directa se ve la SECCIÓN DE PONENTES.

> **EL ARNÉS FALLÓ DOS VECES ANTES QUE EL PRODUCTO, y las dos son la 14.**
>
> **(1) Clic al vacío contado como fallo del producto.** El enlace de la
> tarjeta estaba en y=887 con 28 px de alto: su BORDE caía dentro de una
> ventana de 900, su CENTRO en y=901, fuera. El clic se enviaba a coordenadas
> vacías, `elementFromPoint` daba `null` y el caso salía como «el modal no
> abre». Ahora `clicEn()` comprueba que el punto **aterriza en el enlace** y
> revienta si no, en vez de mentir.
>
> **(2) El primer diagnóstico acusó al elemento equivocado.** Con la página en
> el tope (scrollY 0) el caso del hero salía OK —desplazarse a 0 desde 0 no se
> ve—, así que el fallo parecía no existir. Solo apareció midiendo desde una
> posición desplazada. **Un caso que pasa en el origen de coordenadas no prueba
> nada sobre un fallo de desplazamiento.**

> **Y la premisa del encargo era falsa, que es lo que más costó.** El encargo
> decía «el modal ya es `position: fixed`, así que el contenido de fondo no
> debería moverse». No lo era: computaba `absolute`. Si se hubiera dado por
> buena esa frase, el arreglo se habría quedado en el punto (1) —el gestor de
> anclas— y el fallo habría seguido ahí para todo el que navega con movimiento
> reducido.


---

### Contacto real, WhatsApp y dos secciones con más cuerpo · COMPLETADA

Cinco correcciones en una pasada.

#### 1 · El conteo de personas, otra vez

El encargo pedía buscar «7 conferencistas» y bajarlo a 6. **Esa cadena no
existe en el repo**: el error estaba escrito con otra palabra, en
`programa.json` —«con los siete ponentes en el escenario»—, describiendo el
panel de la tarde. Son **7 ponencias entre 6 personas**, porque Edgar Oliva da
dos.

| Dónde | Decía | Dice |
| :---- | :---- | :--- |
| `src/data/programa.json` · `notaDuracion` | «con los **siete** ponentes en el escenario» | «con los **seis** ponentes en el escenario» |
| `CLAUDE.md` (bitácora Fase 4) | «LA AGENDA SIGUE CON 6 SESIONES Y HAY 7 **PONENTES**» | «…7 **PONENCIAS**» |
| `CLAUDE.md` (bitácora, recorte a 30 min) | «cubre con los **siete** ponentes presentes» | «…los **seis** ponentes presentes» |

**«7 conferencias» y «siete conferencias» se quedan como están**, que es lo
correcto, y siguen siendo DERIVADAS de `programa.json` vía
`totalConferencias()`. El JSON-LD tampoco tenía el fallo: `ponentes()` de
`schema.js` acumula en un `Set`, así que ya emitía 6 `performer`.

> **La búsqueda literal que pide el encargo no habría encontrado nada.** Un
> conteo equivocado no se busca por la cifra sino por lo que cuenta: hay que
> barrer los sinónimos —ponentes, conferencistas, expertos, especialistas— y
> después contrastar contra los datos, no contra la memoria.

#### 2 · Contacto real en el pie

- `site.json`: `whatsapp` (crudo, `522361138979`), `whatsappLegible`
  («236 113 8979») y `correo`. **El crudo y el legible viven separados a
  propósito**: agrupar un teléfono es una decisión de lectura, no un cálculo, y
  derivarlo con una expresión regular se rompe en cuanto cambie la lada.
- `src/scripts/contacto.js`, **nuevo**: único sitio del repo donde se arma un
  `wa.me`. Existe por la misma lección que el conteo de conferencias, que
  estuvo copiado en cinco sitios de cuatro archivos.
- El pie pinta el legible, enlaza el crudo, abre en pestaña nueva y lleva su
  `.sr-only`. El teléfono sigue en «Próximamente» porque sigue en null.

#### 3 · WhatsApp: un botón por contexto, nunca dos a la vez

- `IconoWhatsApp.astro`: globo + auricular, trazo 1.5 y 1.35, sin relleno,
  `currentColor`. Dibujado a mano — ni emoji ni dependencia.
- **Móvil:** dentro de la barra de compra, a la izquierda del precio, 48×48
  reales. Estaba anotado como decisión desde que se construyó la barra: dos
  elementos peleándose la esquina inferior derecha se tapan entre sí, y en un
  teléfono esa esquina es donde cae el pulgar.
- **Escritorio:** `BotonWhatsApp.astro`, flotante abajo a la derecha, 52×52,
  en `--surface` con solo el icono en `--accent` — el CTA de la página es
  comprar, no escribir.
- **El relevo es exacto**: los dos usan el corte de 48rem, así que donde
  termina uno empieza el otro. Comprobado: en móvil el flotante computa
  `display: none`; en escritorio la barra no existe.
- Aparece al salir el hero, con `IntersectionObserver` y nunca un listener de
  scroll (lo conduce Lenis).
- Mensajes distintos por origen, y `encodeURIComponent` en vez de escribir los
  `%C3%A1` a mano.

#### 4 · Pilares

Sin tocar contenido ni las tres columnas:

- **Numerales de contorno.** `-webkit-text-stroke` en `--accent` sobre relleno
  transparente, opacidad 0.34. Antes eran relleno sólido al 0.07 — es decir,
  invisibles. Con respaldo en `@supports`: donde no exista el contorno queda el
  relleno tenue de antes, así que el peor caso es «como estaba».
- **Tarjetas de verdad**: `--surface` sobre el `--bg` de la sección, borde,
  radio y hover que levanta 3px con sombra.
- **Filo superior en degradado** de `--accent` que se apaga antes del otro
  extremo, en vez del borde plano.

> **LA PRIMERA VERSIÓN ESTABA MAL Y SOLO SE VIO EN CAPTURA.** A `--step-5` el
> numeral no cabía en su banda y **el contorno cruzaba el título**. Con el
> relleno al 0.07 de antes daba igual —no se veía nada—, pero un contorno
> visible por encima del texto es ruido. Se bajó a `--step-4` y el padding
> superior de la tarjeta pasó a `--space-2xl` para darle banda propia. Ninguna
> comprobación numérica lo habría cazado: el contraste del texto no cambia
> porque le pase una línea por encima.

#### 5 · ¿Para quién es?

Sin tocar contenido ni el 3+2 centrado:

- **Los iconos van en un chip** de 44×44, `--accent` al 12%, que sube al 20%
  en hover. Sueltos se leían como un adorno perdido en la esquina.
- **Hover**: borde mezclado con `--accent` y `--shadow-md`. Se usa `--accent`
  y no `--primary-bright` porque dentro de una superficie clara `--accent` ya
  está remapeado al primario profundo, así que el realce sigue al tema y a la
  superficie sin una regla aparte.
- El fondo plano del chip va declarado ANTES del `color-mix`, como respaldo:
  sin `color-mix` la declaración se descarta al computar —lleva `var()`— y el
  chip caería a transparente.

> **EL «NICE-TO-HAVE» DE ILUMINAR EL PERFIL DEL COMPRADOR NO SE HIZO, Y NO ES
> CUESTIÓN DE COMPLEJIDAD: NO HAY CON QUÉ.** El checkout es un Payment Link
> hospedado por Stripe y este sitio no tiene backend ni webhook, así que la
> página nunca llega a saber qué perfil eligió nadie —ni antes de pagar ni
> después—. No es un detalle caro: es un dato que no existe de este lado.
> Requeriría capturar el perfil en la propia landing antes de mandar a Stripe,
> que es otra funcionalidad y otra decisión de producto.

**Verificado — 4 anchos × 2 temas, con `prefers-reduced-motion`**

| Comprobación | Resultado |
| :----------- | :-------- |
| Contraste del texto, leído del PÍXEL | todo **≥ 4.5:1**; peor par **6.46:1** |
| Desborde horizontal (360/768/1024/1440) | **0** |
| Flotante en el hero | oculto; aparece al pasarlo |
| Flotante en móvil | `display: none` |
| Icono en la barra | dentro de la barra, **48×48**, a la izquierda del precio |
| Enlaces WhatsApp | `target=_blank`, `rel=noopener noreferrer`, mensaje codificado |
| Movimiento reducido | sin `translate` ni transición en tarjetas y flotante |

Mirado en captura además de medido, en los dos temas.

> **EL ARNÉS FALLÓ TRES VECES MÁS, y conviene tenerlas juntas porque son la
> misma familia: recortar una captura en el sistema de coordenadas equivocado.**
>
> 1. `[data-barra-compra]` es `position: fixed`, así que sumarle `scrollY`
>    apunta a un sitio del documento donde no está: el recorte salió con el
>    retrato de un ponente.
> 2. El recorte del texto sin `captureBeyondViewport` devolvía imágenes en
>    blanco, y el histograma daba **ratio 1.00** — que se lee como «no hay
>    contraste» cuando en realidad significa «no hay imagen».
> 3. A 360 px el documento mide 16 731 px y el recorte llegaba antes de que el
>    layout se asentara: tres pares dieron 1.00 y 1.32. Con 900 ms de espera
>    los mismos tres dan 15.30, 6.59 y 6.46.
>
> **Un ratio de 1.00 no es un fallo de contraste, es un fallo de medición**: un
> color plano contra sí mismo. Cuando aparezca, mirar la captura ANTES de tocar
> el CSS — las tres veces el diseño estaba bien.

---

### El video del congreso — archivo local, `preload="none"` y póster · COMPLETADA

Cierra el último asset pendiente de la Fase 2. La sección «El congreso» deja de
tener placeholder: sirve el promocional real desde `/public`.

**Qué se hizo**

- `public/video/promo.mp4` — 1920×1080, 59.75 s, **27 347 739 B (26.1 MiB)**.
- `public/video/poster.webp` — 960×540, **37 678 B**. Es un fotograma del
  propio video en el segundo 5.8, la tarjeta de marca «1er Expo AVIPRO» sobre
  la panorámica aérea de las casetas. Se eligió mirando once fotogramas
  candidatos: es el único que identifica el evento sin pillar a nadie a media
  frase.
- `VideoSection.astro` — fuera el bloque `.intro__placeholder`, el icono de play
  y el texto «Video próximamente». Entra un `<video controls preload="none"
  playsinline poster width="1920" height="1080">` con un solo `<source>` MP4.
  La ruta va por `asset()`, como manda la convención 9.

**Decisiones**

- **`preload="none"`, no `"metadata"`.** El comentario que quedó escrito en la
  Fase 2 proponía `metadata`; se descartó. Con `metadata` el navegador abre el
  archivo para leer cabeceras y, según implementación, se trae el primer tramo.
  Sobre 26 MB y con el grueso del tráfico llegando por WhatsApp en datos
  móviles (ver «Revisión de móvil»), eso es peso que nadie pidió. Medido: **0
  peticiones a `promo.mp4` hasta que se pulsa play**, en los ocho escenarios.
- **Un solo `<source>` MP4, sin WebM.** El comentario de la Fase 2 preveía los
  dos. H.264/AAC en MP4 lo reproduce todo lo que este sitio soporta, y un
  segundo encode duplicaría el peso del repo para no ganar ninguna
  compatibilidad real. Si algún día entra AV1/WebM, va como `<source>` ANTES
  del MP4, no en lugar de él.
- **El póster es WebP, no JPG.** El comentario de la Fase 2 decía
  `poster-congreso.jpg`. WebP baja a 37 KB lo que en JPG comparable pasaba de
  60, y el soporte de `poster` con WebP es universal en el parque objetivo.
- **`width`/`height` en el marcado + `height: auto` en el CSS.** Los atributos
  dan la proporción intrínseca y el CSS impide que se lean como tamaño fijo.
  Con eso la caja está reservada antes de que llegue el póster. **`max-width:
  100%` NO es redundante con `width: 100%`**: un `<video width="1920">` toma
  ese valor como base intrínseca y sin el tope desborda el contenedor angosto
  de móvil.

**EL VIDEO SE REENCODÓ ANTES DE ENTRAR AL REPO — y el motivo importa**

El archivo entregado eran **93 956 637 B (89.6 MiB) a 12.6 Mbps**, unas cinco
veces el bitrate que necesita una entrega web de 1080p. Se reencodó a
**libx264 CRF 23, preset slow, `-movflags +faststart`, AAC 128k**:

| | original | servido |
| :--- | ---: | ---: |
| bytes | 93 956 637 | 27 347 739 |
| MiB | 89.6 | 26.1 |
| bitrate | 12.6 Mbps | ~3.5 Mbps |

**SSIM medido contra el original: 0.9808** (Y 0.976 / U 0.992 / V 0.990), y
comparado además a ojo en fotogramas sueltos: sin diferencia visible. De
propina, `+faststart` bajó de **3 peticiones de rango a 1** al arrancar la
reproducción.

El original vive fuera del repo, en
`../expo-avicola-2026-assets-originales/promo-original-12.6mbps.mp4`, igual que
el resto de los pesados.

> **POR QUÉ NO SE COMMITEÓ EL ORIGINAL, aunque «cabía».** 89.6 MiB pasa por
> debajo del límite duro de 100 MiB de GitHub, así que era técnicamente
> posible. Se rechazó por dos razones que conviene no volver a discutir:
>
> 1. **Un binario commiteado no se puede «quitar después».** El plan de rescate
>    que se planteó —si el clone pesa demasiado, se migra a YouTube no listado,
>    se cambia el `<video>` por un iframe y se borra el archivo— **no reduce el
>    peso del clone**. El blob se queda en el historial y cada `git clone` lo
>    sigue bajando. Deshacerlo de verdad exige `git filter-repo` y un
>    force-push que invalida todos los clones existentes. Es exactamente lo que
>    advierte el comentario de `.gitignore`, escrito para las imágenes.
> 2. **A 89.6 MiB no quedaba margen.** Cualquier reexportación un poco más
>    larga habría chocado con los 100 MiB y bloqueado el push, con el archivo
>    ya en la historia.
>
> Con 26.1 MiB el problema deja de existir y **la migración a YouTube ya no
> hace falta**. Si aun así algún día se quisiera: subir como *no listado*,
> sustituir el `<video>` por un iframe con `loading="lazy"` y borrar
> `promo.mp4`. Pero hacerlo para aligerar el clone **no funcionará** salvo que
> se reescriba el historial; la única ventana limpia era esta, antes del primer
> commit.

**Estado — medido en Chrome (Playwright), 360/768/1024/1440 × temas green y blue**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run check` / `npm run build` | 0 errores, 0 avisos |
| **CLS** | **0.0000** en los 8 escenarios |
| **Elemento LCP** | `IMG.figura__img` (hero) en los 8 — **el video nunca es el LCP** |
| LCP | 452–680 ms |
| Peticiones a `promo.mp4` antes de play | **0** en los 8 |
| Peticiones a `poster.webp` | 1 |
| Proporción del video | **1.7778 exacto** (16/9) en los 8 |
| Video vs contenedor | 318/320 · 689/691 · 920/922 · 978/980 (los 2 px son el borde) |
| Tras pulsar play | `paused:false`, `readyState:4`, 1920×1080, `duration:59.75` |
| Sin JavaScript | video visible, `opacity:1`, 919.6×517.3, sin desbordamiento |

Convención 13 respetada: se verificó **qué** elemento mide el LCP, no solo el
número — y no cambia de elemento entre versiones. Convención 14: cerrado
mirando las capturas de los 8 escenarios, no solo los números. Convención 15:
verificado **con y sin JavaScript**, y antes y después de pulsar play.

> **El arnés midió el tema equivocado en la primera pasada.** Se fijó
> `colorScheme: 'dark'|'light'` de Playwright creyendo que eso conmutaba el
> tema. No lo hace: los dos temas de este proyecto son `green` y `blue`, **los
> dos oscuros**, y van por `data-theme` sembrado desde `localStorage`
> (`expo-theme`). La primera corrida midió `green` dos veces y llamó `claro` a
> la segunda. Las capturas lo delataron —salían idénticas—, que es otra vez la
> convención 14 haciendo su trabajo. Para probar el tema hay que sembrar
> `localStorage`, no el `prefers-color-scheme`.

---

### Precio a $750, descuentos por código y autoplay silencioso del video · COMPLETADA

Tres cambios independientes en una sola pasada: precio y checkout nuevos,
descuentos visibles en la tarjeta, y el video pasa de manual a autoplay
silencioso al entrar en pantalla.

**1. Precio: $699 → $750**

- `boletos.json`: `precio: 750`, `checkoutUrl` al nuevo Payment Link
  (`.../dRmcN56up7PG4vHh275c409`), `descripcion` con una frase nueva al final:
  *"Precio de acceso general: $750 MXN."*
- El precio y la URL de `BarraCompra.astro` y del `Offer` del JSON-LD **no se
  tocaron en código**: los dos leen de `boletos.json` en build, que es
  justo el contrato que dejó escrito la Fase 5. Solo se corrigió un
  comentario de `BarraCompra.astro` que citaba el precio viejo a mano.
- Verificado en el HTML compilado: **0 apariciones de 699**, el `Offer` sale
  con `"price":750` y la URL nueva, la barra de compra pinta `$750 MXN` con
  el `href` nuevo.

**2. Descuentos por código — mismo checkout, distinto precio mostrado**

- `boletos.json` gana `descuentos: [{ nombre, codigo, descuento, final }]`:
  Socios IPCI ($650, código `SOCIO`) y Estudiantes y exalumnos ($550, código
  `COMUNIDAD`). **Los tres precios apuntan al mismo `checkoutUrl`** — no son
  productos aparte, así que no hay nada que crear en Stripe más allá de los
  códigos de promoción.
- `Boletos.astro`: la lista de descuentos se pinta DEBAJO del precio
  principal, dentro del mismo panel de acento, con cifra y tipografía menores
  que `.precio` a propósito — es la letra chica de "también hay estos
  precios", no una segunda oferta a la misma altura que compita con
  "Comprar mi boleto". El CTA no se tocó.
- El JSON-LD **no** gana ofertas nuevas: sigue siendo un único `Offer` a
  $750, porque no son productos distintos. Si algún día Stripe crea Prices
  separados por segmento, ahí sí tocaría revisar `ofertas()` en `schema.js`.

**3. Video: autoplay silencioso al entrar en viewport — sin el atributo `autoplay`**

> **Se probó antes de implementar, y el resultado cambió el diseño.** La
> primera idea era literal: añadir `autoplay muted loop` al `<video
> preload="none">`. Se montó un servidor de prueba con el archivo real y
> Playwright, con el video FUERA de la pantalla al cargar, y se midió: **1
> petición a `promo.mp4` de inmediato**, sin haber hecho scroll. El atributo
> `autoplay` le gana a `preload="none"` — el navegador entiende que tiene que
> reproducir cuanto antes y empieza a traer el archivo en cuanto lo pinta,
> viewport o no. Es exactamente lo que este proyecto lleva evitando desde que
> el video es local (ver la entrada anterior de esta bitácora).
>
> Se probó también el reverso — `muted loop` SIN `autoplay` — y ahí sí:
> **0 peticiones**. Esos dos atributos, solos, no piden nada.

Con eso decidido: el marcado lleva `muted` y `loop` estáticos, pero
**`autoplay` no está en el HTML**. La reproducción la dispara un
`IntersectionObserver` en el `<script>` del componente — código esencial, sin
esperar al chunk de GSAP — que llama a `.play()` la primera vez que el
reproductor entra al viewport (umbral 50%), y es ESE `.play()` el que empieza
la descarga real, no antes.

- **`prefers-reduced-motion: reduce` no registra el observer.** El video se
  queda quieto sobre el póster; solo se reproduce si alguien pulsa play a
  mano con los controles nativos. Verificado con
  `reducedMotion: 'reduce'` de Playwright: `paused: true`, `currentTime: 0`,
  **0 peticiones** al mp4 incluso "entrando" en la sección.
- **Botón de sonido**, circular, 44×44 reales, con dos iconos SVG de trazo
  fino (bocina con ondas / bocina con cruz) que alternan según
  `[data-muted]` en el propio botón. Al pulsarlo alterna `video.muted` y
  actualiza icono + `aria-label` ("Activar sonido" / "Silenciar el video").
  **Gateado tras `[data-js]`**, igual que `.barra` en `BarraCompra.astro`:
  sin JavaScript el botón no tiene con qué reaccionar a un clic, así que ni
  se pinta — el video se queda con sus controles nativos, que ya traen
  volumen.
- El estado inicial del botón (`data-muted` presente en el marcado) coincide
  con el real en los dos casos —autoplay muted normal, o `muted` estático
  esperando play manual con reduced-motion—, así que no hay parpadeo de icono
  al cargar: el script solo CONFIRMA el estado leyendo `video.muted`, no lo
  adivina.

**Medido con Playwright, contra el build real:**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run check` / `npm run build` | 0 errores, 0 avisos |
| Peticiones a `promo.mp4` tras cargar, sin llegar a la sección | **0** |
| Video tras entrar en viewport (motion normal) | `paused:false`, `muted:true`, `readyState:4` |
| Tras pulsar el botón de sonido | `video.muted:false`, icono y `aria-label` actualizados |
| Tamaño del botón de sonido | **44×44** exactos |
| Con `prefers-reduced-motion: reduce` | `paused:true`, `currentTime:0`, **0** peticiones |
| Sin JavaScript | botón oculto (`display:none`), video quieto y muted, sin desbordar |
| CLS en 360/768/1024/1440 × green/blue | **0.0000** en los 8 |
| Desborde 401>360 a 360px | el mismo de siempre — es el footer, ya documentado como riesgo abierto, no lo introdujo este cambio |

**Backend — NO se tocó, y aquí importa por qué**

El encargo original era "`src/datos-evento.js` tiene el precio viejo,
actualízalo". Se clonó `teccapitalweb/expo-avicola-backend` para hacerlo y
**la premisa no era correcta**: `datos-evento.js` no tiene ni `precio` ni
`checkoutUrl` — nunca los tuvo. El correo de confirmación no cita un precio
fijo; lo saca en vivo de `session.amount_total` del propio evento de Stripe
en `webhook.js`. Y `vigilante.js` —el proceso que compara el sitio contra el
espejo cada 6 horas— tampoco compara precio ni `checkoutUrl`: solo
`evento.*`, `boleto.nombre`, `boleto.incluye` y `contacto.*`. **No hay nada
que cambiar ahí para este encargo, y el vigilante no iba a alertar de
todos modos.**

Lo que SÍ es una acción real y pendiente, fuera del repo:

> **`PRICE_ID_WHITELIST`** es una variable de entorno en Railway (no vive en
> ningún repo) con el `price_id` de Stripe que el webhook acepta. Un Payment
> Link nuevo casi siempre implica un Price nuevo —los Price de Stripe son
> inmutables, no se edita el importe de uno existente— y el checkout cambió
> de `.../fZufZh9GB2vm6DPeTZ5c408` a `.../dRmcN56up7PG4vHh275c409`. **Si el
> `price_id` detrás del checkout nuevo no está en esa whitelist, el webhook
> descarta en silencio cualquier compra a $750 (o con descuento): responde
> 200, no manda las dos correos, y solo queda un log `DESCARTADO: ningún
> price_id en la whitelist`.** Nadie lo notaría hasta que un comprador
> reclamara no haber recibido su confirmación.
>
> Se avisó al usuario: hay que entrar a Stripe → Payment Links → el nuevo →
> producto → precio, copiar el `price_id` (empieza por `price_`), y
> actualizar `PRICE_ID_WHITELIST` en las variables del servicio en Railway.
> Es un cambio de config de Railway, no de código, y no se hizo aquí.

**De paso, dos cosas encontradas al leer el backend, sin tocar tampoco:**

1. `BOLETO.incluye` en `datos-evento.js` sigue diciendo *"Acceso a las 6
   conferencias especializadas"*; el sitio ya está en 7. Es una divergencia
   preexistente, no causada por este cambio, y el propio `vigilante.js`
   debería estar alertando de ella cada ciclo (compara `boleto.incluye`
   campo a campo).
2. `vigilante.js` no proyecta ni compara precio. Si se quiere que una
   divergencia de precio dispare alerta igual que nombre/incluye, hace falta
   añadir el campo a `proyectarSitio()` / `proyectarEspejo()` en ese archivo
   — no se implementó por no ser parte de este encargo; queda propuesto.

**FAQ**: ninguna respuesta de `faq.json` menciona precio, así que no había
nada que actualizar. Se propuso —sin implementar— añadir una pregunta sobre
los descuentos por código; pendiente de decisión editorial.

**Barra de compra — "desde $550" en vez de $750**: propuesto y NO
implementado, a la espera de decisión: mostrar el precio con descuento más
bajo en la barra fija podría leerse como engañoso para quien no califica, o
como más atractivo para el tráfico frío de WhatsApp. Requiere decidir antes
de tocar `BarraCompra.astro`.

---

### Los códigos de descuento salen del HTML — se piden por WhatsApp · COMPLETADA

Los códigos `SOCIO` y `COMUNIDAD` de la entrada anterior de esta bitácora
estaban a la vista de cualquiera en la tarjeta de boletos: quien leyera
"Aplica código SOCIO al pagar" se lo aplicaba sin ser socio de nada. Se
cierra ese hueco sustituyendo el código visible por una vía de contacto.

**1. Tarjeta de boletos**

- Donde decía "Aplica código SOCIO/COMUNIDAD al pagar" ahora dice "Solicita tu
  código por WhatsApp", enlazado a `wa.me` con un mensaje distinto por
  perfil: uno para socios IPCI, otro para estudiantes y exalumnos.
- **El código NUNCA llega al objeto que consume la plantilla.** `entradas` en
  `Boletos.astro` reconstruye cada descuento CAMPO A CAMPO —`nombre`,
  `final`, `enlaceWhatsapp`— y no con un spread (`...d`), que sí habría
  colado `codigo` y `descuento` (la resta en pesos) al marcado. El mapeo de
  qué mensaje corresponde a qué código (`MENSAJE_POR_CODIGO`) vive en el
  frontmatter, que corre en build: el código se LEE ahí para elegir el
  mensaje, pero no se ESCRIBE en ningún sitio del HTML.
- Verificado en `dist/index.html`: **0 apariciones de "SOCIO" y de
  "COMUNIDAD"**, en ningún atributo ni texto.
- `boletos.json` **no se tocó**: los códigos se quedan tal cual, porque son
  el dato que necesita el backend (`vigilante.js` los usa como identificador
  del descuento; ver la entrada anterior sobre `PRICE_ID_WHITELIST`).

**2. Mensajes de WhatsApp — por perfil, no por código**

`contacto.js` gana tres entradas nuevas en `MENSAJES`:
`descuentoSocioIPCI`, `descuentoEstudiante` y `descuentoGeneral` (esta
última para la FAQ, que no distingue perfil). Van ahí y no como texto suelto
en el componente, siguiendo el mismo criterio que `pie` y `flotante`: un
único sitio para todos los mensajes predefinidos.

**3. FAQ — pregunta nueva, después de "¿Cómo puedo pagar?"**

- `faq.json` gana *"¿Hay descuentos disponibles?"*, con un campo
  `enlaceWhatsapp: { texto, mensaje }` aparte de `respuesta`, y un token
  literal `{enlaceWhatsapp}` dentro del texto marcando dónde va el enlace.
- **Por qué un token y no incrustar el `<a>` en el JSON como HTML:** la
  alternativa —guardar el `<a>` ya armado en `respuesta` y volcarlo con
  `set:html`— habría abierto la puerta a que cualquier cosa que acabe en ese
  campo se interprete como marcado. `Faq.astro` parte el texto con
  `.split('{enlaceWhatsapp}')` y teje un `<a>` real entre las dos mitades:
  el HTML nunca sale del componente, el JSON solo aporta texto.
- Se resuelve en el frontmatter (`items = faq.map(...)`), no en la
  plantilla: el JSX de cada `<details>` solo lee `item.antes` / `item.despues`
  / `item.enlaceHref`, ya listos — mismo patrón que `entradas` en
  `Boletos.astro`.
- Sin `site.contacto.whatsapp` configurado, el enlace se degrada a texto
  plano (mismo criterio que el aviso de "venta en línea" de Boletos: no
  prometer un canal que no existe).

**Medido en el build real:**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run check` / `npm run build` | 0 errores, 0 avisos |
| `"SOCIO"` / `"COMUNIDAD"` en `dist/index.html` | **0** apariciones de cada uno |
| Enlaces `wa.me` en el HTML | 4 mensajes distintos, cada uno con su `?text=` propio |
| Orden de la FAQ | *"¿Cómo puedo pagar?"* antes que *"¿Hay descuentos disponibles?"* |
| CLS en 360/768/1024/1440 | **0.0000** en los 4 |
| Desborde 401>360 a 360px | el mismo de siempre — footer, ya documentado, no lo causó este cambio |

Cerrado mirando las capturas de la tarjeta y de la FAQ abierta en los cuatro
anchos, no solo los números (convención 14).

---

### Foto nueva de Ricardo (ponente-04) — retrato y figura del hero · COMPLETADA

Ricardo cambió de foto. Se reemplazan los dos usos de su imagen —el retrato de
`Ponentes.astro` y la figura de cuerpo completo del hero— sin tocar CSS, JS ni
datos: exactamente el caso que la Fase 2c dejó preparado ("solo datos e
imágenes").

**Herramienta usada.** No hay librería de imagen en el proyecto ni se añadió
ninguna (convención 7). Se instaló `sharp` en un scratchpad FUERA del repo,
igual de espíritu que el Chrome headless de las fases 2b/2c: una herramienta
del lado del asistente para producir los archivos, no una dependencia del
sitio. `package.json` no cambia.

**1. Retrato (`public/img/ponentes/retrato-04.webp`)**

- Fuente: `retrato-04.jpeg` nuevo, 1792×2400, igual que el resto — mismo
  estudio, mismo encuadre de origen.
- Recorte medido, no adivinado: se localizó la cabeza sobre una rejilla de
  coordenadas superpuesta (mismo método que "mirar la hoja de contacto" de la
  Fase 3, porque los tres detectores automáticos de esa fase ya demostraron no
  ser de fiar). Hairline en y≈335, mentón en y≈900 del original.
- **Medida de referencia: altura de cabeza (nacimiento del pelo → mentón) como
  % de los 960 px de salida**, comparada contra los cinco retratos ya
  publicados (excluyendo el 01, cuya barba hace subir el mentón aparente y lo
  invalida como referencia — la misma contaminación por vello que ya advertía
  la Fase 3 sobre a Alejandro y su sombrero):

  | id | altura de cabeza |
  | :- | ----: |
  | 03 | 34.4% |
  | 05 | 33.3% |
  | 06 | 33.9% |
  | **04 nuevo** | **34.4%** |

  A 0.53 puntos de la media de los otros tres — dentro del 2% pedido sin
  necesidad de reencuadrar.
- WebP calidad 90 (pedida así, sin optimizar por energía de alta frecuencia
  como en la Fase 3): **40 556 B**. Con los otros cinco sin tocar, el total de
  `Ponentes` sube de 235.0 a **248.0 KB** — sigue bajo el presupuesto de 250 KB
  de la Fase 3, por 2 KB.
- El JPEG original sale del repo a la carpeta hermana de originales.

**2. Figura del hero (`public/img/hero/ponente-04.webp`)**

- Fuente: `ponente-04-nuevo.png`, 1792×2400, **ya con fondo transparente** —
  comprobado por estadística de canal alfa antes de asumirlo (67.4%
  transparente, 32.3% opaco, solo 0.3% de píxeles a medio camino en el
  antialiasing de los bordes) y confirmado componiendo la figura sobre
  `--bg` real: **sin ningún parche ni halo blanco**. No hizo falta quitar
  fondo.
- El pie de la persona ya tocaba el borde inferior del PNG de origen
  (`bottomGapPx: 0`), así que "pegada al borde inferior" salió gratis del
  recorte: solo hubo que fijar el ancho (proporción 56:75) y decidir cuánto
  torso mostrar por arriba.
- Ricardo va en la fila de FONDO, junto a `06` (lateral) y `02` (centro,
  sombrero). Se midió la **coronilla como % de los 900 px de salida** —mismo
  método que documentó la Fase 2c— contra `06`, su compañero lateral:

  | id | coronilla | vs. `06` |
  | :- | ----: | ----: |
  | 06 (lateral) | 11.44% | — |
  | 02 (centro, sombrero) | 4.44% | sigue siendo el más alto de la fila |
  | **04 nuevo (lateral)** | **11.44%** | **0.00 puntos** |

  Antes, `04` estaba a 13.96% y la pareja lateral quedaba a 2.38% de
  diferencia —fuera del 2%, aceptado en su momento por no haber mejor reparto
  con esas seis fotos—. Con la foto nueva la pareja lateral queda a un 0.00%
  de diferencia. **Ajuste: se subió la coronilla de Ricardo 2.52 puntos
  porcentuales** (de 13.96% a 11.44%) recortando el encuadre para que
  coincidiera con `06`.
- WebP 672×900 calidad 90: **37 622 B** (el anterior pesaba 27 190 B; sigue en
  el rango de sus hermanos, 38–68 KB).
- El PNG original sale del repo a la carpeta hermana de originales.

**Ambos originales anteriores (la foto vieja de Ricardo) se conservaron** con
sufijo `-anterior` en la carpeta de originales, en vez de sobrescribirlos: no
hacía falta perderlos para hacer sitio a los nuevos.

**Verificación**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run check` / `npm run build` | 0 errores, 0 avisos |
| Guardián de `public/img/` (`avisaDeAssetsDePublic`) | **silencioso** — los originales pesados ya no están en `public/img/` |
| `public/img/` tras la limpieza | solo WebP + `.gitkeep`, ningún JPEG/PNG suelto |
| El arco del hero | Edgar al frente y centro, seis caras distinguibles, Ricardo legible en la fila de fondo pese al blazer negro sobre fondo oscuro (comparado con `02` y `06`, que también visten oscuro y se leen bien) |
| Tarjeta de Ricardo, ambos temas | degradado de disolución correcto, sin borde duro, nombre legible |
| Modal desde la figura del hero | abre `dialog#ponente-ricardo-olmos-rivera` |
| Modal desde la tarjeta de Ponentes | abre el mismo `dialog`, mismo contenido |
| Capturas | 390×844 y 1440×900, temas green y blue, **con `prefers-reduced-motion: reduce`** — la lección de la Fase 2c: la flotación oscila ±10px y falsea cualquier medida de coronilla tomada con movimiento activo |
| Desborde 402>390 a 390px | el mismo footer de siempre, ya documentado como riesgo abierto preexistente — no lo causó este cambio |

Cerrado mirando las capturas de los ocho escenarios, no solo los porcentajes
(convención 14): el arco se lee bien, ninguna cara compite con Edgar, y
Ricardo no se pierde contra el fondo oscuro pese a ir de negro.

---

### Audio a la primera interacción y botón de sonido más visible · COMPLETADA

**1. Audio en el primer gesto.** Un listener en `document` —click, touchstart,
scroll o keydown, el que llegue primero— desmutea el video. Los cuatro se
registran con `{ once: true }` y el propio handler quita los otros tres al
disparar uno, para no dejar tres escuchando de por vida.

> **Se encontró una regresión real al probarlo, no se adivinó.** Con
> Playwright: clic real en la nav + scroll → **audio, reproduciendo**. Pero
> "solo scroll, sin clic" desmuteaba el video ANTES de que el
> `IntersectionObserver` intentara reproducirlo, y un autoplay que arranca ya
> sin silenciar, sin gesto fuerte detrás, Chrome lo bloquea ENTERO —el video
> se quedaba parado sin cargar nada, peor que antes de esta tarea, que sí
> reproducía mudo—. Arreglado: el autoplay ahora fuerza `muted=true` justo
> antes de `.play()` —eso nunca lo bloquea nadie— y el intento de sonido va
> DESPUÉS, cuando `.play()` ya resolvió.
>
> **Medido en Chromium — "solo scroll" tras el arreglo:** el video carga y
> reproduce un instante muted, el intento de desmutear posterior dispara la
> intervención de autoplay de Chrome y el video queda **pausado, ya
> desmuteado** (no vuelve a muted, se detiene). Es decir: en Chromium el
> scroll NO cuenta como gesto suficiente para sostener audio — el botón
> manual (o un clic real) sigue siendo necesario. No se probó Firefox/Safari
> por no tener el navegador disponible en este entorno; puede diferir.

**2. Botón más visible.** 52×52 (antes 44×44), esquina inferior derecha sobre
el video, fondo semitranslúcido con blur (mismo `@supports` doble que la
nav). Icono + texto "Activar sonido" en muted; icono solo al activarse.

> **El primer offset probado quedaba encima de los controles nativos.**
> Verificado con captura (controles forzados por `:hover`): a `--space-md`
> del borde, el botón se montaba sobre el icono nativo de pantalla completa.
> Chrome dibuja su barra de controles ~48px de alto pegada al borde inferior
> del `<video>`; el offset subió a `calc(var(--space-md) + 48px)` y la
> captura de control confirma que ya no hay solape.

**3. Pulso de 3 s**, CSS puro (`@keyframes`, 2 iteraciones de 1.5s, se detiene
solo). Sin guardián local de `prefers-reduced-motion`: el corte global de
`global.css` ya fuerza duración a 0.01ms e iteración a 1, así que basta con no
repetir la comprobación (convención 5). El selector exige `[data-muted]` A LA
VEZ que `[data-pulso]`, así que si el video ya se desmuteó —a mano o por la
primera interacción— antes de los 3s, el pulso se apaga en el acto.

**Verificado:**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run check` / `npm run build` | 0 errores, 0 avisos |
| Clic en nav + scroll al video | `muted:false, paused:false` — audio real |
| Botón manual | sigue alternando `video.muted`, aria-label correcto |
| Tamaño del botón, 4 escenarios (390/1440 × green/blue) | **52×52** exactos |
| Botón vs. controles nativos (`:hover`) | sin solape tras el ajuste de offset |
| `prefers-reduced-motion`, sin scroll | `paused:true, muted:true` — sin autoplay |
| Pulso con `prefers-reduced-motion` | `animationDuration: 1e-05s` — imperceptible |
| Pulso en motion normal | presente a 600ms, ausente (`data-pulso` retirado) a 3.8s |

Cerrado mirando las capturas de los cuatro escenarios y la del solape con los
controles nativos (convención 14).

---

### Cuarto patrocinador — Promo Hogar, fondo propio · COMPLETADA

Logo nuevo, JPEG 1024×1024 (0.60 MB), a diferencia de los tres anteriores
**a propósito no se le quitó el fondo.** Trae un fondo artístico (pinceladas
+ dados 3D) sin borde limpio contra el logotipo — el un-blend de los tres
logos previos asume un fondo (casi) plano y aquí no aplica: el resultado
habría sido un recorte irregular con restos de pincelada colgando.

**Tratamiento distinto, con precedente propio.** Se recortó (con `sharp`,
sin ninguna herramienta de IA) a un cuadrado de 910×910 centrado en el
conjunto texto+icono de casa, quitando el margen gris plano de las esquinas
que no aporta nada, y se redujo a 260×260 — de sobra para su tamaño real en
pantalla (`--patro-alto`: 88px, ×2 DPR). A quality 90 pesa **17.31 KB**,
dentro del presupuesto de 20. Se probó también a 700×700 (75.9 KB, muy por
encima) y 320×320 (23.1 KB, ligeramente por encima); 260 fue el primer
tamaño bajo presupuesto sin notarse borroso a la escala real de la tarjeta.

**`fondoPropio: true` en el JSON, nuevo token `--blanco-marca`.** El
componente lee el campo y pone `data-fondo-propio` en `.patro__marco`; la
regla `[data-fondo-propio] { background-color: var(--blanco-marca) }` le da
blanco fijo, NO la `--surface` clara de la sección (que aquí es un beige/azul
tenue, no blanco puro) — necesario para que el logo, que ya trae su propio
blanco de fondo, no muestre un recuadro perceptible contra la superficie
clara de Patrocinadores. `--blanco-marca` es un token nuevo porque no había
ninguno de blanco puro fijo en `tokens.css` (regla 1: nada de hex fuera de
`tokens.css`). No depende de `[data-js]`: se ve igual con y sin JavaScript.

**La rejilla no se tocó.** El `auto-fit`/`minmax(16rem, 22rem)` que ya
existía para 2–3 patrocinadores absorbió el cuarto sin cambios: a 1440px cae
en 2×2 (el `minmax` con máximo definido hace que el navegador calcule el
número de columnas contra el MÁXIMO, no el mínimo — con 4 tarjetas de hasta
22rem no caben 3 en los ~1072px de ancho útil, así que da 2). Se verificó
visualmente que 2×2 se ve más equilibrado que forzar 4 en línea (las tarjetas
quedarían muy angostas); se acepta como la resolución natural del sistema,
no una regla nueva escrita para "4". De 768px para abajo sigue apilando a
una columna, igual que antes.

**El original (0.60 MB) salió del repo** a
`../expo-avicola-2026-assets-originales/patrocinadores/promo-hogar.jpeg`,
mismo criterio que los otros tres.

**Verificado:** `npm run build` / `npm run check` limpios (0/0/0), guardián
de `public/img/` silencioso tras mover el JPEG. Capturado con Chrome DevTools
Protocol (Edge headless, sin Playwright instalado) a 1440/1024/768/360/320px
en los dos temas — 2×2 en desktop, apilado en móvil, tarjeta blanca de Promo
Hogar visible y distinguible en las dos superficies claras (verde y azul),
0 px de desbordamiento horizontal en los cinco anchos. Cerrado mirando la
captura (convención 14), no solo los números de `docWidth`.

**Reemplazo posterior del archivo, mismo tratamiento.** El logo se
reentregó como `promo-hogar.png` (1024×1024 en la entrega original de esta
nota; la versión recibida después ya venía a 260×260) con canal alfa
(`hasAlpha: true`), pero **el alfa solo recorta el margen exterior a la
silueta irregular del blob pintado — el interior sigue siendo pinceladas y
dados**, no un logotipo limpio. Se verificó por contenido (cabecera
`89 50 4E 47`, no por extensión) y por muestreo de píxeles (25.4%
transparente, las cuatro esquinas en alfa 0, el centro opaco con el mismo
fondo artístico). Sigue siendo el caso `fondoPropio: true`: no cambia el
campo, solo la conversión, que esta vez SÍ preserva el alfa (antes era JPEG
sin transparencia). WebP q82, **17.99 KB** — el borde irregular ahora se
funde contra la tarjeta blanca en vez de mostrar el canto rectangular de
antes. Verificado con zoom sobre la tarjeta en los dos temas: sin canto
duro, sin halo. El PNG original salió a la misma carpeta hermana.

---

### Logo nuevo de Avipork — fondo NEGRO, y por qué NO se desmezcla · COMPLETADA

Avipork entregó una identidad nueva: logotipo apaisado (marca «Avipork» en
rojo, red de iconos de especies a la izquierda, razón social y sitio web
debajo) sobre **fondo NEGRO**, JPEG 1280×506. Sustituye al cuadrado de
200×200 que había desde el pendiente 7.

**El un-blend de los otros tres logos NO sirve aquí, y aplicarlo habría
arruinado el logo.** Aquellos venían sobre blanco y se desmezclaban con
`alpha = 255 − min(R,G,B)` recuperando el color de la tinta. La versión
espejo para fondo negro sería `alpha = max(R,G,B)` con `color = px/alpha`
— y eso convierte el **gris #565656** de los iconos y de «AP Equipos
Integrados S.A. de C.V.» en **blanco al 34 % de alfa**, es decir, invisible
sobre la superficie CLARA de esta sección. Un un-blend correcto de
aritmética y equivocado de resultado.

Lo que se hizo en su lugar es una **clave de negro que solo calcula alfa y
CONSERVA el color**: `smoothstep(10, 44, max(R,G,B))`. El gris sigue siendo
gris, el rojo sigue siendo rojo, y la rampa evita el borde dentado. La
sombra oscura desplazada del wordmark cae por debajo del umbral y se va con
el fondo, que es justo lo que hay que hacer: sobre negro no se veía, y sobre
claro habría quedado como un fantasma gris.

**No hizo falta `fondoPropio`** (el mecanismo del logo de Promo Hogar): con
el negro fuera, el gris da 6.4:1 y el rojo #CE1B21 4.6:1 contra
`--claro-surface`. Una tarjeta con fondo negro entre tres claras habría sido
peor que el problema que resuelve.

**446×176, WebP q74 / alphaQuality 70, effort 6 → 19.57 KB.** El render real
es 223×88 CSS px (lo limita el alto, `--patro-alto` = 88 px, con
`object-fit: contain`), así que 446 es DPR2 exacto. Se barrieron 320–480 px
y cuatro pares calidad/alfa: a q74/a70 el subtítulo —el texto más fino del
logo— es indistinguible de la referencia q80/a80 comparado a 4× sobre el
fondo claro real, y ahorra 9 KB. El logo pesa ahora 19.57 KB contra los
10.14 del cuadrado anterior; el conjunto de los cuatro sube a ~59 KB, todos
`loading="lazy"` bajo el pliegue.

**Es el primer logo apaisado del conjunto** (2.53:1 contra los cuadrados de
los otros tres). No se tocó ni la rejilla ni el CSS: `object-fit: contain`
sobre una caja de alto fijo lo resuelve solo. Sí se corrigió el comentario
del `<img>` en `Patrocinadores.astro`, que documentaba «los dos WebP son
cuadrados de verdad»: los atributos `width`/`height` pasan a declararse como
NOMINALES, porque el `<style>` fuerza las dos dimensiones y la caja tiene
alto fijo, así que ni deciden el tamaño ni hay salto de layout que reservar.

**Verificado** (`npm run build` / `npm run check` en 0/0/0, guardián de
assets silencioso) en Chrome headless por CDP, con `prefers-reduced-motion`,
en 1440×900 y 390×844 × temas verde y azul: `data-state="loaded"` en los
cuatro, natural 446×176, 0 px de desbordamiento horizontal y las cuatro
tarjetas en su sitio. Cerrado MIRANDO la captura de la sección y un recorte
a 2× de la tarjeta (convención 14): sin caja negra, sin halo, iconos y
subtítulo legibles sobre las dos superficies claras.

> **La captura de la tarjeta salió primero en el sitio equivocado** —enseñaba
> el hero— por la trampa de siempre: `getBoundingClientRect()` da coordenadas
> de VIEWPORT y `Page.captureScreenshot` con `captureBeyondViewport` las
> quiere de DOCUMENTO. Hay que sumar `window.scrollY`. Es la tercera vez que
> este proyecto tropieza con recortar en el sistema de coordenadas
> equivocado.

El JPEG original salió del repo a
`../expo-avicola-2026-assets-originales/patrocinadores/avipork.jpeg`, y el
anterior se conservó como `avipork-anterior.jpeg` en vez de sobrescribirlo
(mismo criterio que la foto vieja de Ricardo).

---

### Logos de patrocinadores — pendiente 7 resuelto · COMPLETADA

Avipork y Prosermat llegaron como JPEG 1024×1024 (138 KB y 300 KB, sin canal
alfa — JPEG no admite transparencia, es el formato). Fondo blanco horneado en
los dos, logotipo oscuro/verde, ninguno en versión clara ilegible.

**Fondo quitado a mano, no solo convertido.** Un JPEG de fondo blanco puro
sobre `--claro-surface` (`#f8f4ec` verde / `#f4f8fc` azul, no blanco puro)
deja un halo rectangular. Sin herramienta de recorte con IA disponible, se
implementó un un-blend contra matte blanco conocido (estilo Smith-Blinn):
`alpha = 255 − min(R,G,B)`, y el color se desmezcla (no solo se recorta) para
no dejar fleco blanco en los bordes antialiased. Verificado a resolución
nativa con zoom en los trazos más finos y arriesgados —el anillo verde claro
de Prosermat, el swoosh negro de Avipork— sobre las dos superficies claras
reales del sitio: sin halo, sin fleco, sin caja visible.

WebP con alfa a 200×200 (Avipork, q90, 10.14 KB) y 190×190 (Prosermat, q75,
17.05 KB) — **27.19 KB total**, bajo el presupuesto de 30. Prosermat pesa más
a igual calidad por su detalle de color (campos y anillo con más tonos); se
le bajó calidad a propósito para no gastar el presupuesto en el que menos lo
necesita, mismo criterio que la calidad por imagen de los retratos en Fase 3.

**Un bug real de CSS Grid, no solo el desborde documentado.** El Riesgo
abierto de este pendiente decía sustituir `width: auto` por `width: 100%;
height: 100%` en `.patro__logo`, y se aplicó. Con los logos reales el logo
se salía igual: 302×302 —el tamaño intrínseco cuadrado del WebP— tapando la
descripción de la tarjeta. Dos causas, encontradas con pruebas dirigidas, no
adivinadas:

1. `.patro__caja` tenía `place-items: center`, así que el `<img>` (item de
   grid) no se estiraba a la altura de la fila. Se cambió a
   `place-items: stretch`. Necesario, no suficiente.
2. **Un porcentaje de alto en un elemento reemplazado dentro de un item de
   grid no resuelve contra el alto "estirado" de la pista**, aunque
   `getComputedStyle` del item ya reporte ese alto como definido. Probado
   aislando la variable: `height: 88px` (unidad absoluta) sí funcionaba;
   `height: 100%` de ese mismo contenedor de 88px, no. Se descartó también
   que fuera el `aspect-ratio` implícito de los atributos `width`/`height`
   del `<img>` —persistía igual quitándolos del marcado—. La solución final:
   una variable `--patro-alto` compartida entre `.patro__caja` y
   `.patro__logo`, con `height: var(--patro-alto)` en vez de `100%`.

**Verificado:**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run check` / `npm run build` | 0 errores, 0 avisos |
| Peso total de los dos logos | **27.19 KB**, bajo el presupuesto de 30 |
| Transparencia | confirmada, sin halo, verificado con zoom a resolución nativa |
| Tamaño del logo en la caja, 8 escenarios (390/768/1024/1440 × green/blue) | correcto, sin deformar, sin desbordar |
| Sin JavaScript | `302×88` en los dos logos, **0 px** de desborde |
| Desborde en los 4 anchos | el mismo del footer, ya documentado — 0 elementos `.patro*` en la lista de culpables |
| Guardián de `public/img/` | silencioso; los JPEG salieron a la carpeta hermana |

**Limpieza:** los JPEG originales (138 KB y 300 KB, ambos sobre 100 KB) salieron
a `../expo-avicola-2026-assets-originales/patrocinadores/`. No había ningún
logo placeholder que quitar —la sección ya usaba el mismo mecanismo de
marco-punteado-hasta-confirmar-carga que el hero y los retratos—. Ese
fallback **se conservó a propósito**: un logo puede volver a dar 404 el día
que se sustituya por uno nuevo, y es exactamente el escenario para el que
existe.

**Sin URL para Prosermat.** Se buscó en EXIF/IPTC/XMP del JPEG original y no
había metadatos; tampoco hay URL impresa en el propio logo. Se queda sin
enlace (`url: null`), como ya estaba.

---

### El footer desborda 41 px a 360 px · CERRADO

Medido, no asumido: los elementos `.pie__*` con desborde (401.1 en 360)
compartían todos el mismo ancho fraccionario, **381.109px** — huella clásica
de un "grid blowout". `.pie__inner` es una grid de una sola columna en móvil
y sus tres bloques (`.pie__marca`, `.pie__nav`, `.pie__contacto`) son items
de grid con `min-width: auto` de fábrica: no pueden encoger por debajo del
min-content de su contenido.

**El min-content lo marcaba el correo, `contacto@visionpecuariamx.com`.** Es
una sola palabra sin espacios ni guiones, así que sin un punto de corte su
min-content es el ancho de la cadena entera — más de lo que cabe en 320px de
columna — y ese ancho forzaba la pista de `.pie__inner` (y con ella el pie
completo) a 381px.

**Arreglo, dos partes, en `Footer.astro`:**
1. `min-width: 0` en `.pie__marca`, `.pie__nav`, `.pie__contacto` y en
   `.vias__valor` (la celda de `.vias__fila`, que es OTRA grid con el mismo
   problema un nivel más adentro) — deja que las pistas encojan de verdad.
2. `overflow-wrap: anywhere` en `.vias__valor` — permite partir el correo a
   media palabra cuando no hay otro punto de corte. Se usó `anywhere` y no
   `word-break: break-word` a propósito: `break-word` fuerza el corte visual
   pero NO reduce el min-content en el cálculo de layout (es legado,
   pensado para compatibilidad), así que por sí solo no habría bastado para
   arreglar el blowout — `anywhere` sí participa en ese cálculo.

**Verificado con Playwright, 6 anchos × 2 temas (320/360/375/390/768/1440 ×
green/blue): 0 px de desborde en los 12.** Desktop no se tocó —768 y 1440 ya
estaban en 0 y siguen en 0, con la grid de tres columnas intacta. Cerrado
mirando la captura (convención 14): a 360px el correo se parte en dos líneas
dentro de su columna, sin romper el layout ni salirse del viewport.

---

### Tercer patrocinador — TEC CAPITAL Group · COMPLETADA

Logo nuevo, JPEG 1024×1024 sin alfa (mismo motivo que Avipork/Prosermat: es
JPEG). Un "T" en 3D, cara frontal blanca y canto azul, con sombra suave.

**El mismo un-blend de siempre reveló un problema nuevo: el fondo NO era
blanco puro.** Medido en las esquinas del lienzo: 233–253 en vez de 255. Es
un degradado/viñeta suave típico de render 3D, no un blanco plano. La fórmula
`alpha = 255 − min(R,G,B)` le daba a ESE degradado un alfa bajo pero
distinto de cero en TODO el lienzo, y el resultado —comprobado componiendo
sobre las dos superficies claras reales— era una caja rectangular tenue del
tamaño exacto del lienzo original, visible por la diferencia de tono contra
`--claro-surface`. Los otros dos logos no lo sufrían porque su fondo SÍ era
`(255,255,255)` uniforme.

**Arreglo: umbral antes del un-blend.** `alpha = 0` si `255 − min(R,G,B) ≤
25`; el resto se reescala para no perder rango en los bordes reales de la
letra. Verificado componiendo de nuevo sobre las dos superficies: sin caja.
El único costo es que la cara frontal blanca de la letra —con sombreado muy
sutil, cerca del umbral— queda casi transparente, pero la "T" se sigue
leyendo con nitidez por el canto azul y el contorno.

WebP 190×190 calidad 90: **4.23 KB** (bajó de los ~14 KB sin el umbral,
porque hay mucha menos variación de alfa que codificar). **Total de los tres
logos: 31.86 KB**, bajo el presupuesto de 45.

**Sin URL.** `teccapital.com` redirige a una página de venta de dominio
(HugeDomains) — no es el sitio de la empresa. Se deja `url: null`, como pide
el encargo para el caso de una URL incorrecta.

**Integración:** `patrocinadores.json` gana el tercer objeto (con `slug`, que
los otros dos no traían — no rompe nada, el componente solo lee los campos
que usa). La rejilla ya estaba pensada para esto desde la Fase 6:
`auto-fit`/`minmax` con `justify-content: center` reparte 1, 2 o 3 tarjetas
sin rediseño — en desktop entran las tres en una fila, en 360–768 se apilan
2+1 sin desbordar.

**Verificado:** `npm run check`/`build` limpios, guardián de assets
silencioso (el JPEG de 260 KB salió a la carpeta hermana), 0 px de desborde
en 320/360/768/1024/1440 × green/blue, los tres logos proporcionados entre sí
sin deformarse. Cerrado mirando la captura: sin la caja del primer intento,
las tres tarjetas se leen parejas.

---

### Fase 8 — `/admin` real: Firebase Auth + lista de asistentes desde Stripe · CÓDIGO COMPLETADO, PENDIENTE DE CONFIGURACIÓN EXTERNA

Todo el código está escrito, compila y se verificó por captura. **No se puede
dar por cerrada la fase** porque necesita cuentas y claves que solo existen en
consolas externas (Firebase, Stripe) a las que este entorno no tiene acceso —
ver «LO QUE FALTA, fuera del repo» al final de esta entrada.

**Dos decisiones de arquitectura se consultaron ANTES de escribir código**,
porque el encargo original chocaba con un hecho del proyecto que no era obvio
desde fuera: el sitio es 100% estático (sin adaptador, sin backend, GitHub
Pages), así que «que /admin no sea accesible sin login, ni siquiera el HTML
estático» es, literalmente, imposible — cualquiera puede descargar ese HTML.
Se preguntó y se confirmaron las dos opciones recomendadas:

1. **Gating por JS, no por servidor.** `/admin` sirve un HTML que de partida
   NO contiene ningún dato — solo el formulario de login. Firebase Auth
   decide qué se pide después. `noindex` se conserva y el panel sigue fuera
   del sitemap, que es la única protección real contra que alguien lo
   encuentre por buscador.
2. **La Restricted Key de Stripe vive en Firestore, no en una variable
   `PUBLIC_*`.** Una `PUBLIC_*` de Astro/Vite se hornea en el JS público en
   BUILD: cualquiera que visite el sitio, sin loguearse, podría extraerla del
   bundle y leer todos los datos de clientes de Stripe sin pasar por Firebase
   Auth en absoluto. Firestore solo entrega `config/stripe.restrictedKey` a
   quien ya tiene sesión de Firebase válida (`firestore.rules`), y como no
   hay registro público —cada cuenta la crea a mano quien administra el
   proyecto—, «estar autenticado» y «estar autorizado» son la misma cosa
   aquí: no hizo falta una lista de UIDs aparte.

**Qué se hizo**

- `src/scripts/admin/firebase.js`: arranque de Firebase, **importado de forma
  DINÁMICA** desde `admin.astro` — misma convención que `animations.js` con
  GSAP/Lenis. El SDK completo pesa varias decenas de KB (medido: **~716 KB**
  repartidos en 4 chunks) y NO tiene por qué tocar la landing pública; solo
  se descarga en `/admin`, y solo tras cargar el HTML mínimo del login.
- `src/scripts/admin/asistentes.js`: lee la clave de Firestore, pagina la
  lista de Checkout Sessions de Stripe (`api.stripe.com` acepta CORS para
  llamadas de navegador con clave restringida — lo documenta el propio
  Stripe, por eso no hace falta backend para LEER), y normaliza cada sesión a
  `{ nombre, correo, teléfono, empresa, cantidad, importe, moneda, método,
  estado, fecha }`. `estado` sale de cruzar `session.status` y
  `payment_status`: `pagado` / `pendiente` / `pendiente_oxxo` / `fallido`.
- `src/pages/admin.astro`: reescrito. Máquina de tres estados en
  `[data-auth]` sobre `<main>` — `cargando` (único visible por defecto, sin
  flash) → `out` (login) → `in` (panel). Login con correo/contraseña,
  persistencia `browserLocalPersistence` (pidió sesión que sobreviva a
  recargar), botón de cerrar sesión, resumen de métricas, buscador,
  exportación CSV y tabla que se convierte en tarjetas apiladas bajo 46rem.
  El segmento de tema de la Fase 1 se conserva dentro de un `<details>`
  «Ajustes», sin tocar su lógica.
- `firestore.rules`: reglas para `config/stripe` (lectura con sesión válida,
  escritura siempre denegada) y todo lo demás cerrado por defecto.
- `.env.example`, `src/env.d.ts` y `.github/workflows/deploy.yml`: las
  cuatro variables públicas de configuración de Firebase (`apiKey`,
  `authDomain`, `projectId`, `appId`) viajan como `PUBLIC_*` — a propósito, y
  sin contradecir la decisión de arriba: **Firebase documenta que esos
  cuatro valores NO son secretos**, la seguridad la ponen las reglas de
  Auth/Firestore, no ocultar esos IDs. Es la Restricted Key de Stripe la que
  nunca debe ir en una `PUBLIC_*`, no cualquier config pública.

**Dependencia nueva (justificación exigida por la convención 7):** `firebase`
(SDK modular oficial). Es la única vía soportada para Auth + Firestore desde
el navegador sin escribir a mano el protocolo; se importa dinámicamente para
no pesar en la landing.

**Un bug real, encontrado por la propia convención 14 — «cerrar mirando, no
solo leyendo los asertos».** La primera versión pintaba la tabla y las
tarjetas con `element.innerHTML = ...` desde `asistentes.js`/el `<script>` de
`admin.astro`, y el `<style>` del componente les aplicaba `white-space:
nowrap`, padding y bordes con selectores normales (`.tabla td`,
`.tarjeta-asistente`, `.estado`...). Compilaba limpio y no había ningún
asertos que lo detectara. **En la captura, la tabla salía rota**: nombres
partidos en dos líneas, celdas de correo y teléfono pegadas sin espacio.
Es la misma trampa que ya documentó `Sede.astro` con su iframe (case 3 de la
convención 14): **un elemento inyectado por JS no lleva el atributo
`data-astro-cid-*` con el que Astro acota los estilos del componente**, así
que ninguna regla sin `:global()` le llega. Arreglo: todo lo que
`asistentes.js`/el script pintan en runtime (`td`, `tr`, `.estado`,
`.tarjeta-asistente` y sus descendientes) pasó a `:global()`, siguiendo el
mismo patrón que `.mapa__marco :global(.mapa__iframe)` de `Sede.astro`. De
paso, `.tabla-wrap` cambió de `overflow: hidden` (recortaba la tabla) a
`overflow-x: auto` (scroll horizontal solo si hace falta, sin romper el
layout de la página).

**Verificado con Playwright, contra el dev server real (Chromium 1228,
headless):**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run build` / `npm run check` | 0 errores, 0 avisos, 0 hints |
| Sin credenciales de Firebase (`.env` vacío) | cae con gracia a un mensaje legible, sin pantalla en blanco ni error de JS sin capturar — solo el error esperado de `firebase.js` en consola |
| Estado por defecto (`data-auth="cargando"`) | único visible al cargar, sin flash de login ni de datos |
| Login (1440 y 390px) | formulario legible, glassmorphism consistente con `Nav.astro` |
| Mensaje de error de login | texto claro, sin distinguir «no existe» de «contraseña mal» (evita enumeración de cuentas) |
| Dashboard con datos de prueba (1440 y 390px) | métricas, buscador, CSV y tabla/tarjetas correctos tras el arreglo de `:global()` |
| Tabla → tarjetas bajo 46rem | confirmado por captura, etiqueta:valor como pedía el encargo |
| Buscador (interacción real, evento `input`) | no revienta con caché vacía |
| Botón «Exportar CSV» (interacción real) | dispara una descarga con nombre `asistentes-expo-avicola-2026-AAAA-MM-DD.csv` |
| Ajustes → tema | segmento de la Fase 1 intacto, sin regresión |

**Nota aparte, no tocada en esta fase:** el repo `teccapitalweb/expo-avicola-
backend` (Railway) ya tiene acceso de servidor a Stripe vía su webhook —
podría exponer en el futuro un endpoint propio para esto, evitando que la
Restricted Key viaje al navegador aunque sea de un admin ya autenticado. No
se propuso como alternativa aquí porque el encargo pedía explícitamente
«llamada desde el navegador con clave restringida», pero queda anotado por si
una fase futura quiere cerrar esa última superficie.

---

#### Fase 8 — cierre: conexión con el proyecto Firebase real `expo-avicola-2026`

**El proyecto Firebase real se llama `expo-avicola-2026`, no `gymteck-1708f`.**
Esa referencia (en `.env.example`, `firestore.rules` y el comentario del
workflow) era de una sesión anterior y se corrigió en los tres archivos.

**Qué se hizo**

- `.env` local con las cuatro variables `PUBLIC_FIREBASE_*` del proyecto real
  (no se commitea, está en `.gitignore`).
- Los mismos cuatro valores se subieron como GitHub Secrets del repo
  (`Settings → Secrets and variables → Actions`), con autorización explícita
  del usuario antes de tocarlos.
- `firestore.rules` se publicó a mano en Firebase Console (el usuario lo
  confirmó con timestamp de publicación reciente).

**Verificación de la cadena completa — con una cuenta DESCARTABLE, no con
la del usuario.** El usuario no quiso pegar sus credenciales reales en el
chat (correcto: nunca deben viajar por aquí). En su lugar se acordó este
protocolo, que conviene repetir en futuras fases con Firebase:

1. Se creó una cuenta de prueba (`test-fase8-…@expo-avicola-2026.local`) vía
   la API pública `accounts:signUp` de Identity Toolkit — no hace falta el
   CLI de Firebase ni credenciales de servicio, la propia `apiKey` pública
   basta para registrar una cuenta cuando Email/Contraseña está habilitado.
2. Se verificó la cadena entera contra el dev server real con Playwright
   (Chromium headless, controlado por el agente, nunca por el usuario):
   login, lectura de `config/stripe`, llamada a Stripe, tabla, buscador y
   CSV — con la cuenta de prueba.
3. Al terminar, la cuenta de prueba se borró con `accounts:delete` (Identity
   Toolkit) y se confirmó que ya no puede iniciar sesión.
4. La verificación final con la cuenta REAL del usuario queda pendiente de
   que él la haga por su cuenta — nunca se pidió ni se recibió esa contraseña.

**Un bloqueo intermedio, y cómo se diagnosticó.** La primera lectura de
`config/stripe` con la cuenta de prueba autenticada devolvía 403
`PERMISSION_DENIED` — igual que sin autenticar. Antes de asumir que las reglas
estaban mal, se aisló la causa: un token basura daba un 401 distinto
(`ACCESS_TOKEN_TYPE_UNSUPPORTED`), lo que probaba que el token válido SÍ
llegaba a la capa de evaluación de reglas. Es decir, el fallo no estaba en el
transporte del token sino en las reglas mismas: no se habían publicado
todavía (se habían pegado pero no pulsado «Publicar»). Al republicarlas, la
misma prueba pasó al primer intento.

**Datos reales confirmados, no simulados:**

| Comprobación | Resultado |
| :--- | :--- |
| Sin login | formulario de login, sin flash de datos |
| Login con correo no autorizado | «Correo o contraseña incorrectos, o esta cuenta no tiene acceso.» — no distingue casos, evita enumeración |
| Login con cuenta de prueba autorizada | dashboard con **253 filas reales** de Stripe (paginado completo, `has_more` seguido hasta el final) |
| Métricas | 8 boletos vendidos, $3,583.00 de ingreso (solo cuenta lo `pagado`, como debía) |
| Compras de Juan (2 transacciones) | `qty: 2 × $699 = $1,398.00` cada una, con empresa («Comercializadora avícola de Izúcar») y teléfono — confirma que el Payment Link SÍ está capturando esos campos |
| Compra de $750 | **existe, pero en estado Fallido** (checkout abandonado) — no hay ninguna de $750 pagada |
| Buscador | filtra a las 2 filas de Juan sin tocar el resto |
| Exportar CSV | descarga con los datos reales completos, nombre `asistentes-expo-avicola-2026-AAAA-MM-DD.csv` |
| 360px | `scrollWidth` 360px exactos, tarjetas apiladas sin desbordamiento |
| Firestore sin sesión | 403 confirmado — la Restricted Key no es alcanzable sin login |

**Estado:** Fase 8 completada de punta a punta. `npm run build` y
`npm run check` en 0/0/0. La única verificación que queda —a propósito— es
que el usuario entre con su cuenta real, porque esa contraseña nunca debe
pasar por este chat.

---

#### Fase 8 — corrección: filtro por `price_id`, y un dato de esta misma bitácora que era falso

**La cuenta de Stripe es compartida con otros productos** (cursos, apps), y
`/admin` traía TODAS sus Checkout Sessions, sin filtrar por el boleto de la
expo. Se añadió el filtro en `asistentes.js`: antes de mostrar o contar una
fila, sus `line_items` deben incluir al menos uno cuyo `price.id` esté en
`PRICE_IDS_EXPO`. Las que no coinciden se descartan por completo — no se
ocultan con CSS ni se excluyen solo de las métricas, no llegan ni a
`asistentesCache`. `pintarMetricas` no cambió: ya calculaba sobre la lista que
recibe, así que al filtrar en el origen las métricas quedan correctas solas.

**`PRICE_IDS_EXPO` es un `Set` de DOS ids, no uno.** El boleto subió de $699 a
$750 y Stripe le asignó un `price_id` nuevo al producto
(`price_1TvLAJDCxZfVu3387HvuFJZZ`, el mismo que `PRICE_ID_WHITELIST` en
`expo-avicola-backend`). Filtrar solo por ese nuevo id borraba de la tabla las
ventas YA HECHAS a $699, que llevan el id viejo
(`price_1TueSWDCxZfVu338dH8YFKOK`). Ambos son y han sido siempre el boleto de
la expo; la lista cubre el precio de antes y el de ahora.

**Un dato de la entrada anterior de esta misma bitácora (arriba, «Compra de
$750… Compras de Juan…») estaba MAL, y este filtro lo destapó.** Al filtrar,
la sesión de $550 que se había reportado como «TEC CAPITAL, 1 boleto» **no es
del boleto de la expo**: es el pago de «Curso Cultivo y Manejo de Gerberas»
(otro producto, otro `price_id`, `price_1Trjn9DCxZfVu338dxN4ozjA`). TEC
CAPITAL tiene otra compra pagada además, de $79 («AviGo Pro»), tampoco de la
expo. **TEC CAPITAL no ha comprado ningún boleto de la expo.** El error de la
sesión anterior fue mirar el monto y el estado (pagado) sin comprobar a qué
producto pertenecía — exactamente el fallo que este filtro existe para
cerrar. Las únicas compras pagadas reales del boleto son las 2 de Juan.

**Verificado con datos reales, mismo protocolo de cuenta descartable de la
entrada anterior** (creada por `accounts:signUp`, verificada por Playwright
contra el dev server, borrada con `accounts:delete` al terminar — nunca con
la cuenta real del usuario):

| Comprobación | Resultado |
| :--- | :--- |
| Boletos vendidos | **4** (las 2 sesiones de Juan, qty 2 cada una) |
| Ingreso total | **$2,796.00** (2 × $1,398.00) |
| Filas de otros productos ($79 AviGo Pro, $300, $1,199, $550 Gerberas) en la tabla | **0** |
| Filas con `price_id` de la expo (viejo o nuevo), cualquier estado | 28 — incluye pagadas, pendientes y fallidas del boleto, correctamente |
| TEC CAPITAL en la tabla | **ausente** — no compró boleto, es lo correcto |

**Estado:** filtro cerrado y verificado. `npm run build` / `npm run check` en
0/0/0.

---

#### Fase 8 — tabla mínima para el registro en puerta + exportación a PDF

**Columnas quitadas de la tabla y de las tarjetas (bajo 46rem): Correo e
Importe.** El encargo pedía que la tabla mostrara solo lo necesario para
registrar a alguien en la puerta: nombre, teléfono, empresa/granja, boletos,
método, estado y fecha. Ni el correo ni el importe entran en esa lista — el
correo no se usa para identificar a nadie en persona, y el importe no aporta
nada al registro (ya se sabe que compró, y por cuánto no importa en la
puerta). **Las dos siguen en el CSV**, sin cambios: ese export sirve para
conciliación y contacto post-evento, un caso de uso distinto del registro en
puerta, y no se pidió tocarlo.

**Un hallazgo de paso, directamente relacionado con la columna Método:**
Stripe reportaba el método de pago de Juan como `link`, no `card`, y
`ETIQUETAS_METODO` no lo traducía — se veía «link» crudo en la tabla. `link`
es el autocompletado de tarjeta guardada de Stripe (Stripe Link): sigue
siendo un pago con tarjeta, no un tercer método. Se agregó `link: 'Tarjeta'`
al diccionario, en `admin.astro` y en `pdf.js` (llevan el mismo, duplicado a
mano — son solo 4 líneas y no vale la pena una importación cruzada por esto).

**Exportar PDF, con jsPDF + jspdf-autotable (dependencia nueva, convención
7).** Se evaluó `window.print()` con una hoja `@media print` y CERO
dependencias nuevas, pero el encargo pide una columna en blanco para marcar
«Asistió» a mano y un total al final — eso es maquetación de tabla con
paginación (saltos de página, repetir encabezado en cada hoja, anchos de
columna), que jspdf-autotable ya resuelve. Reimplementarlo a mano sobre CSS
de impresión habría sido reconstruir con más código lo que la librería ya
hace bien. Ambas se importan de forma DINÁMICA desde `pdf.js` (misma
convención que `firebase.js` y `animations.js`): no pesan nada hasta que se
pulsa «Descargar PDF».

**jsPDF trae `html2canvas` y `dompurify` como dependencias propias** (para su
método `.doc.html()`, que este proyecto no usa) y Vite los separa en chunks
propios: `html2canvas.js` (196 KB) y `purify.es.js` (28 KB). Antes de aceptar
el peso, se verificó con Playwright, con la red instrumentada, que esos dos
chunks **nunca se piden** — ni en `astro dev` ni contra el build de
producción real (`astro preview`) — porque el código de este proyecto solo
llama a `autoTable()` y `doc.save()`, nunca a `.html()`. Lo que sí se
descarga al pulsar el botón: `jspdf.es.min.js` (392 KB) +
`jspdf.plugin.autotable.js` (32 KB), solo en `/admin` y solo al usarse.

**Diseño del PDF — deliberadamente NO es el glassmorphism oscuro del panel.**
Fondo blanco, texto casi negro, tabla con tema `grid` de autoTable
(encabezado negro con texto blanco, filas alternadas gris claro/blanco) y
tipografía Helvetica (la que trae jsPDF por defecto): es lo que se lee bien
en papel impreso, que es el uso real de este documento — el panel se ve en
pantalla con luz de sala, el PDF se imprime y se usa con las manos en la
mesa de registro.

**Contenido:** encabezado «Expo Avícola Productiva 2026 / Lista de
asistentes», fecha y hora de generación, la tabla con las mismas columnas de
la pantalla + una columna «Asistió» siempre vacía (para marcar a mano el día
del evento), y un total al cierre (`Total de asistentes: N`, la suma de
`cantidad` de TODAS las filas de la tabla — no solo las pagadas, porque es el
mismo criterio que ya usa la tabla en pantalla y el CSV: exportar siempre la
lista completa, nunca el resultado del buscador).

**Verificado con datos reales** (mismo protocolo de cuenta descartable —
creada, usada, borrada — nunca con la cuenta real del usuario):

| Comprobación | Resultado |
| :--- | :--- |
| `npm run build` / `npm run check` | 0 errores, 0 avisos, 0 hints |
| Encabezados de la tabla en pantalla | `Nombre, Teléfono, Empresa/granja, Boletos, Método, Estado, Fecha` — Correo e Importe, fuera |
| Método de Juan | `Tarjeta` (antes `link` sin traducir) |
| `html2canvas.js` / `purify.es.js` solicitados, dev y preview | **0**, en ambos |
| PDF descargado | `asistentes-expo-avicola-2026-AAAA-MM-DD.pdf`, 48.5 KB |
| Contenido del PDF vs. tabla en pantalla | coincide fila por fila, incluidas las 2 de Juan (`Tarjeta`, `Pagado`) |
| Total del PDF | `Total de asistentes: 34` = suma de `Boletos` de las 22 filas listadas |
| Paginación del PDF | 2 páginas (Letter horizontal), encabezado de tabla repetido en la segunda |
| 360px, tema oscuro (panel) | sin desborde, tres controles (buscador/CSV/PDF) apilados correctamente |

**Estado:** completado y verificado, incluyendo la vista previa del PDF
generado (convención 14 — se abrió y se leyó el documento, no solo se
comprobó que el archivo existiera).

---

### Vuelta a 6 ponencias — Esteban toma Vacunación, Edgar se queda con Diagnóstico

El organizador de la agenda confirmó un cambio de temas: **Esteban ya no
tiene tema propio** («Detrás de la vacuna» se retira) y en su lugar toma
«Vacunación y prevención», que antes era la segunda sesión de Edgar. Edgar
se queda con una sola ponencia. La agenda vuelve a **6 ponencias de 35
minutos**, deshaciendo el recorte a 30 min que documenta la entrada «La
séptima ponencia y el reparto 4+3».

**El itinerario original se sacó de git, no de memoria.** `git show
02bf1dc~1:src/data/programa.json` —el commit padre de «Mete la séptima
ponencia sin mover el final del día»— tiene el `programa.json` de 6×35
exacto, con `notaDuracion` original («30 minutos de exposición y 5 de
preguntas»). Se restauró ese archivo completo y se cambió una sola línea: el
`ponente` de «Vacunación y prevención» pasa de Edgar a Esteban. El resto de
horas y orden (3 ponencias + coffee + show + 3 ponencias, sin el reparto
4+3 que solo existió para acomodar la séptima) es idéntico al de antes de
que existiera Esteban con tema propio.

**Qué se tocó, y qué no:**

- `programa.json`: restaurado desde git + el swap de ponente. `notaDuracion`
  vuelve al texto original, no a una aproximación.
- `hero-ponentes.json`: el `tema` de Esteban cambia a «Vacunación y
  prevención». El de Edgar no tocó nada porque ya solo decía «Diagnóstico
  temprano en aves» — nunca llegó a mencionar la segunda ponencia.
- `ponentes.json`, ficha de Esteban: `ponencias`, `enfoque` y `queSeLleva`
  reescritos para el tema nuevo, **texto revisado y aprobado por el cliente
  antes de escribirse** (se mostró el borrador, no se asumió). Mantiene su
  diferencial —viene del laboratorio de control de calidad, no de la
  caseta— porque es lo que lo distingue de los demás ponentes y sigue
  siendo cierto sin importar el tema.
- `ponentes.json`, ficha de Edgar: `ponencias` baja a una. `bioCorta` y
  `enfoque` mencionaban vacunación explícitamente (era, literalmente, el
  tema de su segunda charla) y se reescribieron para hablar solo de
  diagnóstico temprano. `queSeLleva` se dejó igual: no nombra vacunación ni
  las dos ponencias, y su contenido —«las decisiones que están en manos del
  productor»— aplica igual de bien al diagnóstico temprano.
- `boletos.json`: `descripcion` (texto plano, espejo de Stripe) vuelve a
  decir «6 conferencias». **Sin querer, esto resuelve también el pendiente
  16** («Stripe sigue diciendo 6 y boletos.json decía 7»): con la agenda de
  vuelta a 6, las dos fuentes vuelven a coincidir solas.
- `schema.js`: **cero cambios de lógica.** `ponentes()` y `sesiones()` ya
  derivaban todo de `programa.json` + `hero-ponentes.json`; el JSON-LD
  compilado pasó solo de tener 7 a 6 `performer`/`subEvent` porque los datos
  cambiaron, no el código. Se actualizaron tres comentarios que hablaban de
  «Edgar da dos sesiones» y «Esteban sin horario asignado», que dejaron de
  ser ciertos.
- `Programa.astro`, `VideoSection.astro`, `faq.json`: **nada que tocar.**
  Usan `{conferencias}`/`{conferenciasPalabra}` vía `programa.js`
  (`totalConferencias()`), así que pasaron de decir «siete»/7 a «seis»/6
  solos, en el siguiente build.

**Búsqueda de menciones sueltas** (`grep -i` de «7 conferencias», «Detrás de
la vacuna» y «siete ponencias» en `src/`): el único texto vivo que apareció,
fuera de lo ya listado arriba, fue la propia `descripcion` de `boletos.json`.
El resto de coincidencias estaban en esta misma bitácora, documentando la
decisión anterior — se dejaron intactas porque son historia real, no
contenido que se esté mostrando hoy.

**Verificado:**

| Comprobación | Resultado |
| :--- | :--- |
| `npm run build` / `npm run check` | 0 errores, 0 avisos, 0 hints |
| Parrilla 08:00–16:30 | sin huecos ni encimes, verificado con script, idéntica a la de antes de la séptima ponencia |
| JSON-LD compilado (`dist/index.html`) | **6** `performer`, **6** `subEvent`, la sesión de Vacunación con `performer: IBQ. Esteban Fructuoso Alducin` |
| Tarjeta de Edgar (Ponentes) | una sola ponencia, «Diagnóstico temprano en aves» |
| Tarjeta de Esteban (Ponentes) | «Vacunación y prevención: decisiones sanitarias que protegen la producción» |
| Modal de Edgar | ficha completa reescrita, sin mención a vacunación |
| Modal de Esteban | ficha completa reescrita, mismo perfil de laboratorio |
| Lead de Programa.astro | «seis conferencias de 30 minutos» — autoderivado |
| `boletos.incluye[0]` | «Acceso a las 6 conferencias especializadas» — autoderivado |
| Capturas 1440/390, verde y azul | sin desborde horizontal, revisadas con `prefers-reduced-motion` para ver la parrilla completa sin esperar el reveal por scroll |

**Estado:** cerrado. La cifra «6» no quedó escrita a mano en ningún sitio
nuevo — donde ya existía la derivación de la Fase de la séptima ponencia
(`programa.js`), se benefició de ella; donde no existía (`boletos.json`,
`ponentes.json`), se editó a mano porque son, por diseño, texto plano o
contenido editorial que no se deriva de nada.
