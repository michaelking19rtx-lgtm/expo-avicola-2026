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
│   │   ├── {Nav,Hero,VideoSection}.astro
│   │   ├── {Pilares,Programa,ParaQuien,Boletos}.astro
│   │   └── {Sede,Patrocinadores,Faq,CtaFinal,Footer}.astro
│   ├── data/{site,navegacion,programa,boletos,patrocinadores,faq,hero-ponentes}.json
│   ├── env.d.ts
│   ├── layouts/Base.astro
│   ├── pages/{index,admin,404}.astro
│   ├── scripts/{theme,animations,paths,fechas,schema}.js
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

> **Nota sobre las convenciones 11, 12 y 13.** Son la misma falla con distinto
> disfraz: un número que parece evidencia sin serlo. **11** = cifra escrita sin
> medir. **12** = medida contra datos que otro proceso cambió. **13** = medida
> correcta pero comparando dos elementos distintos. Ante cualquier número que
> justifique una decisión, verificar cuál de los tres casos podría estar
> ocurriendo.

## 6. Roadmap

| Fase | Alcance                                                                  | Estado         |
| :--- | :----------------------------------------------------------------------- | :------------- |
| 1    | Cimientos: arquitectura, doble tema, `/admin` mínimo, deploy              | **COMPLETADA** |
| 2    | Nav + hero + sección de video, con capa de movimiento (GSAP, Lenis)      | **COMPLETADA** |
| 2b   | Hero rediseñado: abanico de figuras individuales de ponentes              | **COMPLETADA** |
| 2c   | Seis figuras en dos rangos, figura 78% más grande, entrada desacoplada    | **COMPLETADA** |
| 3    | Ponentes: fichas con foto, cargo y sesión                                 | **POSPUESTA**  |
| 4    | Pilares + programa/agenda + ¿Para quién es?                               | **COMPLETADA** |
| 5    | Boletos: precio, qué incluye, CTA de registro                             | **COMPLETADA** |
| 6    | Sede, patrocinadores, FAQ, CTA final y footer                             | **COMPLETADA** |
| 7    | SEO técnico, datos estructurados, indexación y rendimiento                | **COMPLETADA** |
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

### Anclas de navegación que no llevan a ningún sitio · CASI CERRADO

Estado tras la Fase 6:

| Ancla        | Enlaces | ¿Existe el destino? |
| :----------- | ------: | :------------------ |
| `#programa`  |       4 | **SÍ** — Fase 4 |
| `#boletos`   |       7 | **SÍ** — Fase 5 |
| `#sede`      |       3 | **SÍ** — Fase 6 |
| `#contenido` |       1 | **SÍ** — el `<main>` |
| `#ponentes`  |       3 | **NO** — Fase 3, pospuesta |

De 18 enlaces ancla, **solo 3 siguen muertos y los tres van a `#ponentes`**:
nav de escritorio, menú móvil y footer. El footer añadió uno más porque sirve
los mismos enlaces que la nav (`src/data/navegacion.json`); es el precio de que
las dos listas no puedan desincronizarse.

Los 15 vivos se verificaron con clic real: todos aterrizan a 161px con la barra
acabando en 73px, ninguno queda tapado. El enlace «Saltar al contenido» deja el
primer texto del hero a 156px, también libre.

`id` reales hoy en la home: `#inicio`, `#congreso`, `#pilares`, `#programa`,
`#para-quien`, `#boletos`, `#sede`, `#patrocinadores`, `#faq`, `#contenido` y
`#menu-movil`.

