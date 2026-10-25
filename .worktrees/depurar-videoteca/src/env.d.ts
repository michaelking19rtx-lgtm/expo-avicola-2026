/// <reference types="astro/client" />

// Los paquetes de @fontsource-variable son CSS puro y no traen tipos.
// Se importan solo por su efecto secundario (inyectar las @font-face).
declare module '@fontsource-variable/*';

// Config pública de Firebase para /admin (Fase 8). Ver .env.example: no son
// secretas, pero sin ellas Firebase no puede inicializarse.
interface ImportMetaEnv {
  readonly PUBLIC_FIREBASE_API_KEY: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly PUBLIC_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
