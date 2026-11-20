const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = process.cwd();
const errors = [];
const warnings = [];
const fail = message => errors.push(message);
const warn = message => warnings.push(message);
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const requiredFiles = ["index.html","styles.css","datos.js","app.js","manifest.webmanifest","sw.js","marca-chanar.svg"];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root,file))) fail("Falta archivo obligatorio: " + file);
if (errors.length) { errors.forEach(message => console.error("ERROR:",message)); process.exit(1); }

const html=read("index.html"), app=read("app.js"), dataSource=read("datos.js"), css=read("styles.css"), sw=read("sw.js");
for (const file of ["app.js","datos.js","sw.js"]) {
  try { new vm.Script(read(file),{filename:file}); } catch(error) { fail("Error de sintaxis en "+file+": "+error.message); }
}
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]);
const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);
if(duplicates.length)fail("IDs HTML duplicados: "+[...new Set(duplicates)].join(", "));
const idSet=new Set(ids);
const requiredIds=["contactGrid","filters","searchInput","clearSearch","resultCount","emptyState","resultsContext","resultsTitle","copyFeedback","shareFeedback","phoneOnly","pagination","previousPage","nextPage","pageStatus","topicPanel","directoryTitle","fontDown","fontUp","fontReset","fontScaleStatus","brightnessControl","contrastControl","appearanceStatus","brightnessValue","contrastValue","resetAppearance","searchForm","resetFilters","copyAliasButton","supportAlias","printMeta","printButton","whatsappShare","shareButton","copyShareButton","mobileSearchButton","mobileWhatsappShare","appStatus"];
for(const id of requiredIds)if(!idSet.has(id))fail("Falta elemento esencial #"+id);
for(const id of new Set([...app.matchAll(/\$\(["']([^"']+)["']\)/g)].map(match=>match[1])))if(id!=="resultsEndNote"&&!idSet.has(id))fail("app.js referencia un ID inexistente: #"+id);
if(!/<html lang="es-AR">/.test(html))fail("El documento debe declarar es-AR.");
if(!/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(html))fail("Falta viewport móvil estándar.");
if(html.indexOf('src="datos.js"')<0||html.indexOf('src="app.js"')<html.indexOf('src="datos.js"'))fail("datos.js debe cargarse antes de app.js.");
for(const [,asset]of html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|webmanifest|svg))["']/g)){
 if(/^https?:\/\//i.test(asset)||asset.startsWith("//"))continue;
 if(!fs.existsSync(path.join(root,asset.split(/[?#]/)[0])))fail("Recurso local inexistente: "+asset);
}
if(/(^|[^a-z])(tel|mailto):/i.test(html+app+dataSource))fail("Se detectó tel: o mailto:.");
if((html+app+dataSource+css+sw).toLowerCase().includes("javascript:"))fail("Se detectó javascript:.");
if(/target="_blank"(?![^>]*rel="[^"]*noopener[^"]*")/.test(html))fail("Enlace target=_blank sin noopener.");
let manifest;
try{manifest=JSON.parse(read("manifest.webmanifest"));}catch(error){fail("Manifiesto inválido: "+error.message);}
if(manifest){
 if(manifest.start_url!=="./"||manifest.scope!=="./")fail("El manifiesto debe usar rutas relativas.");
 if(!manifest.name||!manifest.short_name||manifest.display!=="standalone")fail("Faltan datos esenciales del manifiesto.");
 for(const icon of manifest.icons||[])if(!fs.existsSync(path.join(root,icon.src)))fail("Falta icono del manifiesto: "+icon.src);
}
if(!sw.includes("skipWaiting")||!sw.includes("clients.claim")||!sw.includes('request.mode === "navigate"'))fail("Service worker sin ciclo de actualización/fallback.");
if(!app.includes("navigator.serviceWorker.register")||!app.includes("window.isSecureContext"))fail("Falta registro seguro del service worker.");
if(!css.includes("@media(max-width:760px)")||!css.includes("@media(max-width:560px)")||!css.includes("env(safe-area-inset-bottom)")||!css.includes(".mobile-action-bar"))fail("Falta adaptación móvil multidispositivo.");
if(!css.includes("@page{size:A4 portrait")||!css.includes("@media print")||!css.includes("break-inside:avoid"))fail("Falta una hoja de impresión A4 con control de saltos.");
for(const preset of ["elderly","night","contrast"])if(!html.includes('data-appearance-preset="'+preset+'"'))fail("Falta acceso rápido de lectura: "+preset+".");
if(!css.includes(".data-row-phone .data-value")||!css.includes("font-size:clamp(27px")||!css.includes("body.easy-reading .contact-grid{grid-template-columns:1fr}"))fail("Falta jerarquía de teléfonos grandes y fichas de lectura fácil.");
if(!app.includes('classList.toggle("easy-reading", fontScale >= 1.25)')||!app.includes('chanar-a-mano-appearance-v2'))fail("Falta persistencia de preferencias de lectura fácil.");
if(!app.includes('TELÉFONO PUBLICADO')||!app.includes('phone-number'))fail("Los números telefónicos no tienen una presentación destacada.");
if(!app.includes('document.querySelectorAll("[data-appearance-preset]")'))fail("Los accesos rápidos de lectura no están conectados a la aplicación.");
if(!app.includes('window.addEventListener("beforeprint", () =>')||!app.includes("updatePrintMeta();")||!app.includes('scope === "all" ? contacts.slice()'))fail("La impresión no prepara metadatos y permite elegir el alcance.");
if(!app.includes("registration.update()")||!app.includes('"controllerchange"'))fail("Falta comprobación de actualización y recarga coordinada del service worker.");
if(!sw.includes('const CACHE_NAME = "chanar-a-mano-shell-v21"')||!sw.includes('cache: "reload"')||!sw.includes("if (!response.ok)"))fail("El service worker no garantiza una caché versionada completa.");
if(!html.includes('id="mobileWhatsappShare"')||!html.includes('id="mobileSearchButton"'))fail("Faltan acciones rápidas móviles.");
for(const id of ["favoritesToggle","favoritesCount","clearFavorites"])if(!idSet.has(id))fail("Falta control de lugares guardados: #"+id);
for(const id of ["printScope","printHeadingTitle","printHeadingIntro","printCoverCount","shareKitWhatsapp","shareCardButton","shareKitCopyButton","shareMessagePreview","printUrl","exportResultsButton","exportFeedback","copyResultsButton"])if(!idSet.has(id))fail("Falta control de impresión/difusión/exportación: #"+id);
if(!app.includes("downloadCurrentResultsCsv")||!app.includes("text/csv;charset=utf-8;")||!app.includes("visibleContacts()"))fail("Falta la exportación completa de resultados a CSV.");
if(!app.includes("copyCurrentResults")||!app.includes("Respaldo documental:"))fail("Falta la copia accesible de la selección con sus fuentes.");
if(!idSet.has("directoryIntro"))fail("Falta la introducción adaptable a impresión.");
if(!app.includes("createShareCardFile")||!app.includes("navigator.canShare({files:[file]})")||!app.includes("chanar-a-mano-compartir.png"))fail("La tarjeta gráfica no tiene un flujo de exportación y uso compartido.");
if(!app.includes('scope === "all" ? contacts.slice()')||!app.includes("Resultados seleccionados"))fail("La impresión no distingue resultados filtrados y guía completa.");
if(!html.includes("revisá la fuente de cada ficha"))fail("Falta un mensaje de difusión con criterio de verificación.");
if(!css.includes(".print-cover")||!css.includes(".share-kit")||!css.includes("@page{size:A4 portrait;margin:13mm 14mm 16mm}"))fail("Falta la capa editorial de impresión y difusión.");
if(!sw.includes('const CACHE_NAME = "chanar-a-mano-shell-v21"'))fail("La caché PWA no fue actualizada a v12.");
if(!app.includes("chanar-a-mano-favorites-v1")||!app.includes("data-favorite-id")||!app.includes("showFavoritesOnly"))fail("Los favoritos locales no están conectados.");
if(!app.includes("data-copy-contact-id")||!app.includes("Ficha copiada."))fail("Falta la copia de fichas públicas.");
if(!html.includes("La lista queda solamente en este dispositivo"))fail("Falta el aviso de privacidad de favoritos.");
if(!idSet.has("addressOnly")||!idSet.has("clearAllFilters")||!app.includes("matchesAddress"))fail("Falta el filtro de direcciones o el restablecimiento integral.");
if(!sw.includes('const CACHE_NAME = "chanar-a-mano-shell-v21"'))fail("La caché no fue incrementada para esta versión.");
if(!html.includes('id="gridViewNote"')||!app.includes("const pageSize = 18;"))fail("Falta la cuadrícula informativa o la página ampliada a 18 fichas.");
if(!idSet.has("shareSearchButton")||!app.includes("function currentSelectionUrl()")||!app.includes('url.searchParams.set("buscar"'))fail("Falta compartir una búsqueda con filtros recuperables.");
if(!app.includes('event.key === "/"'))fail("Falta el acceso rápido de teclado al buscador.");
if(!css.includes("@media(prefers-reduced-motion:reduce)"))fail("Falta respetar la preferencia de movimiento reducido.");
if(!css.includes("body.easy-reading .contact-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}")||!css.includes("@media(max-width:560px){body.easy-reading .contact-grid{grid-template-columns:1fr!important}}"))fail("El modo de letra grande debe conservar dos columnas en escritorio y una en móvil.");
if(!css.includes(".contact-grid{grid-template-columns:repeat(3,minmax(0,1fr))")||!css.includes("@media(max-width:560px)"))fail("Falta la cuadrícula adaptable de tres, dos y una columna.");

if(!css.includes("border:2px solid #c4d1c0")||!css.includes("body[data-theme=night] .contact-card")||!css.includes("body[data-theme=high] .contact-card"))fail("Falta separación visual de tarjetas adaptada a los modos de lectura.");

if(!html.includes('class="header-credit"')||!html.includes("Un desarrollo de <strong>Universo Ocarina</strong> - Elías Martínez"))fail("Falta el crédito de Universo Ocarina en el margen superior derecho.");
if(!html.includes('class="footer-credit"')||!html.includes("Un desarrollo de <strong>Universo Ocarina</strong> - Elías Martínez"))fail("Falta el crédito unificado en el pie de página.");
if(app.includes("Ocarina Producciones")||!app.includes("Universo Ocarina - Elías Martínez"))fail("Hay créditos antiguos o falta la identidad Universo Ocarina en los materiales generados.");
for(const tone of ["municipal","community","work","education","health","services","sport","culture","tourism","commerce"])if(!css.includes(".contact-card.tone-card-"+tone))fail("Falta una paleta visual diferenciada para la categoría "+tone+".");
if(!css.includes("body[data-theme=night] .contact-card.tone-card-health")||!css.includes("body[data-theme=high] .contact-card[class*=\"tone-card-\"]"))fail("La paleta de tarjetas debe adaptarse al modo nocturno y alto contraste.");
const marker="window.CHANAR_CONTACTOS =";
const start=dataSource.indexOf(marker);
if(start<0)fail("No se encontró window.CHANAR_CONTACTOS.");
else{
 const jsonText=dataSource.slice(start+marker.length).trim().replace(/;\s*$/,"");
 let contacts;
 try{contacts=JSON.parse(jsonText);}catch(error){fail("datos.js no contiene JSON válido: "+error.message);}
 if(Array.isArray(contacts)){
  if(!contacts.length)fail("El directorio no puede estar vacío.");
  const seen=new Set(), allowedSourceTypes=new Set(["oficial","agenda","institucional","mapa","secundaria"]);
  const allowedStates=new Set(["publicado-fuente-oficial","publicado-agenda-provincial","publicado-directorio-institucional","referencia-secundaria","dato-duplicado-pendiente","conflicto-entre-fuentes"]);
  const block=app.match(/const categoryMap = \[([\s\S]*?)\n  \];/);
  const categories=new Set(block?[...block[1].matchAll(/keys:\s*\[([^\]]*)\]/g)].flatMap(match=>[...match[1].matchAll(/"([^"]+)"/g)].map(item=>item[1])):[]);
  const phoneOwners=new Map();
  for(const [index,item]of contacts.entries()){
   const label="Ficha "+(index+1)+" ("+(item&&item.nombre||"sin nombre")+")";
   if(!item||typeof item!=="object"){fail(label+": registro inválido.");continue;}
   if(typeof item.id!=="string"||!item.id.trim()||typeof item.nombre!=="string"||!item.nombre.trim()||typeof item.categoria!=="string"||!item.categoria.trim())fail(label+": faltan ID, nombre o categoría.");
   if(seen.has(item.id))fail("ID de ficha duplicado: "+item.id);seen.add(item.id);
   if(!categories.has(item.categoria))fail(label+": categoría fuera de los filtros: "+item.categoria);
   if(typeof item.descripcion!=="string"||!item.descripcion.trim())fail(label+": falta descripción.");
   if(typeof item.fuente!=="string"||!/^https:\/\//i.test(item.fuente))fail(label+": la fuente debe usar HTTPS.");
   if(typeof item.fuenteNombre!=="string"||!item.fuenteNombre.trim())fail(label+": falta el nombre de la fuente.");
   if(!allowedSourceTypes.has(item.fuenteTipo))fail(label+": fuenteTipo inválido.");
   if(item.telefonos!==undefined&&!Array.isArray(item.telefonos))fail(label+": telefonos debe ser una lista.");
   const phones=Array.isArray(item.telefonos)?item.telefonos:[];
   for(const phone of phones){
    if(!phone||typeof phone.numero!=="string"||phone.numero.replace(/\D/g,"").length<7||phone.numero.replace(/\D/g,"").length>15)fail(label+": teléfono inválido.");
    else{const key=phone.numero.replace(/\D/g,"");phoneOwners.set(key,[...(phoneOwners.get(key)||[]),item.nombre]);}
   }
   if(item.correo&&(typeof item.correo!=="string"||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.correo)))fail(label+": correo inválido.");
   if(item.direccion&&typeof item.direccion!=="string")fail(label+": dirección inválida.");
   const hasContact=phones.length>0||Boolean(item.correo);
   if(hasContact&&!allowedStates.has(item.estadoContacto))fail(label+": falta estado de respaldo.");
   if(!hasContact&&item.estadoContacto)fail(label+": estado de contacto sin teléfono/correo.");
  }
  for(const [number,owners]of phoneOwners.entries())if(owners.length>1)warn("Teléfono repetido "+number+" en "+owners.join(" / "));
  console.log("Fichas:",contacts.length,"| con teléfono:",contacts.filter(item=>Array.isArray(item.telefonos)&&item.telefonos.length>0).length,"| categorías:",categories.size);
 }else fail("CHANAR_CONTACTOS debe ser una lista.");
}
if(!css.includes("CHÁÑAR A MANO · interfaz esencial para consulta rápida y lectura simple")||!css.includes("@page{size:A4 portrait;margin:10mm 11mm 12mm}"))fail("Falta la interfaz simplificada y la impresión A4 de lectura fácil.");
if(!html.includes("Escribí un nombre, un rubro o un teléfono.")||!html.includes("Buscá lo que necesitás"))fail("Faltan las instrucciones breves de consulta.");

if(!html.includes('property="og:image"')||!html.includes("compartir-chanar.svg")||!html.includes('rel="canonical"'))fail("Faltan los metadatos profesionales de vista previa y enlace canónico.");
if(!css.includes("CIERRE DE ETAPA · sistema visual curado, simple y multidispositivo")||!css.includes(".contact-card.tone-card-health"))fail("Falta el sistema visual final por rubros.");
if(!app.includes("Consultala acá:")||!app.includes('guideUrl() + "#inicio"'))fail("El mensaje de WhatsApp no incluye el enlace directo y claro a la guía.");
if(!sw.includes('"./compartir-chanar.svg"'))fail("La imagen de vista previa no está incluida en la caché esencial.");
if(errors.length){errors.forEach(message=>console.error("ERROR:",message));process.exit(1);}
warnings.forEach(message=>console.warn("ADVERTENCIA:",message));
console.log("Validación estática, datos, enlaces y PWA completada.");
