# Publicación segura de CHÁÑAR A MANO

## Regla principal

El proyecto se mantiene en **una sola rama activa: `main`**. Las mejoras ordinarias se guardan directamente allí, con commits pequeños y descriptivos. No se abren ramas de trabajo ni Pull Requests para tareas habituales. La rama congelada `base-estable-2026-11-19` se conserva únicamente como referencia histórica y no se modifica.

## Fuente de publicación

La publicación prevista es GitHub Pages desde `main` y la carpeta raíz `/(root)`. La configuración efectiva debe comprobarse en GitHub → Settings → Pages; no se debe afirmar que una actualización está publicada hasta verificar la URL pública.

## Flujo obligatorio de cada mejora

1. Leer el archivo actual de `main` y comprobar su SHA antes de editar.
2. Definir exactamente qué archivos se modificarán y preservar los datos que no formen parte de la tarea.
3. Guardar directamente en `main` mediante commits descriptivos; no considerar guardado un cambio que solo exista en un editor o conversación.
4. Ejecutar **Validar Chañar a Mano** y revisar el resultado del commit.
5. Comprobar el resumen de archivos modificados y verificar que `datos.js` no cambió si la tarea no incluía cambios editoriales.
6. Esperar la publicación de GitHub Pages y abrir la URL pública para comprobar el cambio.
7. Si la web no refleja el commit, revisar Settings → Pages, Actions y la caché del navegador antes de seguir modificando código.
8. No modificar la rama congelada `base-estable-2026-11-19`.

## Compartir búsquedas y accesibilidad

Los enlaces de búsqueda pueden conservar la palabra consultada, el tema y los filtros de teléfono o dirección mediante parámetros de URL. Los favoritos no se comparten: permanecen en el almacenamiento local de cada dispositivo. El acceso rápido con la tecla `/` enfoca el buscador cuando la persona no está escribiendo en otro control. La hoja de estilos respeta `prefers-reduced-motion` para reducir desplazamientos y transiciones si el sistema operativo así lo solicita.

## Exportación de resultados

La descarga genera un CSV local con todas las fichas que coinciden con la búsqueda y los filtros activos, aunque estén distribuidas en varias páginas. Incluye nombre, tema, descripción, teléfonos publicados, uso indicado, estado documental, dirección, correo, fuente y enlace de procedencia. También se puede copiar el conjunto como texto para pegarlo en una nota o mensaje. Ninguna acción consulta servicios externos ni transmite la selección. El CSV agrega una marca BOM para facilitar la lectura de caracteres españoles en planillas y neutraliza valores que podrían interpretarse como fórmulas.

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
- Si una mejora rompe el sitio, revertir el commit problemático o restaurar el último commit estable de `main`.
- No borrar ni reescribir la rama congelada para resolver errores.
- Registrar cada publicación con su SHA y enlace al commit.

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


### Ubicación de accesibilidad y actualización de caché

Los tres accesos rápidos de lectura quedan ahora visibles antes del buscador y del directorio, sin tener que recorrer las fichas ni abrir un panel. Los controles avanzados permanecen agrupados en un desplegable inmediatamente debajo. La caché de recursos esenciales se incrementó a v6 para solicitar nuevamente los archivos de esta revisión en la próxima activación del service worker.


## Reparación estructural · 19 de noviembre de 2026

Se consolidó la hoja de estilos en una única base coherente. Se eliminaron las capas acumuladas de reglas repetidas que producían diferencias entre pantallas y podían hacer que un ajuste nuevo quedara anulado por otro bloque posterior.

La estructura consolidada cubre:
- escritorio, tablet y celulares pequeños;
- controles de lectura grandes, modo nocturno y alto contraste;
- tamaños de letra ampliables hasta el 200%;
- controles táctiles con áreas amplias;
- impresión A4 en una columna, con fichas que procuran no dividirse entre páginas;
- eliminación de controles y decoración innecesaria en papel;
- preservación de procedencias y advertencias en la salida impresa.

La impresión se prepara también cuando se utiliza Ctrl+P o el menú del navegador: se actualizan los metadatos y se imprimen todos los resultados del filtro actual, no solamente la página visible. Al terminar, se restaura la consulta y paginación que estaban en pantalla.

## Actualización visible de la aplicación

El service worker ahora instala una versión completa de los archivos esenciales antes de activarse. Si falla la descarga de un recurso, no activa una caché parcial. La caché se incrementó a v6.

Cuando un service worker actualizado toma el control de una pestaña que ya estaba abierta, la aplicación recarga el documento para evitar que queden mezclados el HTML/CSS/JavaScript de versiones diferentes. Además, solicita una comprobación de actualización al registrar el service worker.

