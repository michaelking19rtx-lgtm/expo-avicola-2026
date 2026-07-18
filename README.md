# Expo Avícola Productiva 2026

Landing estática del evento **Expo Avícola Productiva 2026**.

- **Fecha:** 7 de agosto de 2026
- **Sede:** Tehuacán, Puebla
- **Producción:** _pendiente de publicar_ → será https://michaelking19.github.io/expo-avicola-2026

## Stack

- [Astro](https://astro.build) 7 — salida 100% estática, sin adaptador.
- Sin librerías de UI. CSS propio sobre variables (`src/styles/tokens.css`).
- Fuentes vía `@fontsource-variable`: **Bricolage Grotesque** (display) e **Inter** (cuerpo).
- Despliegue automático a GitHub Pages en cada push a `main`.

## Comandos

| Comando             | Acción                                    |
| :------------------ | :---------------------------------------- |
| `npm install`       | Instala dependencias                      |
| `npm run dev`       | Servidor local en `localhost:4321`        |
| `npm run build`     | Compila el sitio a `./dist/`              |
| `npm run preview`   | Previsualiza el build local               |
| `npm run astro ...` | CLI de Astro (`astro add`, `astro check`) |

> El sitio se sirve bajo el subpath `/expo-avicola-2026`, así que en local abre
> `http://localhost:4321/expo-avicola-2026/`.

## Temas

El sitio tiene dos temas: **verde** (por defecto) y **azul**. Viven en el
atributo `data-theme` de `<html>` y se persisten en `localStorage` bajo la clave
`expo-theme`.

Para cambiarlo: `/admin`. Esa es la única página que carga `theme.js`, así que
`setTheme('blue')` desde la consola solo funciona estando en `/admin`. El resto
del sitio no lleva JS de módulo: solo el script inline que aplica el tema.

## Estructura

```text
public/
  img/{ponentes,hero,patrocinadores,og}/
  video/
  favicon.svg
src/
  components/          # vacío en Fase 1
  data/site.json       # datos del evento
  layouts/Base.astro   # <html>, head, anti-FOUC del tema
  pages/               # index.astro, admin.astro
  scripts/theme.js     # setTheme / getTheme / toggleTheme
  styles/              # tokens.css (variables), global.css (reset + bases)
```

Antes de tocar el proyecto, lee [`CLAUDE.md`](./CLAUDE.md): contiene las
convenciones de diseño obligatorias y el estado de cada fase.
