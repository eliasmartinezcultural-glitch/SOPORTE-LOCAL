# Publicación segura de CHÁÑAR A MANO

## Regla principal

La rama de trabajo no es la página pública. Los cambios se desarrollan y guardan en una rama separada; la página pública recibe únicamente cambios revisados e incorporados a la rama que GitHub Pages tenga configurada como fuente.

## Fuente de publicación prevista

Para este repositorio está previsto publicar desde:

- Plataforma: GitHub Pages
- Método: Deploy from a branch
- Rama: `main`
- Carpeta: `/(root)`

**Esta configuración debe comprobarse en GitHub → Settings → Pages.** No se debe dar por hecho que está activa hasta verla allí. Si GitHub Pages utiliza otra rama o carpeta, hay que adaptar este procedimiento a esa fuente real antes de anunciar una publicación.

## Flujo obligatorio de cada mejora

1. Partir de la rama de trabajo vigente, nunca editar la rama congelada `base-estable-2026-11-19`.
2. Trabajar en una rama identificable, por ejemplo `publicacion-segura-AAAA-MM-DD`.
3. Antes de reemplazar un archivo, leer su versión actual y usar su SHA actual.
4. Guardar cada cambio como commit en GitHub. No considerar guardado un cambio que solo exista en el editor o en una conversación.
5. Abrir un Pull Request hacia `main`.
6. Esperar que el control automático **Validar Chañar a Mano** termine correctamente.
7. Revisar el resumen de archivos modificados y comprobar que `datos.js` no cambió si la tarea no incluía cambios editoriales.
8. Incorporar el Pull Request a `main` solo después de revisar la vista previa y aprobar el resultado.
9. Esperar la publicación de GitHub Pages y abrir la URL pública para comprobar que muestra el cambio.
10. Si la web no refleja el commit incorporado, revisar Settings → Pages y el estado de publicación antes de seguir modificando código.

## Qué controla la validación automática

- Sintaxis de `app.js` y `datos.js`.
- Existencia de los archivos principales.
- Referencias locales a CSS y JavaScript.
- IDs HTML duplicados.
- IDs duplicados en las fichas.
- Campos esenciales de cada ficha y procedencia reconocida.
- URLs de fuentes con protocolo HTTP o HTTPS.
- Ausencia de enlaces automáticos `tel:`, `mailto:` y protocolo `javascript:`.

La validación no comprueba que un teléfono siga vigente, que una institución exista hoy, que una fotografía tenga permiso de reutilización ni que el diseño se vea bien en todos los dispositivos. Esas verificaciones requieren revisión humana y pruebas en la página publicada.

## Recuperación

- La rama congelada `base-estable-2026-11-19` se conserva como referencia.
- Si una mejora rompe el sitio, revertir el Pull Request problemático o restaurar el último commit estable de `main`.
- No borrar ni reescribir la rama congelada para resolver errores.
- Registrar cada publicación con su commit y enlace al Pull Request.

## Estado inicial de esta configuración

La automatización de validación se incorpora en esta rama. La fuente efectiva de GitHub Pages y la publicación final deben confirmarse en los ajustes del repositorio; no se cambia la configuración de Pages desde esta rama.
