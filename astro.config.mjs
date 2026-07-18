// @ts-check
import { defineConfig } from 'astro/config';

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
});
