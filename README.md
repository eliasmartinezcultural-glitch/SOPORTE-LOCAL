# CHÁÑAR A MANO

**Guía comunitaria independiente y gratuita de San Patricio del Chañar, Neuquén.**  
Idea, diseño y desarrollo: **Ocarina Producciones** · Creada por Elías Martínez.  
*Historias, personas y territorio.*

## Para qué sirve
Reúne información pública de instituciones, servicios, organizaciones, espacios, comercios y actividades de la localidad. Busca que cualquier persona pueda encontrar una referencia útil sin registrarse ni completar formularios.

## Cómo se usa
1. Escribí una palabra en el buscador, por ejemplo: hospital, escuela o farmacia.
2. O elegí uno de los temas.
3. Abrí la fuente de la ficha para revisar el dato antes de usarlo.

La página está pensada para celulares, lectura sencilla, controles grandes y personas con poca experiencia digital. La bienvenida identifica claramente la creación de Ocarina Producciones y presenta una fotografía del Balneario Municipal publicada en la sección Nuestra Ciudad del sitio de la Municipalidad. La atribución está visible junto a la imagen; la autorización específica de reutilización debe confirmarse con el titular antes de considerar cerrada la cuestión de derechos. Incluye un panel de ajustes con tamaño de letra ampliable hasta el 200%, brillo, contraste y tres modos de color (natural, alto contraste y nocturno), además de impresión y guardado como PDF. La búsqueda se realiza sobre los datos incluidos en la página, sin registro ni envío de la consulta. Los ajustes visuales se guardan localmente en el dispositivo. El encabezado ofrece acceso directo para compartir por WhatsApp; también se conserva el menú de compartir del dispositivo y la opción de copiar el enlace.


La página ahora prioriza el buscador al entrar: los temas se despliegan solo si la persona quiere explorar por categoría, la procedencia completa de cada ficha se abre bajo demanda y los ajustes de pantalla quedan después del directorio para no retrasar la consulta.


## Identidad visual y experiencia de lectura
La presentación utiliza una paleta cálida inspirada en papel, vegetación y tonos de tierra, con acentos diferenciados para reconocer visualmente los temas. Las fichas tienen una jerarquía clara: categoría, nombre, descripción, datos disponibles y procedencia desplegable. Se reforzaron los espacios, bordes, sombras suaves y estados de interacción sin convertir la guía en una interfaz recargada. La portada identifica la autoría de Ocarina Producciones y conserva una referencia visual local. Los modos nocturno y de alto contraste contemplan los nuevos detalles; la impresión elimina adornos que dificulten la lectura en papel.

La capa estética no modifica la estructura de las fichas ni el contenido de `datos.js`. Los efectos de movimiento se limitan a dispositivos que admiten interacción por puntero y respetan la preferencia de movimiento reducido.

## Criterios de información y seguridad
- La guía no es oficial y no representa a las instituciones.
- Cada ficha identifica el tipo de fuente disponible.
- Las referencias obtenidas mediante búsquedas en mapas no confirman por sí solas teléfonos, horarios ni vigencia.
- Los datos pueden cambiar; hay que consultar la fuente antes de utilizarlos o concurrir a un lugar.
- No se incluyen acciones automáticas de llamada, correo o mensajería.
- La guía no inicia trámites, no recibe denuncias y no es un servicio de emergencias.
- No reemplaza la atención oficial, profesional o presencial.
- No se deben compartir datos personales o sensibles sin verificar previamente al destinatario.

## Contenido
- 75 fichas locales organizadas en nueve temas ciudadanos.
- 60 fichas incluyen al menos un teléfono publicado como referencia.
- De esos 60 teléfonos, 22 proceden de referencias en mapas y requieren verificación directa antes de considerarse confirmados.
- Las fichas pueden incluir teléfonos, correo, dirección, ubicación aproximada y enlace a la fuente, según la información disponible.
- El directorio distingue sitios oficiales, agendas o directorios institucionales y referencias en mapas.

## Colaboración voluntaria
Consultar, imprimir y compartir la guía es gratuito. El cartel de colaboración aparece separado del contenido de consulta y aclara que el aporte es personal, voluntario y no obligatorio. Quien quiera y pueda colaborar puede hacerlo:

- Alias: `ocarina.guitarra`
- Titular: Elías Martínez
- El aporte se realiza a una persona y no a una institución pública.
- No es obligatorio, no es una suscripción ni condiciona el acceso.
- La guía no cobra por consultar, imprimir ni compartir.

## Archivos
- `index.html`: estructura sencilla de la guía.
- `styles.css`: diseño adaptable, lectura accesible e impresión.
- `datos.js`: fichas y procedencia de los datos.
- `app.js`: búsqueda, temas, paginación, tamaño de letra, compartir y herramientas de impresión.

## Control de publicación final

Antes de anunciar la guía como versión estable, completar estas comprobaciones en el sitio publicado:

- Abrirla en pantallas de 320, 390 y 680 píxeles y en una computadora.
- Probar búsquedas con y sin acentos, sinónimos y números parciales de teléfono.
- Recorrer los nueve temas y todas las páginas de resultados.
- Probar letra ampliada, brillo, contraste y los tres modos de color.
- Imprimir o guardar en PDF y revisar el resultado en papel A4.
- Probar compartir por WhatsApp, el menú del dispositivo y copiar el alias.
- Abrir varias fuentes oficiales y referencias en mapas para confirmar que los enlaces sigan funcionando.
- Verificar directamente los 22 teléfonos cuya procedencia es una referencia en mapas antes de presentarlos como confirmados.
- Confirmar la autorización de reutilización de la fotografía de portada o reemplazarla por una imagen propia/autorizada.

La revisión del código no sustituye estas pruebas en navegadores y dispositivos reales. La guía debe seguir mostrando que los datos son referencias sujetas a cambios.


## Publicación y mantenimiento

El procedimiento para guardar, revisar, publicar y recuperar cambios está documentado en [PUBLICACION.md](PUBLICACION.md). La validación automática se ejecuta al subir cambios y al abrir Pull Requests hacia `main`.

## Fuentes de referencia
- Municipalidad de San Patricio del Chañar: https://sanpatricio.gob.ar/
- RENATRE, Delegación Neuquén: https://www.renatre.org.ar/delegaciones/neuquen/
- Agenda de Recursos Co.Pro.NAF: https://copronaf.neuquen.gob.ar/agenda-de-recursos/
- Registro Civil de Neuquén: https://registrocivil.neuquen.gob.ar/oficinas/
- CAME, entidades asociadas: https://www.redcame.org.ar/entidades-asociadas/78/asociadas
- Diócesis de Neuquén: https://www.diocesisneuquen.org.ar/


## Resiliencia y uso desde celulares

La rama de trabajo incorpora controles automáticos reforzados, mensajes de recuperación ante errores de interfaz, accesos móviles de gran tamaño, compartir por WhatsApp con alternativa de copia, manifiesto web y caché local de archivos esenciales para consultas posteriores sin conexión. La primera visita requiere internet; los enlaces externos y la foto municipal también dependen de conexión.

Consultar `PUBLICACION.md` antes de publicar. La validación automática no certifica que los contactos estén activos ni que el diseño haya sido probado en dispositivos físicos.