**Esta entrada se cierra al construir la Fase 3.** Mientras tanto, la opción
barata si molesta es quitar «Ponentes» de `navegacion.json`: desaparece de la
nav, del menú y del footer a la vez.

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
| 4 | **Correo** de contacto | `site.contacto.correo` | «Próximamente» en el footer |
| 5 | **Teléfono** | `site.contacto.telefono` | «Próximamente» en el footer |
| 6 | **WhatsApp** | `site.contacto.whatsapp` | «Próximamente» en el footer; el aviso de Boletos no promete WhatsApp |
| 7 | **Logos** de patrocinadores | `public/img/patrocinadores/{avipork,prosermat}.png` | Marco punteado con el nombre en display |
| 8 | **Fotos de ponentes** | `public/img/ponentes/` | Bloquea la Fase 3 entera. Las 3 del hero ya están; faltan las de las fichas |
| ~~9~~ | ~~**Imagen del hero**~~ | ~~`public/img/hero/ponentes.png`~~ | **RESUELTO y luego SUSTITUIDO** — la grupal se retiró en la Fase 2b; hoy son 3 figuras individuales |
| ~~9b~~ | ~~**Nombre real de UNA figura del hero**~~ | ~~`hero-ponentes.json`~~ | **RESUELTO** — Ing. Ricardo Olmos Rivera. Con él se retiró el `noindex` |
| ~~9c~~ | ~~**Las otras 3 figuras del hero**~~ | ~~`public/img/hero/ponente-0{4,5,6}.webp`~~ | **RESUELTO** — entregadas e integradas en la Fase 2c |
| 10 | **Video del congreso** | `public/video/congreso.{mp4,webm}` + `poster-congreso.jpg` | Placeholder 16:9 con botón de play |
| ~~11~~ | ~~**Ponente de la sesión de IA**~~ | ~~`programa.json`, bloque 13:10~~ | **RESUELTO** — Ing. Ricardo Olmos Rivera |
| ~~15~~ | ~~**Hueco en la agenda para la 7ª ponencia**~~ | ~~`programa.json`~~ | **RESUELTO** — 13:15, con el reparto 4+3 a 30 min |
| 16 | **Actualizar la descripción del producto en STRIPE** | panel de Stripe, fuera del repo | `boletos.json` ya dice «7 conferencias»; **Stripe sigue diciendo 6**. Lo tiene que editar una persona |
| ~~12~~ | ~~**Stripe**: producto, precio y checkout~~ | ~~`boletos.json`~~ | **RESUELTO** — Payment Link conectado en `checkoutUrl` |
| 13 | **Aviso de privacidad** | página `/privacidad` + enlace en `Footer.astro` | Texto plano «Aviso de privacidad · Próximamente» |
| 14 | **Imagen Open Graph** 1200×630 | `public/img/og/og-expo-avicola.jpg` | Las etiquetas `og:image`/`twitter:image` ya apuntan ahí; al compartir el enlace la tarjeta sale sin imagen |

El que más pesa ahora es el **16**, porque lo ve quien está pagando: la página
promete siete conferencias y la pantalla de Stripe, a un clic de distancia,
sigue prometiendo seis. El 8 sigue bloqueando la Fase 3.

### La séptima ponencia · CERRADO · las 7 sesiones están en la agenda

`programa.json` tiene ya **7 ponencias para 7 ponentes**. La de Esteban entra a
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
| `public/video/congreso.mp4` y `.webm` | Video de la sección "El congreso" | Sustituir el bloque `.intro__placeholder` por el marcado ya escrito en el comentario de `VideoSection.astro`. |
| `public/img/hero/poster-congreso.jpg` | Póster del video | Mismo 16:9 del reproductor. |

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

- **Barra de compra fija.** Se propuso y se descartó de momento: se come ~56px
  de un viewport de 800 y compite con el CTA del hero durante todo el scroll.
  Primero el arreglo 3, y ya cumple el objetivo —precio y botón en pantalla—,
  así que la barra no hace falta hoy. Si se retoma: `IntersectionObserver`
  sobre hero y boletos (no listeners de scroll, para no tocar Lenis),
  `visualViewport` para esconderla con el teclado abierto, reserva de hueco con
  `padding-block-end` en el `body` y `env(safe-area-inset-bottom)`.
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

**LA AGENDA SIGUE CON 6 SESIONES Y HAY 7 PONENTES.** No se tocó ningún horario:
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
cubre con los siete ponentes presentes. Es un aviso a los ponentes, no una
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

`.gitignore` bloquea `public/img/**/*.{png,jpg,jpeg,tif,tiff,psd}` para que no
vuelva a colarse un original sin optimizar. Comprobado creando un `.png` de
prueba: git lo ignora. **Al repo solo entran los archivos ya servibles.**

> **Cómo regenerar el WebP si hace falta:** no hay herramienta de imagen en el
> proyecto ni se añadió ninguna dependencia. La conversión se hizo conduciendo
> Chrome headless por CDP y volcando `canvas.toDataURL('image/webp', 0.90)` a
> disco. Si mañana hace falta otro tamaño, o se repite ese método, o se usa
> `astro:assets` moviendo el original a `src/assets/` (que además generaría el
> `srcset` responsive solo).
