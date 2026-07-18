// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

/* ===========================================================================
   GUARDIÁN DE ASSETS DE public/img/

   Nace de un fallo real: `.gitignore` bloqueaba png/jpg/jpeg bajo public/img/
   para que no entrara un original de varios MB, y de paso escondía los
   entregables finales. Seis retratos de ponentes llevaban tiempo en disco,
   dentro de la carpeta que se sirve, invisibles para git y sin un solo aviso.
   El runner compila solo lo commiteado: se habrían visto en local y faltado
   en producción.

   Al levantar el bloqueo hay que cubrir las dos caras del problema, y las dos
   con AVISO, nunca con excepción: un build que revienta por una imagen pesada
   sería peor que el problema que resuelve.

     1. ¿Hay algo servible que git esté ignorando?  → invisible, el fallo viejo
     2. ¿Hay algo servible que pese de más?         → probablemente un original

   El umbral son 400 KB. Referencia medida en este repo: las seis figuras del
   hero pesan entre 26 y 68 KB ya optimizadas, y los retratos sin convertir
   rondan los 2.3 MB. 400 KB deja holgura de sobra a un entregable legítimo
   —una imagen Open Graph de 1200x630 no llega— y caza cualquier original.
   ======================================================================== */
const SERVIBLES = ['.webp', '.png', '.jpg', '.jpeg', '.svg', '.avif', '.gif'];
const PESO_MAXIMO = 400 * 1024;

/**
 * Lista recursiva de archivos, con rutas relativas a `raiz` y separador `/`.
 *
 * @param {string} dir Carpeta a recorrer.
 * @param {string} [raiz] Carpeta contra la que se relativizan las rutas.
 * @returns {string[]}
 */
function listarArchivos(dir, raiz = dir) {
  /** @type {string[]} */
  const salida = [];
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return salida; // la carpeta no existe: nada que revisar
  }
  for (const e of entradas) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) salida.push(...listarArchivos(ruta, raiz));
    else salida.push(relative(raiz, ruta).split('\\').join('/'));
  }
  return salida;
}

function avisaDeAssetsDePublic() {
  const RAIZ = 'public/img';
  const archivos = listarArchivos(RAIZ).filter((f) =>
    SERVIBLES.includes(extname(f).toLowerCase())
  );
  if (!archivos.length) return;

  // --- 1. ¿git ignora alguno? ------------------------------------------
  let ignorados = [];
  try {
    /*
      `--no-index` es imprescindible: SIN él, `check-ignore` omite los
      archivos ya rastreados y solo evalúa los que no lo están. Costó
      encontrarlo — la primera versión del guardián parecía no funcionar
      porque se probó contra los WebP del hero, que ya estaban commiteados y
      por eso quedaban fuera del informe. Con `--no-index` se evalúan las
      reglas tal cual, que es lo que aquí interesa.

      `check-ignore` sale con código 1 cuando NINGUNO está ignorado, que aquí
      es el caso bueno. execFileSync lo trata como error, de ahí el catch que
      lee el stdout igualmente.
    */
    const salida = execFileSync(
      'git',
      ['check-ignore', '--no-index', '--', ...archivos.map((f) => `${RAIZ}/${f}`)],
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    ignorados = salida.split('\n').filter(Boolean);
  } catch (error) {
    const salida = /** @type {{stdout?: string}} */ (error)?.stdout ?? '';
    ignorados = String(salida).split('\n').filter(Boolean);
    // Sin git disponible (o sin repo) no hay nada que comprobar: se calla.
  }

  if (ignorados.length) {
    console.warn(
      `\n[assets] ${ignorados.length} archivo(s) servibles de ${RAIZ}/ están IGNORADOS por git.\n` +
        `          Se ven en local y FALTARÁN en producción: el runner compila solo lo commiteado.\n` +
        ignorados.map((f) => `            · ${f}`).join('\n') +
        `\n          Revisa .gitignore con: git check-ignore -v <ruta>\n`
    );
  }

  // --- 2. ¿alguno pesa de más? -----------------------------------------
  const pesados = archivos
    .map((f) => ({ f, bytes: statSync(join(RAIZ, f)).size }))
    .filter((x) => x.bytes > PESO_MAXIMO)
    .sort((a, b) => b.bytes - a.bytes);

  if (pesados.length) {
    console.warn(
      `\n[assets] ${pesados.length} archivo(s) de ${RAIZ}/ pasan de ${Math.round(PESO_MAXIMO / 1024)} KB.\n` +
        `          Si son originales sin optimizar, su sitio es la carpeta hermana\n` +
        `          ../expo-avicola-2026-assets-originales/, no el repo: un binario\n` +
        `          grande commiteado se queda en el historial para siempre.\n` +
        pesados
          .map((x) => `            · ${x.f} — ${(x.bytes / 1024 / 1024).toFixed(2)} MB`)
          .join('\n') +
        '\n'
    );
  }
}

/** Integración mínima: engancha el guardián al arranque del build. */
function guardianDeAssets() {
  return {
    name: 'guardian-de-assets',
    hooks: {
      'astro:build:start': () => avisaDeAssetsDePublic(),
    },
  };
}

// https://astro.build/config
export default defineConfig({
  /*
    DOMINIO PROPIO. El sitio vivió bajo el subpath /expo-avicola-2026 en
    michaelking19rtx-lgtm.github.io hasta que se configuró el dominio; ahora
    cuelga de la RAÍZ de expo.visionpecuariamx.com.

    `base: '/'` es lo que hace que `asset()` y el sitemap dejen de prefijar el
    subpath. Como ninguna ruta del proyecto está escrita a mano (convención 9),
    cambiar estas dos líneas basta.

    QUIÉN SOSTIENE EL DOMINIO. No es `public/CNAME`: lo sostiene el ajuste
    Custom domain de Settings → Pages, del lado de GitHub.

    Este repo publica por WORKFLOW (`withastro/action` sube un artefacto y
    `actions/deploy-pages` lo despliega), no desde una rama. En ese modo la
    documentación de GitHub es explícita: no se crea ningún CNAME y el que
    haya en el artefacto se ignora. El archivo `CNAME` solo manda cuando se
    publica DESDE UNA RAMA, que es de donde viene la costumbre de ponerlo.

    `public/CNAME` se conserva igualmente: cuesta 26 bytes y es el seguro si
    algún día se vuelve a publicación por rama. Pero que nadie lo lea como
    «el dominio está asegurado desde el repo», porque no lo está.
  */
  site: 'https://expo.visionpecuariamx.com',
  base: '/',

  // Salida 100% estática (sin adaptador ni SSR).
  output: 'static',
  trailingSlash: 'ignore',

  build: {
    format: 'directory',
  },

  integrations: [
    guardianDeAssets(),

    /*
      El sitemap toma `site` + `base` de esta misma config, así que las URLs
      se derivan solas. No hay que construirlas a mano — y por eso el paso a
      dominio propio no obligó a tocar ni una URL del sitemap.
    */
    sitemap({
      /*
        Solo la landing entra al índice.

        - `/404`: es una página de error, no contenido. La integración no la
          excluye sola; para Astro es una ruta estática más.
        - `/admin`: es el panel interno. Aparecer en el sitemap es literalmente
          invitar a Google a rastrearlo. Ambas llevan además `noindex`, porque
          quedar fuera del sitemap no impide que un buscador las encuentre por
          otro camino.
      */
      filter: (page) => !/\/(404|admin)\/?$/.test(page),
      changefreq: 'monthly',
    }),
  ],
});
