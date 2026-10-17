# Expo Avícola Productiva 2026

Instrucciones compartidas para Codex y Claude Code. La documentación histórica íntegra, incluidas las 17 convenciones con sus motivos y la bitácora original, está en `docs/historial-contexto-2026.md`. Consúltala por sección cuando resulte relevante; no la importes completa al iniciar.

## Proyecto y comandos

- Sitio Astro 7 estático para la Expo Avícola Productiva del 7 de agosto de 2026. URL pública: `https://expo.visionpecuariamx.com/`. Al editar contenido comercial o fechas, comprobar el estado vigente: el evento ya pasó.
- Instalar con `npm ci`; comprobar con `npm run check` y `npm run build`.
- CSS propio; no añadir Tailwind, Bootstrap ni librerías de UI sin justificación. Tokens y temas en `src/styles/tokens.css`; estilos globales en `src/styles/global.css`.
- GSAP y Lenis se cargan dinámicamente desde `src/scripts/animations.js`. La navegación y el contenido esenciales deben funcionar sin ese chunk.
- Publicación en GitHub Pages mediante `.github/workflows/deploy.yml`, con `base: '/'` y dominio configurado en Settings → Pages. `public/CNAME` no sostiene el dominio cuando se publica mediante el workflow.

## Reglas activas

- Conservar la estética editorial oscura, jerarquía tipográfica clara y espacio generoso. El texto visible va en español de México (`lang="es-MX"`). No usar emojis como iconos de interfaz; usar SVG accesible.
- Usar variables semánticas de CSS para colores y tiempos. Si un bloque remapea `--text`, declarar también `color: var(--text)` dentro de ese bloque; la herencia no vuelve a evaluar la variable del padre.
- Mantener HTML semántico, contraste AA, foco visible, navegación por teclado y `prefers-reduced-motion`. Verificar interacciones con y sin JavaScript cuando ambos modos existan.
- Si un control se personaliza en vez de usar el nativo, reproducir correctamente su interacción por teclado, estados y etiquetas accesibles.
- Toda modificación visual requiere inspección real a tamaños móvil y escritorio. Los asertos de DOM no prueban apariencia ni detectan solapamientos.
- Los elementos creados con JavaScript no reciben automáticamente el atributo `data-astro-cid-*`; sus estilos de componente pueden requerir `:global()`.
- Las rutas a recursos de `public/` deben respetar `import.meta.env.BASE_URL`; no introducir rutas absolutas sin comprobar la configuración del sitio.
- No escribir cifras de rendimiento sin medirlas en la sesión y señalar qué elemento o causa mide cada comparación. Si cambia el candidato LCP, no comparar los números como si fueran el mismo elemento.
- Antes de un commit, revisar `git status` y el diff completo. Preservar cambios existentes y no incluir temporales, secretos ni archivos grandes sin necesidad.
- No permitir que agentes de revisión alteren el árbol de trabajo mientras se trabaja en él. Las pruebas mutantes van en un worktree aislado.
- Si se agregan dependencias, explicar por qué y verificar su impacto. Las decisiones extensas se registran en `docs/`, no aquí.

## Áreas útiles

- `src/components/`: secciones de la página.
- `src/data/`: contenido estructurado del sitio.
- `src/scripts/admin/` y `src/pages/admin.astro`: administración; no asumir que el entorno externo está configurado solo porque el build funciona.
- `public/img/` y `public/video/`: medios publicados. No subir fuentes originales ni duplicados innecesarios.
- `docs/historial-contexto-2026.md`: referencias y decisiones previas, algunas ya superadas. Confirmar vigencia contra el código actual.
