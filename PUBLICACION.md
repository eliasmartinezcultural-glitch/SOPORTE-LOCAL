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


## Revisión documental de contactos

La guía distingue entre un dato publicado por una fuente oficial, una agenda provincial, un directorio institucional y una referencia secundaria. Esa clasificación indica la procedencia, no garantiza que el teléfono responda ni reemplaza una confirmación directa.

Cada ficha con teléfono o correo debe conservar un estado de respaldo visible. Los números repetidos entre instituciones y los datos que aparecen distintos en fuentes diferentes deben quedar señalados como pendientes, sin elegir arbitrariamente cuál es correcto.

Antes de publicar una corrección:
1. Consultar primero la página oficial del organismo o establecimiento.
2. Comparar con directorios provinciales o institucionales cuando no exista página propia.
3. Si hay discrepancias, conservar el dato de la fuente oficial y mostrar una advertencia hasta obtener confirmación directa.
4. No sumar números encontrados únicamente en resultados de mapas o directorios comerciales como si fueran contactos confirmados.
5. Registrar fecha y fuente consultada en el historial de revisión del proyecto.
6. No considerar una dirección de mapa como prueba de teléfono, horario o funcionamiento.

La validación automática comprueba que cada contacto tenga una clasificación documental; no realiza llamadas ni certifica que una línea esté activa.


## Refuerzo técnico y experiencia multidispositivo

La versión de trabajo incorpora un manifiesto web y un service worker con caché local de la estructura esencial. La primera visita requiere conexión. Después de que el navegador haya guardado los archivos, puede ser posible abrir la guía sin conexión; las fuentes, mapas y fotografías externas seguirán necesitando internet. El almacenamiento depende del navegador y del espacio disponible, por lo que no debe prometerse disponibilidad offline absoluta.

El service worker:
- almacena únicamente archivos locales esenciales;
- intenta actualizar la página principal desde la red y utiliza la copia guardada si no hay conexión;
- no intercepta envíos ni solicitudes de otros dominios;
- elimina cachés antiguas de esta aplicación al activar una versión nueva;
- no almacena ni envía datos personales de visitantes.

El manifiesto permite que navegadores compatibles ofrezcan agregar la guía a la pantalla de inicio. La disponibilidad de instalación depende del navegador y del dispositivo.

## Compartir por WhatsApp

- El mensaje se genera con una presentación breve y el enlace actual, sin parámetros de búsqueda ni filtros personales.
- El botón WhatsApp abre el destino de compartir; no envía mensajes automáticamente.
- Se ofrece copia del mensaje como alternativa.
- En celulares se agrega una barra inferior con acceso rápido al buscador y a WhatsApp.
- La vista previa social utiliza la fotografía publicada por la Municipalidad y conserva su atribución dentro de la página. La visualización final de la miniatura depende de WhatsApp y de la disponibilidad del servidor de imagen.

## Controles automáticos reforzados

La validación ahora revisa:
- existencia de recursos esenciales y manifiesto;
- sintaxis de JavaScript y service worker;
- IDs HTML repetidos, IDs esenciales y selectores utilizados por la aplicación;
- orden de carga de datos y aplicación;
- HTTPS en fuentes de fichas;
- categorías incluidas en los filtros;
- formato de teléfonos y correos;
- IDs de fichas repetidos y teléfonos duplicados (estos últimos se informan como advertencia, no se borran automáticamente);
- enlaces externos con protección noopener;
- rutas relativas del manifiesto, iconos, modo offline y acciones móviles;
- ausencia de enlaces tel:, mailto: y javascript:.

Estos controles reducen errores técnicos, pero no reemplazan pruebas visuales en celulares reales, verificación de teléfonos ni autorización de fotografías.


### Regla de actualización de la caché

Cada vez que se modifiquen archivos esenciales (`index.html`, `styles.css`, `datos.js`, `app.js`, el manifiesto o el icono), aumentar el número de versión de `CACHE_NAME` en `sw.js`. Así el navegador instala una caché nueva y elimina la anterior al activar la actualización. No reutilizar el mismo nombre de caché después de cambiar esos archivos.


## Lectura accesible e impresión A4 reforzada

La interfaz ofrece tres accesos rápidos:
- **Letra grande:** amplía el texto y refuerza el contraste sin cambiar el contenido.
- **Modo noche:** utiliza una paleta oscura para consultar con menos luz.
- **Alto contraste:** presenta texto y controles con diferencias más marcadas.

Los ajustes detallados siguen disponibles y se guardan localmente en el dispositivo. No se envían datos de preferencias al proyecto.

La impresión se prepara de forma independiente de la paginación de pantalla: al imprimir se incluyen **todos los resultados del filtro o búsqueda actual**, no solamente las 12 fichas de la página visible. La salida A4 usa una columna para facilitar lectura, mantiene la procedencia de cada ficha, evita fondos decorativos y oculta controles que no sirven en papel. Al cerrar la vista de impresión, la guía vuelve a la página y filtros que la persona estaba usando.

La vista previa debe comprobarse en Chrome/Edge y en impresoras reales o guardado PDF, porque márgenes, saltos y escalado final también dependen del navegador y de la configuración elegida por quien imprime.