**Importante:** estos mecanismos actualizan la copia local del navegador cuando la nueva versión ya fue publicada desde la fuente configurada en GitHub Pages. No publican cambios por sí solos. El proyecto mantiene una única rama activa: `main`.

## Estado de publicación

Los cambios se guardan directamente en `main`. Antes de considerar una mejora como terminada:
1. ejecutar y aprobar el workflow de validación correspondiente al último SHA;
2. revisar los archivos modificados y confirmar que los datos editoriales no cambiaron si no formaban parte de la tarea;
3. revisar la vista previa real en celular y escritorio;
4. probar impresión/guardar PDF A4 y la descarga CSV;
5. verificar en Settings → Pages cuál es la rama y carpeta efectivas;
6. abrir la URL publicada en una ventana privada y confirmar el nuevo contenido y la nueva versión de caché.


## Vista fácil prioritaria para personas mayores

La portada fue simplificada para que la consulta empiece antes: se quitaron las estadísticas decorativas y la fotografía que ocupaba espacio antes del directorio. Se mantiene la identidad de Ocarina y la explicación breve del propósito de la guía.

La primera visita activa una base de letra ampliada (125%) y un contraste reforzado. Las preferencias anteriores se migran una sola vez a una nueva clave local; después se respeta el tamaño que cada persona elija.

El acceso **LETRA GRANDE · RECOMENDADO** activa:
- escala de lectura del 150%;
- contraste reforzado;
- tarjetas de una sola columna;
- teléfonos con tamaño destacado, en su propio bloque;
- direcciones y advertencias con mayor tamaño y separación.

Los teléfonos siguen siendo texto seleccionable, no enlaces de llamada. La etiqueta aclara que son datos publicados como referencia. Los botones de búsqueda, filtros y acciones se ampliaron para facilitar el uso táctil.

El modo noche y el alto contraste conservan la jerarquía de números y direcciones. La impresión A4 también destaca los teléfonos, conserva advertencias y evita dividir bloques de datos cuando sea posible.

Esta mejora se verificó en el código y en el validador automático; todavía requiere prueba visual en celulares físicos, zoom del navegador y vista previa de impresión.


## Funciones locales de la revisión integral

La guía puede guardar fichas favoritas y copiar el contenido de una ficha. Los favoritos se almacenan exclusivamente en el navegador del dispositivo mediante almacenamiento local; no hay cuenta, sincronización ni transmisión al servidor. Si la persona borra los datos del navegador, también pierde los favoritos. La copia incluye siempre la fuente y una advertencia de que el dato puede cambiar. Ninguna de estas acciones crea enlaces automáticos de llamada, correo o mensajería.

La caché del shell se incrementa a v8 cuando se actualizan HTML, CSS o JavaScript. Tras publicar, comprobar que el navegador descargue la nueva versión y que una segunda visita permita consultar la guía sin conexión.


## Filtro de direcciones

El filtro “Mostrar solo lugares con dirección” se combina con la búsqueda, la categoría, el filtro de teléfono y los favoritos. “Quitar todos los filtros” restablece la consulta actual sin eliminar los favoritos almacenados. La impresión conserva el conjunto resultante y registra los filtros aplicados.


## Impresión A4 y difusión por WhatsApp

Antes de imprimir, se puede seleccionar “Solo los resultados que estoy viendo” o “La guía completa”. La primera opción respeta búsqueda, categoría, teléfono, dirección y favoritos; la segunda incluye todas las fichas ordenadas alfabéticamente. La impresión incorpora una portada editorial breve, fecha, cantidad de fichas, advertencia de vigencia, fuentes y créditos. Revisar siempre la vista previa del navegador y elegir papel A4.

La difusión ofrece un mensaje corto con el enlace y una tarjeta gráfica generada en el propio dispositivo. En móviles compatibles, el menú nativo permite elegir WhatsApp y adjuntar el PNG. En equipos sin esa capacidad, la imagen se descarga y el mensaje se copia para adjuntarlos manualmente. El botón de WhatsApp solo prepara el texto y enlace; no envía mensajes sin intervención de la persona.

La tarjeta PNG se genera a 1200 × 630 píxeles, no contiene teléfonos institucionales, estadísticas ni afirmaciones de vigencia. El mensaje acompaña el enlace y recuerda revisar la fuente de cada ficha.


**Corrección de cuadrícula:** el modo de letra grande ya no fuerza una única columna en escritorio. Conserva dos columnas para mantener legibilidad y se reduce a una sola en pantallas angostas de celular.
