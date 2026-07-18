// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages: https://michaelking19rtx-lgtm.github.io/expo-avicola-2026
  site: 'https://michaelking19rtx-lgtm.github.io',
  base: '/expo-avicola-2026',

  // Salida 100% estática (sin adaptador ni SSR).
  output: 'static',
  trailingSlash: 'ignore',

  build: {
    format: 'directory',
  },

  integrations: [
    /*
      El sitemap toma `site` + `base` de esta misma config, así que las URLs
      salen ya con el subpath /expo-avicola-2026. No hay que construirlas a mano.
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
