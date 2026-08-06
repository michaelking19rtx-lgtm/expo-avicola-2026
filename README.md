# Expo Avícola Productiva 2026

Landing estática del evento **Expo Avícola Productiva 2026**.

- **Fecha:** 7 de agosto de 2026
- **Sede:** Tehuacán, Puebla
- **Producción:** https://expo.visionpecuariamx.com

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

> El sitio se sirve desde la raíz, así que en local abre
> `http://localhost:4321/`.

## Temas

El sitio tiene dos temas: **verde** (por defecto) y **azul**. Viven en el
atributo `data-theme` de `<html>` y se persisten en `localStorage` bajo la clave
`expo-theme`.

Para cambiarlo: `/admin`. Esa es la única página que carga `theme.js`, así que
`setTheme('blue')` desde la consola solo funciona estando en `/admin`. El resto
del sitio no lleva JS de módulo: solo el script inline que aplica el tema.

## Paneles privados

- `/admin/`: ventas pagadas, pendientes y fallidas obtenidas desde Stripe,
  métricas y exportaciones CSV/PDF.
- `/asistencia/`: combina las compras pagadas con la lista manual guardada en
  Firestore y permite registrar llegadas en tiempo real desde varios equipos.

Los dos paneles usan Firebase Auth, pero una sesión por sí sola no autoriza.
Cada cuenta administrativa debe tener un documento `admins/{uid}` con
`activo: true`. Las reglas de `firestore.rules` deben publicarse manualmente en
Firebase antes de usar el control de asistencia.

## Estructura

```text
public/
  img/{ponentes,hero,patrocinadores,og}/
  video/
  favicon.svg
src/
  components/          # secciones de la landing
  data/                 # contenido estructurado del evento
  layouts/Base.astro   # <html>, head, anti-FOUC del tema
  pages/               # index, agenda, admin, asistencia y 404
  scripts/admin/       # Firebase, Stripe, autorización y asistencia
  styles/              # tokens, estilos globales y de asistencia
```

Antes de tocar el proyecto, lee [`CLAUDE.md`](./CLAUDE.md): contiene las
convenciones de diseño obligatorias y el estado de cada fase.
