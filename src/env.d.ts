/// <reference types="astro/client" />

// Los paquetes de @fontsource-variable son CSS puro y no traen tipos.
// Se importan solo por su efecto secundario (inyectar las @font-face).
declare module '@fontsource-variable/*';
