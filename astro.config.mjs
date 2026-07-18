// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
