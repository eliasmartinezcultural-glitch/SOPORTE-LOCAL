(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const requiredIds = [
    "contactGrid","filters","searchInput","clearSearch","resultCount","emptyState",
    "resultsContext","resultsTitle","copyFeedback","shareFeedback","phoneOnly","pagination","previousPage","nextPage","pageStatus",
    "topicPanel","directoryTitle","fontDown","fontUp","fontReset","fontScaleStatus",
    "brightnessControl","contrastControl","appearanceStatus","brightnessValue",
    "contrastValue","resetAppearance","searchForm","resetFilters","copyAliasButton",
    "supportAlias","printMeta","printButton","whatsappShare","shareButton",
    "copyShareButton","mobileSearchButton","mobileWhatsappShare","appStatus",
    "favoritesToggle","favoritesCount","clearFavorites","addressOnly","clearAllFilters",
    "printScope","printHeadingTitle","printHeadingIntro","printCoverCount","shareKitWhatsapp","shareSearchButton","shareCardButton","shareKitCopyButton","shareMessagePreview","printUrl", "directoryIntro","exportResultsButton","exportFeedback","copyResultsButton"
  ];
  const missingIds = requiredIds.filter(id => !$(id));
  if (missingIds.length) {
    const alert = document.createElement("p");
    alert.className = "app-status app-status-error";
    alert.setAttribute("role", "alert");
    alert.textContent = "La guía encontró un problema al iniciar. Recargá la página; si continúa, avisá a Universo Ocarina - Elías Martínez.";
    document.body.prepend(alert);
    console.error("Chañar a Mano: faltan elementos esenciales:", missingIds);
    return;
  }
  const rawContacts = Array.isArray(window.CHANAR_CONTACTOS) ? window.CHANAR_CONTACTOS : [];
  const seenContactIds = new Set();
  let invalidPhoneEntries = 0;
  const contacts = rawContacts.filter(contact => {
    if (!contact || typeof contact !== "object" || typeof contact.id !== "string"
      || !contact.id.trim() || typeof contact.nombre !== "string" || !contact.nombre.trim()
      || typeof contact.categoria !== "string" || !contact.categoria.trim()) return false;
    if (seenContactIds.has(contact.id)) return false;
    seenContactIds.add(contact.id);
    return true;
  }).map(contact => {
    const rawPhones = Array.isArray(contact.telefonos) ? contact.telefonos : [];
    const safePhones = rawPhones.filter(phone => {
      const valid = phone && typeof phone.numero === "string" && phone.numero.trim().length > 0;
      if (!valid) invalidPhoneEntries++;
      return valid;
    });
    return { ...contact, telefonos: safePhones };
  });
  const hasDataWarnings = contacts.length !== rawContacts.length || invalidPhoneEntries > 0;
  const appStatus = $("appStatus");
  if (hasDataWarnings) {
    appStatus.hidden = false;
    appStatus.textContent = "Algunas fichas o teléfonos no se pudieron cargar porque sus datos necesitan revisión. La información restante sigue disponible.";
    appStatus.classList.add("app-status-warning");
    console.warn("Chañar a Mano: fichas omitidas:", rawContacts.length - contacts.length, "| teléfonos omitidos:", invalidPhoneEntries);
  }
  const grid = $("contactGrid");
  const filters = $("filters");
  const search = $("searchInput");
  const clear = $("clearSearch");
  const count = $("resultCount");
  const empty = $("emptyState");
  const resultsContext = $("resultsContext");
  const resultsTitle = $("resultsTitle");
  const copyFeedback = $("copyFeedback");
  const shareFeedback = $("shareFeedback");

  let activeCategory = "Todos";
  let currentPage = 1;
  const pageSize = 18;
  let fontScale = 1;
  const phoneOnly = $("phoneOnly");
  const addressOnly = $("addressOnly");
  let showFavoritesOnly = false;
  const favoritesStorageKey = "chanar-a-mano-favorites-v1";
  let favoriteIds = new Set();
  try {
    const storedFavorites = JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
    if (Array.isArray(storedFavorites)) {
      favoriteIds = new Set(storedFavorites.filter(id => typeof id === "string" && contacts.some(contact => contact.id === id)));
    }
  } catch (_) {
    favoriteIds = new Set();
  }

  function saveFavorites() {
    try {
      localStorage.setItem(favoritesStorageKey, JSON.stringify([...favoriteIds]));
      return true;
    } catch (_) {
      const status = $("appStatus");
      status.hidden = false;
      status.classList.add("app-status-warning");
      status.textContent = "No se pudieron guardar tus favoritos en este dispositivo. Podés seguir usando la guía normalmente.";
      return false;
    }
  }

  function updateFavoritesControls() {
    $("favoritesCount").textContent = favoriteIds.size + (favoriteIds.size === 1 ? " lugar guardado" : " lugares guardados");
    $("favoritesToggle").setAttribute("aria-pressed", String(showFavoritesOnly));
    $("favoritesToggle").textContent = showFavoritesOnly ? "✓ Mostrando mis lugares guardados" : "☆ Ver mis lugares guardados";
    $("clearFavorites").disabled = favoriteIds.size === 0;
  }

  const categoryMap = [
    { label: "Todos los temas", key: "Todos", keys: [], terms: [] },
    { label: "Instituciones públicas", key: "Municipio", keys: ["Organismos públicos"], terms: ["municipalidad", "organismo", "gobierno", "publico", "publica"] },
    { label: "Comunidad y cultura", key: "Comunidad", keys: ["Comunidad", "Cultura y comunidad"], terms: ["parroquia", "religion", "culto", "organizacion", "cultura", "biblioteca", "centro cultural", "plaza", "balneario"] },
    { label: "Trabajo y producción", key: "Trabajo", keys: ["Trabajo y producción"], terms: ["empleo", "produccion", "productores", "rural", "renatre", "agro", "bodega", "establecimiento"] },
    { label: "Educación", key: "Educación", keys: ["Educación", "Educación y cuidados"], terms: ["escuela", "colegio", "educacion", "formacion", "estudio", "jardin", "cdi", "infantil"] },
    { label: "Salud y cuidados", key: "Salud", keys: ["Salud y cuidados"], terms: ["hospital", "salud", "ninez", "cuidados", "farmacia", "veterinaria", "odontologia", "consultorio"] },
    { label: "Servicios públicos", key: "Servicios", keys: ["Servicios públicos"], terms: ["epen", "energia", "electricidad", "servicios"] },
    { label: "Deportes y recreación", key: "Deportes", keys: ["Deportes y recreación"], terms: ["deporte", "deportes", "club", "polideportivo", "estadio", "recreacion"] },
    { label: "Turismo y gastronomía", key: "Turismo", keys: ["Turismo y gastronomía", "Turismo y alojamiento", "Turismo y producción"], terms: ["turismo", "gastronomia", "restaurante", "comer", "alojamiento", "hotel", "visitas", "hosteria", "hospedaje"] },
    { label: "Comercios y servicios", key: "Comercios", keys: ["Comercios y servicios"], terms: ["comercio", "comercios", "panaderia", "ferreteria", "corralon", "negocio", "taller", "peluqueria", "gomeria"] }
  ];

  // Los enlaces compartidos pueden abrir directamente una búsqueda o un tema.
  // Los favoritos quedan fuera porque son datos privados guardados en cada dispositivo.
  try {
    const sharedParams = new URLSearchParams(window.location.search);
    const sharedQuery = sharedParams.get("buscar");
    const sharedCategory = sharedParams.get("tema");
    if (sharedQuery) search.value = sharedQuery.slice(0, 120);
    if (sharedCategory && categoryMap.some(item => item.key === sharedCategory)) activeCategory = sharedCategory;
    phoneOnly.checked = sharedParams.get("telefono") === "1";
    addressOnly.checked = sharedParams.get("direccion") === "1";
  } catch (_) {
    // Una URL mal formada no debe impedir que la guía cargue.
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-AR")
      .replace(/[^a-z0-9@.+\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sourceInfo(contact) {
    if (contact.fuenteTipo === "agenda") {
      return { label: "Agenda provincial", note: "Dato publicado en una agenda provincial; no confirma que la línea siga activa ni que el contacto continúe vigente." };
    }
    if (contact.fuenteTipo === "institucional") {
      return { label: "Directorio institucional", note: "Dato publicado por una entidad o directorio institucional; la vigencia del contacto debe confirmarse." };
    }
    if (contact.fuenteTipo === "mapa") {
      return { label: "Referencia en mapas", note: "El enlace abre una búsqueda por nombre en mapas; no confirma por sí solo teléfono, horario ni vigencia del establecimiento." };
    }
    if (contact.fuenteTipo === "secundaria") {
      return { label: "Publicación de terceros", note: "Dato tomado de una publicación o directorio ajeno a la institución; confirmá antes de utilizarlo." };
    }
    if (contact.fuenteTipo === "oficial") {
      return { label: "Sitio oficial", note: "Dato publicado por el organismo o establecimiento en una fuente oficial. No significa que la línea haya sido probada mediante una llamada." };
    }
    return { label: "Fuente indicada", note: "Procedencia declarada en esta ficha; revisá el sitio de origen." };
  }

  function contactStatusInfo(contact) {
    const states = {
      "publicado-fuente-oficial": ["Publicado por fuente oficial", "La institución publica este dato; la línea no fue comprobada mediante llamada."],
      "publicado-agenda-provincial": ["Publicado en agenda provincial", "La agenda provincial publica este dato; conviene confirmar su vigencia."],
      "publicado-directorio-institucional": ["Publicado en directorio institucional", "El directorio publica este dato; conviene confirmar su vigencia."],
      "referencia-secundaria": ["Referencia de terceros", "El dato no está respaldado aquí por una fuente oficial directa; confirmalo antes de usarlo."],
      "dato-duplicado-pendiente": ["Dato repetido · pendiente de confirmar", "El mismo número aparece en otra ficha. No lo tomes como confirmado hasta consultar a ambas instituciones."],
      "conflicto-entre-fuentes": ["Hay números distintos publicados", "Una fuente oficial y otra publicación consultada muestran teléfonos diferentes. Se conserva el número de la fuente oficial, pero conviene confirmarlo antes de usarlo."]
    };
    return states[contact.estadoContacto] || null;
  }

  function safeSource(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function categoryTone(key) {
    const tones = {"Organismos públicos":"municipal","Comunidad":"community","Trabajo y producción":"work","Educación":"education","Salud y cuidados":"health","Servicios públicos":"services","Deportes y recreación":"sport","Cultura y comunidad":"culture","Turismo y gastronomía":"tourism","Turismo y alojamiento":"tourism","Turismo y producción":"work","Comercios y servicios":"commerce","Educación y cuidados":"education"};
    return tones[key] || "community";
  }

  function categoryLabel(key) {
    return categoryMap.find(item => item.keys.includes(key))?.label || key || "Otros";
  }

  function searchText(contact) {
    const phoneText = (contact.telefonos || []).flatMap(phone => [phone.numero, phone.uso]);
    return normalize([
      contact.nombre, contact.categoria, contact.descripcion, contact.correo,
      contact.direccion, contact.fuenteNombre, contact.fuenteTipo, contact.estadoContacto, (contact.telefonos || []).length ? "teléfono teléfonos contacto" : "", ...phoneText
    ].join(" ")) + " " + normalize(phoneText.join(" ")).replace(/[^0-9]/g, "");
  }

  const synonymMap = {
    hospital: ["hospital"],
    hospitales: ["hospital"],
    salud: ["salud"],
    medico: ["medico"],
    medica: ["medica"],
    escuela: ["escuela", "educacion"],
    escuelas: ["escuela", "educacion"],
    colegio: ["colegio", "educacion"],
    colegios: ["colegio", "educacion"],
    jardin: ["jardin", "educacion"],
    jardines: ["jardin", "educacion"],
    educacion: ["educacion", "escuela"],
    municipalidad: ["municipalidad", "municipio"],
    municipalidades: ["municipalidad", "municipio"],
    municipio: ["municipio", "municipalidad"],
    municipios: ["municipio", "municipalidad"],
    deporte: ["deporte", "deportes", "recreacion", "club"],
    deportes: ["deporte", "deportes", "recreacion", "club"],
    club: ["club", "deporte", "recreacion"],
    cultura: ["cultura", "biblioteca", "centro cultural"],
    biblioteca: ["biblioteca", "cultura"],
    bibliotecas: ["biblioteca", "cultura"],
    comercio: ["comercio", "comercios", "negocio"],
    comercios: ["comercio", "comercios", "negocio"],
    negocio: ["negocio", "comercio"],
    negocios: ["negocio", "comercio"],
    turismo: ["turismo", "alojamiento", "gastronomia", "bodega"],
    alojamiento: ["alojamiento", "hotel", "hospedaje", "hosteria"],
    alojamientos: ["alojamiento", "hotel", "hospedaje", "hosteria"],
    hotel: ["hotel", "alojamiento", "hospedaje"],
    hoteles: ["hotel", "alojamiento", "hospedaje"],
    hospedaje: ["hospedaje", "alojamiento", "hotel"],
    hosteria: ["hosteria", "alojamiento", "hotel"],
    gastronomia: ["gastronomia", "restaurante"],
    restaurante: ["restaurante", "gastronomia"],
    restaurantes: ["restaurante", "gastronomia"],
    bodega: ["bodega"],
    bodegas: ["bodega"],
    trabajo: ["trabajo", "empleo"],
    empleo: ["empleo", "trabajo"],
    produccion: ["produccion", "productores"],
    productores: ["productores", "produccion"],
    energia: ["energia", "electricidad", "epen"],
    electricidad: ["electricidad", "energia", "epen"],
    luz: ["luz", "energia", "electricidad"],
    epen: ["epen", "energia", "electricidad"],
    farmacia: ["farmacia", "salud"],
    farmacias: ["farmacia", "salud"],
    veterinaria: ["veterinaria"],
    veterinarias: ["veterinaria"],
    odontologia: ["odontologia", "dentista"],
    dentista: ["dentista", "odontologia"],
    consultorio: ["consultorio", "salud"],
    consultorios: ["consultorio", "salud"],
    telefono: ["telefono", "telefonos"],
    telefonos: ["telefono", "telefonos"],
    panaderia: ["panaderia"],
    panaderias: ["panaderia"],
    ferreteria: ["ferreteria"],
    ferreterias: ["ferreteria"],
    corralon: ["corralon"],
    corralones: ["corralon"],
    taller: ["taller", "mecanica"],
    talleres: ["taller", "mecanica"],
    mecanica: ["mecanica", "taller"],
    gomeria: ["gomeria"],
    gomerias: ["gomeria"],
    peluqueria: ["peluqueria"],
    peluquerias: ["peluqueria"],
    centro: ["centro", "centros", "cultural"],
    centros: ["centro", "centros", "cultural"],
    cultural: ["cultural", "cultura", "centro"],
    culturales: ["cultural", "cultura", "centro"],
    municipal: ["municipal", "municipalidad", "municipio"],
    policia: ["policia", "seguridad"],
    policial: ["policial", "policia", "seguridad"],
    comisaria: ["comisaria", "seguridad"],
    bombero: ["bombero", "bomberos", "cuartel"],
    bomberos: ["bombero", "bomberos", "cuartel"],
    registro: ["registro", "civil"],
    dni: ["dni", "registro", "civil"],
    documento: ["documento", "dni", "registro"],
    turno: ["turno", "turnos"],
    turnos: ["turno", "turnos"],
    tramite: ["tramite", "tramites"],
    tramites: ["tramite", "tramites"],
    recaudacion: ["recaudacion", "recaudaciones"],
    recaudaciones: ["recaudacion", "recaudaciones"],
    basura: ["basura", "residuos", "recoleccion"],
    residuos: ["residuos", "basura", "recoleccion"],
    colectivo: ["colectivo", "transporte"],
    transporte: ["transporte", "colectivo"],
    agua: ["agua"],
    discapacidad: ["discapacidad", "inclusion"],
    inclusion: ["inclusion", "discapacidad"],
    futbol: ["futbol", "deportes", "club", "estadio", "polideportivo"],
    cancha: ["cancha", "deportes", "club", "estadio", "polideportivo"],
    gimnasio: ["gimnasio", "deportes", "polideportivo", "centro de educacion fisica"],
    entrenamiento: ["entrenamiento", "deportes", "club", "centro de educacion fisica"],
    vino: ["vino", "bodega"],
    vinedo: ["vinedo", "bodega", "produccion"],
    degustacion: ["degustacion", "bodega", "turismo"],
    comer: ["comer", "restaurante", "gastronomia"],
    comida: ["comida", "restaurante", "gastronomia", "helados"],
    almuerzo: ["almuerzo", "restaurante", "gastronomia"],
    cena: ["cena", "restaurante", "gastronomia"],
    helado: ["helado", "helados"],
    helados: ["helado", "helados"],
    dormir: ["dormir", "hospedaje", "alojamiento", "hotel", "hosteria"],
    noche: ["noche", "hospedaje", "alojamiento", "hotel"],
    comprar: ["comprar", "comercio", "supermercado", "panaderia", "ferreteria"],
    compras: ["compras", "comercio", "supermercado", "panaderia", "ferreteria"],
    supermercado: ["supermercado", "comercio"],
    almacen: ["almacen", "comercio", "supermercado"],
    pan: ["pan", "panaderia"],
    herramientas: ["herramientas", "ferreteria"],
    materiales: ["materiales", "corralon", "ferreteria"],
    auto: ["auto", "mecanica", "taller", "gomeria"],
    automovil: ["automovil", "mecanica", "taller", "gomeria"],
    mecanico: ["mecanico", "mecanica", "taller"],
    vehiculo: ["vehiculo", "mecanica", "taller", "gomeria"],
    corte: ["corte", "peluqueria", "barberia"],
    pelo: ["pelo", "peluqueria", "barberia"],
    barbero: ["barbero", "barberia", "peluqueria"],
    ninos: ["ninos", "ninez", "infantil", "escuela"],
    infancia: ["infancia", "ninez", "infantil", "desarrollo infantil"],
    guarderia: ["guarderia", "desarrollo infantil", "jardin", "infantil"],
    concejo: ["concejo", "deliberante"],
    deliberante: ["deliberante", "concejo"],
    licencia: ["licencia", "conducir", "carnet"],
    licencias: ["licencia", "conducir", "carnet"],
    carnet: ["carnet", "licencia", "conducir"],
    conducir: ["conducir", "licencia", "carnet"],
    contralor: ["contralor", "licencia", "conducir"],
    comisaria: ["comisaria", "policia", "seguridad"],
    radio: ["radio", "emisora", "frecuencia"],
    emisora: ["emisora", "radio"],
    lavanderia: ["lavanderia", "limpieza"],
    refrigeracion: ["refrigeracion", "refrigerador", "aire"],
    seguros: ["seguros", "seguro", "aseguradora"],
    seguro: ["seguro", "seguros", "aseguradora"],
    distribuidora: ["distribuidora", "distribucion", "proveedor"],
    distribucion: ["distribucion", "distribuidora"],
    parador: ["parador", "comer", "gastronomia"],
    campo: ["campo", "rural", "turismo"],
    servicio: ["servicio", "servicios", "comercio"],
    servicios: ["servicio", "servicios", "comercio"],
    banco: ["banco", "bancos", "cajero", "bpn"],
    bancos: ["banco", "bancos", "cajero", "bpn"],
    bpn: ["bpn", "banco"],
    cajero: ["cajero", "banco", "extraccion"],
    correo: ["correo", "postal", "paqueteria"],
    postal: ["postal", "correo"],
    paqueteria: ["paqueteria", "correo"],
    issn: ["issn", "obra social", "jubilacion", "prevision"],
    jubilacion: ["jubilacion", "issn", "prevision"],
    juzgado: ["juzgado", "paz", "faltas"],
    paz: ["paz", "juzgado"]
  };

  function matchingTerms(term) {
    return synonymMap[term] || [term];
  }

  const stopWords = new Set(["de", "del", "la", "el", "los", "las", "y", "en", "para", "por", "un", "una", "a", "con", "que", "mi", "me", "al"]);

  function termMatches(contact, text, term) {
    if (term === "telefono" || term === "telefonos") return (contact.telefonos || []).length > 0;
    return matchingTerms(term).some(candidate => text.includes(candidate));
  }

  function visibleContacts() {
    const terms = normalize(search.value).split(" ").filter(term => term && !stopWords.has(term));
    return contacts.filter(contact => {
      const selectedGroup = categoryMap.find(item => item.key === activeCategory);
      const matchesCategory = activeCategory === "Todos" || Boolean(selectedGroup?.keys.includes(contact.categoria));
      const hasPhone = (contact.telefonos || []).length > 0;
      const matchesPhone = !phoneOnly?.checked || hasPhone;
      const matchesAddress = !addressOnly?.checked || Boolean(contact.direccion);
      const matchesFavorite = !showFavoritesOnly || favoriteIds.has(contact.id);
      const text = searchText(contact);
      return matchesCategory && matchesPhone && matchesAddress && matchesFavorite && terms.every(term => termMatches(contact, text, term));
    }).sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es-AR"));
  }

  function card(contact) {
    const phones = (contact.telefonos || []).map(phone => `
      <div class="data-row data-row-phone">
        <span class="data-label">TELÉFONO PUBLICADO · ${escapeHtml(contact.fuenteTipo === "mapa" ? "REFERENCIA" : (phone.uso || "CONTACTO"))}</span>
        <span class="data-value phone-number" aria-label="Número publicado como referencia">${escapeHtml(phone.numero)}</span>
      </div>`).join("");

    const address = contact.direccion ? `
      <div class="data-row data-row-address"><span class="data-label">Ubicación</span><span class="data-value data-address">${escapeHtml(contact.direccion)}</span></div>` : "";

    const mapUrl = contact.direccion ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(contact.direccion) : "";
    const mapLink = mapUrl ? `<a class="map-location-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">Ver ubicación aproximada en mapas ↗</a>` : "";

    const email = contact.correo ? `
      <div class="data-row data-row-email">
        <span class="data-label">Correo publicado</span>
        <span class="data-value data-email">${escapeHtml(contact.correo)}</span>
      </div>` : "";

    const source = sourceInfo(contact);
    const sourceUrl = safeSource(contact.fuente);
    const sourceName = contact.fuenteNombre ? `<span class="source-publisher">${escapeHtml(contact.fuenteNombre)}</span>` : "";
    const sourceLink = sourceUrl
      ? `<a class="card-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Consultar fuente: ${escapeHtml(contact.fuenteNombre || source.label)}">
          <span>${contact.fuenteTipo === "mapa" ? "Buscar referencia en mapas" : "Ver dónde se publicó"}</span><span aria-hidden="true">↗</span>
        </a>`
      : `<span class="card-source-unavailable">Fuente web no disponible en esta ficha.</span>`;

    return `
      <article data-contact-id="${escapeHtml(contact.id)}" class="contact-card tone-card-${escapeHtml(categoryTone(contact.categoria))} status-${escapeHtml(contact.estadoContacto || "sin-contacto")}">
        <div class="card-heading">
          <span class="category-label tone-${escapeHtml(categoryTone(contact.categoria))}">${escapeHtml(categoryLabel(contact.categoria))}</span>
          <span class="source-type source-type-${escapeHtml(contact.fuenteTipo || "sin-fuente")}">${escapeHtml(source.label)}</span>
        </div>
        <h4>${escapeHtml(contact.nombre)}</h4>
        <p class="contact-description">${escapeHtml(contact.descripcion)}</p>
        <div class="card-actions">
          <button class="card-action favorite-action" type="button" data-favorite-id="${escapeHtml(contact.id)}" aria-pressed="${favoriteIds.has(contact.id)}">${favoriteIds.has(contact.id) ? "★ Guardado" : "☆ Guardar lugar"}</button>
          <button class="card-action copy-card-action" type="button" data-copy-contact-id="${escapeHtml(contact.id)}">Copiar ficha</button>
        </div>
        ${phones || address || email ? `<div class="data-list">${phones}${address}${email}</div>` : `<p class="no-contact-data">No se encontró un teléfono público para esta ficha. Consultá su fuente.</p>`}
        ${contactStatusInfo(contact) ? `<p class="contact-verification"><strong>${escapeHtml(contactStatusInfo(contact)[0])}.</strong> ${escapeHtml(contactStatusInfo(contact)[1])}</p>` : ""}
        ${mapLink}
        <details class="source-details">
          <summary>Ver fuente y procedencia</summary>
          <div class="source-details-content">
            <p class="source-note">${escapeHtml(source.note)} Los datos pueden cambiar.</p>
            ${sourceName}${sourceLink}
          </div>
        </details>
      </article>`;
  }

  updateFavoritesControls();

  function renderFilters() {
    filters.innerHTML = categoryMap.map(item => {
      const total = item.key === "Todos"
        ? contacts.length
        : contacts.filter(contact => item.keys.includes(contact.categoria)).length;
      return `<button class="filter-button" type="button" data-category="${escapeHtml(item.key)}"
        aria-pressed="${item.key === activeCategory}">
        <span>${escapeHtml(item.label)}</span><span class="filter-count">${total}</span>
      </button>`;
    }).join("");
  }

  function render() {
    try {
    const visible = visibleContacts();
    const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const pageItems = visible.slice(start, start + pageSize);
    $("exportResultsButton").disabled = visible.length === 0;
    $("exportResultsButton").textContent = visible.length
      ? "Descargar listado · " + visible.length
      : "Sin resultados para descargar";
    $("copyResultsButton").disabled = visible.length === 0;
    $("copyResultsButton").textContent = visible.length
      ? "Copiar resultados · " + visible.length
      : "Sin resultados para copiar";
    grid.innerHTML = pageItems.map(card).join("");
    count.textContent = visible.length + (visible.length === 1 ? " resultado" : " resultados")
      + (visible.length > pageSize ? " · mostrando " + (start + 1) + "–" + Math.min(start + pageSize, visible.length) : "");
    const pagination = $("pagination");
    pagination.hidden = visible.length <= pageSize;
    $("previousPage").disabled = currentPage <= 1;
    $("nextPage").disabled = currentPage >= pageCount;
    $("pageStatus").textContent = "Página " + currentPage + " de " + pageCount;
    const endNote = $("resultsEndNote");
    if (endNote) endNote.hidden = visible.length === 0;
    resultsContext.textContent = (activeCategory === "Todos" ? "Todos los temas" : categoryMap.find(item => item.key === activeCategory)?.label || activeCategory) + (phoneOnly?.checked ? " · Solo con teléfono" : "") + (showFavoritesOnly ? " · Solo guardados" : "") + (addressOnly?.checked ? " · Solo con dirección" : "");
    updateFavoritesControls();
    resultsTitle.textContent = search.value.trim() ? "Resultados de tu búsqueda" : "Información disponible";
    empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
    if (visible.length === 0 && showFavoritesOnly && favoriteIds.size === 0) {
      empty.querySelector("h3").textContent = "Todavía no guardaste lugares.";
      empty.querySelector("p").textContent = "Volvé a todos los temas y tocá “Guardar lugar” en las fichas que quieras tener a mano.";
    } else if (visible.length === 0 && showFavoritesOnly) {
      empty.querySelector("h3").textContent = "No hay lugares guardados que coincidan.";
      empty.querySelector("p").textContent = "Probá quitar la búsqueda o algún filtro para ver tus lugares guardados.";
    } else if (visible.length === 0 && addressOnly?.checked) {
      empty.querySelector("h3").textContent = "No hay direcciones en esta selección.";
      empty.querySelector("p").textContent = "Probá quitar este filtro o elegir otro tema.";
    } else if (visible.length === 0 && phoneOnly?.checked) {
      empty.querySelector("h3").textContent = "No hay fichas con teléfono en esta selección.";
      empty.querySelector("p").textContent = "Probá quitar ese filtro o elegir otro tema.";
    } else if (visible.length === 0) {
      empty.querySelector("h3").textContent = "No encontramos ese dato.";
      empty.querySelector("p").textContent = "Probá con una palabra más corta o volvé a ver todos los temas.";
    }
    clear.hidden = !search.value;
    document.querySelectorAll(".quick-chip").forEach(button => {
      const isCategory = button.dataset.category && button.dataset.category === activeCategory;
      const isSearch = button.dataset.query && normalize(search.value) === normalize(button.dataset.query);
      button.setAttribute("aria-pressed", String(Boolean(isCategory || isSearch)));
    });
    filters.querySelectorAll("button[data-category]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory));
    });
    } catch (error) {
      console.error("Chañar a Mano: error al actualizar la agenda:", error);
      grid.hidden = true;
      appStatus.hidden = false;
      appStatus.classList.add("app-status-error");
      appStatus.textContent = "No pudimos mostrar esta consulta. Probá borrar la búsqueda o recargar la página.";
    }
  }

  function resetGuide() {
    currentPage = 1;
    activeCategory = "Todos";
    search.value = "";
    if (phoneOnly) phoneOnly.checked = false;
    if (addressOnly) addressOnly.checked = false;
    showFavoritesOnly = false;
    render();
  }

  filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    currentPage = 1;
    const topicPanel = $("topicPanel");
    if (topicPanel) topicPanel.open = false;
    render();
    $("resultsTitle").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  search.addEventListener("input", () => { currentPage = 1; render(); });
  $("favoritesToggle").addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    currentPage = 1;
    render();
    $("resultsTitle").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("clearFavorites").addEventListener("click", () => {
    if (!favoriteIds.size) return;
    if (!window.confirm("¿Querés borrar todos los lugares guardados de este dispositivo?")) return;
    favoriteIds.clear();
    showFavoritesOnly = false;
    saveFavorites();
    render();
  });
  grid.addEventListener("click", async event => {
    const favoriteButton = event.target.closest("[data-favorite-id]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.favoriteId;
      if (!contacts.some(contact => contact.id === id)) return;
      if (favoriteIds.has(id)) favoriteIds.delete(id);
      else favoriteIds.add(id);
      saveFavorites();
      render();
      return;
    }
    const copyButton = event.target.closest("[data-copy-contact-id]");
    if (copyButton) {
      const contact = contacts.find(item => item.id === copyButton.dataset.copyContactId);
      if (!contact) return;
      const lines = [
        contact.nombre,
        contact.categoria,
        contact.descripcion,
        ...(contact.telefonos || []).map(phone => "Teléfono publicado: " + phone.numero + (phone.uso ? " · " + phone.uso : "")),
        contact.direccion ? "Dirección: " + contact.direccion : "",
        contact.correo ? "Correo publicado: " + contact.correo : "",
        "Fuente: " + (contact.fuenteNombre || "Fuente indicada"),
        contact.fuente || "",
        "Dato de referencia: puede cambiar. Revisá la fuente antes de usarlo.",
        "Chañar a Mano · Universo Ocarina - Elías Martínez"
      ].filter(Boolean);
      try {
        await copyText(lines.join("\n"));
        shareFeedback.textContent = "Ficha copiada. Podés pegarla en una nota o mensaje.";
      } catch (_) {
        shareFeedback.textContent = "No se pudo copiar. Podés seleccionar los datos de la ficha manualmente.";
      }
    }
  });
  phoneOnly?.addEventListener("change", () => { currentPage = 1; render(); });
  addressOnly?.addEventListener("change", () => { currentPage = 1; render(); });
  $("clearAllFilters").addEventListener("click", resetGuide);
  $("previousPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      render();
      $("directoryTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  $("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(visibleContacts().length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      render();
      $("directoryTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  document.querySelectorAll(".quick-chip").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "Todos";
      currentPage = 1;
      search.value = button.dataset.query || "";
      render();
      $("resultsTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  function applyFontScale(next) {
    fontScale = Math.max(1, Math.min(2, Math.round(next * 100) / 100));
    document.body.classList.toggle("easy-reading", fontScale >= 1.25);
    document.documentElement.style.setProperty("--reading-scale", String(fontScale));
    $("fontDown").disabled = fontScale <= 1;
    $("fontUp").disabled = fontScale >= 2;
    $("fontReset").setAttribute("aria-label", "Tamaño de texto actual: " + Math.round(fontScale * 100) + " por ciento. Restablecer");
    const fontStatus = $("fontScaleStatus");
    if (fontStatus) fontStatus.textContent = Math.round(fontScale * 100) + "%";
  }
  $("fontDown").addEventListener("click", () => { applyFontScale(fontScale - 0.1); document.body.classList.toggle("easy-reading", fontScale >= 1.25); saveAppearance(); });
  $("fontUp").addEventListener("click", () => { applyFontScale(fontScale + 0.1); document.body.classList.add("easy-reading"); saveAppearance(); });
  $("fontReset").addEventListener("click", () => { applyFontScale(1.25); document.body.classList.add("easy-reading"); saveAppearance(); });

  const brightnessControl = $("brightnessControl");
  const contrastControl = $("contrastControl");
  const appearanceStatus = $("appearanceStatus");
  const appearanceDefaults = { brightness: 100, contrast: 110, theme: "natural", font: 1.25 };

  function saveAppearance() {
    try {
      localStorage.setItem("chanar-a-mano-appearance-v2", JSON.stringify({
        brightness: Number(brightnessControl.value),
        contrast: Number(contrastControl.value),
        theme: document.body.dataset.theme || "natural",
        font: fontScale
      }));
      if (appearanceStatus) appearanceStatus.textContent = "Ajustes guardados en este dispositivo.";
    } catch (_) {
      if (appearanceStatus) appearanceStatus.textContent = "Los ajustes funcionan mientras esta página esté abierta.";
    }
  }

  function applyBrightness(value, announce = true) {
    const amount = Math.max(80, Math.min(120, Number(value) || 100));
    brightnessControl.value = String(amount);
    document.documentElement.style.setProperty("--visual-brightness", String(amount / 100));
    $("brightnessValue").textContent = amount + "%";
    if (announce) saveAppearance();
  }

  function applyContrast(value, announce = true) {
    const amount = Math.max(80, Math.min(140, Number(value) || 100));
    contrastControl.value = String(amount);
    document.documentElement.style.setProperty("--visual-contrast", String(amount / 100));
    $("contrastValue").textContent = amount + "%";
    if (announce) saveAppearance();
  }

  function applyTheme(theme, announce = true) {
    const safeTheme = ["natural", "high", "night"].includes(theme) ? theme : "natural";
    document.body.dataset.theme = safeTheme;
    document.documentElement.style.colorScheme = safeTheme === "night" ? "dark" : "light";
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = safeTheme === "night" ? "#17221b" : safeTheme === "high" ? "#ffffff" : "#f7f6f0";
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === safeTheme));
    });
    if (announce) saveAppearance();
  }

  function applyAppearancePreset(preset) {
    if (preset === "elderly" || preset === "readable") {
      applyBrightness(100, false);
      applyContrast(120, false);
      applyTheme("natural", false);
      applyFontScale(1.5);
      document.body.classList.add("easy-reading");
      if (appearanceStatus) appearanceStatus.textContent = "Vista fácil activada: letras y teléfonos más grandes.";
    } else if (preset === "night") {
      applyBrightness(90, false);
      applyContrast(110, false);
      applyTheme("night", false);
      applyFontScale(1.3);
      document.body.classList.add("easy-reading");
      if (appearanceStatus) appearanceStatus.textContent = "Modo noche activado.";
    } else if (preset === "contrast") {
      applyBrightness(100, false);
      applyContrast(115, false);
      applyTheme("high", false);
      applyFontScale(1.3);
      document.body.classList.add("easy-reading");
      if (appearanceStatus) appearanceStatus.textContent = "Alto contraste activado.";
    } else {
      return;
    }
    saveAppearance();
  }

  document.querySelectorAll("[data-appearance-preset]").forEach(button => {
    button.addEventListener("click", () => applyAppearancePreset(button.dataset.appearancePreset));
  });

  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.addEventListener("click", () => applyTheme(button.dataset.themeChoice));
  });
  brightnessControl.addEventListener("input", () => applyBrightness(brightnessControl.value));
  contrastControl.addEventListener("input", () => applyContrast(contrastControl.value));

  function resetAppearance() {
    applyBrightness(appearanceDefaults.brightness, false);
    applyContrast(appearanceDefaults.contrast, false);
    applyTheme(appearanceDefaults.theme, false);
    applyFontScale(appearanceDefaults.font);
    saveAppearance();
    if (appearanceStatus) appearanceStatus.textContent = "Se restablecieron los ajustes.";
  }

  $("resetAppearance").addEventListener("click", resetAppearance);

  try {
    const currentSaved = localStorage.getItem("chanar-a-mano-appearance-v2");
    const legacySaved = currentSaved ? null : localStorage.getItem("chanar-a-mano-appearance");
    const saved = JSON.parse(currentSaved || legacySaved || "null");
    if (saved && typeof saved === "object") {
      applyBrightness(saved.brightness, false);
      applyContrast(saved.contrast, false);
      applyTheme(saved.theme, false);
      const savedFont = Number(saved.font);
      // En la primera migración damos una base legible; luego respetamos la elección de la persona.
      applyFontScale(currentSaved
        ? (Number.isFinite(savedFont) ? savedFont : 1.25)
        : (Number.isFinite(savedFont) ? Math.max(1.25, savedFont) : 1.25));
    } else {
      applyBrightness(100, false);
      applyContrast(110, false);
      applyTheme("natural", false);
      applyFontScale(1.25);
    }
    saveAppearance();
  } catch (_) {
    applyBrightness(100, false);
    applyContrast(110, false);
    applyTheme("natural", false);
    applyFontScale(1.25);
  }
  $("searchForm").addEventListener("submit", event => event.preventDefault());
  clear.addEventListener("click", () => {
    search.value = "";
    currentPage = 1;
    render();
    search.focus();
  });
  $("resetFilters").addEventListener("click", () => {
    resetGuide();
    search.focus();
  });

  document.addEventListener("keydown", event => {
    const target = event.target;
    const isTyping = target && (target.matches("input, textarea, select") || target.isContentEditable);
    if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping) {
      event.preventDefault();
      search.focus();
      search.select();
    }
    if (event.key === "Escape" && document.activeElement === search && search.value) {
      search.value = "";
      currentPage = 1;
      render();
    }
  });

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (_) {
        /* Si el portapapeles moderno no está disponible, se intenta el método alternativo. */
      }
    }
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.className = "copy-helper";
    document.body.appendChild(helper);
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) throw new Error("No se pudo copiar automáticamente");
    return true;
  }

  $("copyAliasButton").addEventListener("click", async () => {
    const alias = $("supportAlias").textContent.trim();
    try {
      await copyText(alias);
      copyFeedback.textContent = "Alias copiado. Ya podés pegarlo donde lo necesites.";
    } catch (_) {
      copyFeedback.textContent = "No se pudo copiar automáticamente. Seleccioná el alias: " + alias;
    }
  });

  function updatePrintMeta(total = visibleContacts().length, scope = $("printScope").value) {
    const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date());
    const selected = [];
    if (scope !== "all") {
      if (activeCategory !== "Todos") selected.push(activeCategory);
      if (search.value.trim()) selected.push("Búsqueda: " + search.value.trim());
      if (phoneOnly?.checked) selected.push("solo fichas con teléfono");
      if (addressOnly?.checked) selected.push("solo fichas con dirección");
      if (showFavoritesOnly) selected.push("solo lugares guardados");
    }
    const selection = scope === "all" ? "Guía completa" : (selected.length ? selected.join(" · ") : "Todos los temas");
    $("printHeadingTitle").textContent = scope === "all" ? "Directorio comunitario completo" : "Resultados seleccionados";
    $("directoryTitle").textContent = scope === "all" ? "Directorio comunitario de San Patricio del Chañar" : "Resultados de la selección";
    $("directoryIntro").textContent = "Información pública de referencia. Consultá la fuente indicada en cada ficha.";
    $("printHeadingIntro").textContent = scope === "all"
      ? "Directorio de instituciones, salud, educación, servicios, comercios y comunidad."
      : "Selección de fichas según la búsqueda y los filtros elegidos en pantalla.";
    $("printCoverCount").textContent = String(total);
    $("printMeta").textContent = total + (total === 1 ? " ficha" : " fichas")
      + " · " + date + " · " + selection + " · Universo Ocarina - Elías Martínez";
    $("printUrl").textContent = guideUrl();
  }

  let printPrepared = false;
  function preparePrint() {
    if (printPrepared) return;
    const scope = $("printScope").value;
    const allVisible = scope === "all" ? contacts.slice().sort((a,b) => String(a.nombre).localeCompare(String(b.nombre),"es-AR")) : visibleContacts();
    printPrepared = true;
    grid.innerHTML = allVisible.map(card).join("");
    grid.hidden = allVisible.length === 0;
    $("pagination").hidden = true;
    updatePrintMeta(allVisible.length, scope);
  }

  function restoreAfterPrint() {
    if (!printPrepared) return;
    printPrepared = false;
    $("directoryTitle").textContent = "¿Qué estás buscando?";
    $("directoryIntro").textContent = "Buscá el lugar o servicio que necesitás. Los teléfonos y direcciones se muestran bien grandes.";
    render();
  }

  $("printButton").addEventListener("click", () => {
    updatePrintMeta();
    window.print();
  });
  $("printScope").addEventListener("change", () => {
    $("printButton").textContent = $("printScope").value === "all" ? "Imprimir la guía completa" : "Imprimir los resultados";
  });

  // Exporta todos los resultados actuales, no solo las tarjetas de la página visible.
  // El prefijo BOM facilita la lectura de tildes y eñes en planillas de uso habitual.
  function csvCell(value) {
    let text = String(value ?? "").replace(/\r\n?/g, "\n");
    // Evita que una planilla interprete texto importado como fórmula ejecutable.
    if (/^\s*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function downloadCurrentResultsCsv() {
    const rows = visibleContacts();
    const feedback = $("exportFeedback");
    if (!rows.length) {
      feedback.textContent = "No hay resultados para descargar. Probá quitar algún filtro.";
      return;
    }
    const columns = [
      ["Nombre", contact => contact.nombre],
      ["Tema", contact => categoryLabel(contact.categoria)],
      ["Descripción", contact => contact.descripcion],
      ["Teléfonos publicados", contact => (contact.telefonos || []).map(phone => phone.numero).join(" | ")],
      ["Uso indicado del teléfono", contact => (contact.telefonos || []).map(phone => phone.uso || "").join(" | ")],
      ["Estado documental del contacto", contact => {
        const status = contactStatusInfo(contact);
        return status ? status[0] + ". " + status[1] : "Sin contacto publicado";
      }],
      ["Dirección publicada", contact => contact.direccion || ""],
      ["Correo publicado", contact => contact.correo || ""],
      ["Fuente", contact => contact.fuenteNombre || ""],
      ["Tipo de fuente", contact => sourceInfo(contact).label],
      ["Enlace de la fuente", contact => safeSource(contact.fuente)]
    ];
    const lines = [
      columns.map(([heading]) => csvCell(heading)).join(","),
      ...rows.map(contact => columns.map(([, value]) => csvCell(value(contact))).join(","))
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    link.href = objectUrl;
    link.download = "chanar-a-mano-resultados-" + date + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    feedback.textContent = "Se preparó un archivo con " + rows.length + (rows.length === 1 ? " ficha." : " fichas.") + " Incluye procedencia y advertencias documentales.";
  }

  $("exportResultsButton").addEventListener("click", downloadCurrentResultsCsv);

  async function copyCurrentResults() {
    const rows = visibleContacts();
    const feedback = $("exportFeedback");
    if (!rows.length) {
      feedback.textContent = "No hay resultados para copiar. Probá quitar algún filtro.";
      return;
    }
    const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date());
    const blocks = rows.map((contact, index) => {
      const status = contactStatusInfo(contact);
      const details = [
        (index + 1) + ". " + contact.nombre,
        "Tema: " + categoryLabel(contact.categoria),
        contact.descripcion ? "Descripción: " + contact.descripcion : "",
        ...(contact.telefonos || []).map(phone => "Teléfono publicado: " + phone.numero + (phone.uso ? " · " + phone.uso : "")),
        contact.direccion ? "Dirección publicada: " + contact.direccion : "",
        contact.correo ? "Correo publicado: " + contact.correo : "",
        status ? "Respaldo documental: " + status[0] + ". " + status[1] : "Sin contacto publicado en esta ficha.",
        "Fuente: " + (contact.fuenteNombre || "Fuente indicada"),
        safeSource(contact.fuente)
      ];
      return details.filter(Boolean).join("\n");
    });
    const content = [
      "CHÁÑAR A MANO · Selección de resultados",
      "San Patricio del Chañar, Neuquén · " + date,
      rows.length + (rows.length === 1 ? " ficha" : " fichas"),
      "",
      ...blocks,
      "",
      "AVISO: los teléfonos y direcciones son referencias documentales; pueden cambiar y no se garantiza que las líneas estén activas. Revisá la fuente de cada ficha. Guía independiente, no es un servicio de emergencias.",
      "Universo Ocarina - Elías Martínez"
    ].join("\n\n");
    try {
      await copyText(content);
      feedback.textContent = "Se copiaron " + rows.length + (rows.length === 1 ? " ficha." : " fichas.") + " Podés pegar el listado en una nota o mensaje.";
    } catch (_) {
      feedback.textContent = "No se pudo copiar automáticamente. Probá descargar el CSV o seleccionar las fichas manualmente.";
    }
  }

  $("copyResultsButton").addEventListener("click", copyCurrentResults);
  window.addEventListener("beforeprint", () => {
    updatePrintMeta();
    preparePrint();
  });
  window.addEventListener("afterprint", restoreAfterPrint);

  function guideUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.href;
  }

  function currentSelectionUrl() {
    const url = new URL(guideUrl());
    if (search.value.trim()) url.searchParams.set("buscar", search.value.trim().slice(0, 120));
    if (activeCategory !== "Todos") url.searchParams.set("tema", activeCategory);
    if (phoneOnly.checked) url.searchParams.set("telefono", "1");
    if (addressOnly.checked) url.searchParams.set("direccion", "1");
    return url.href;
  }

  function whatsappMessage() {
    return "Te comparto CHÁÑAR A MANO: una guía comunitaria gratuita de San Patricio del Chañar. Reúne datos útiles para consultar, imprimir y compartir. No requiere registro. Los datos pueden cambiar; revisá la fuente de cada ficha.\n\n" + guideUrl();
  }

  function whatsappUrl() {
    return "https://wa.me/?text=" + encodeURIComponent(whatsappMessage());
  }

  const whatsappShare = $("whatsappShare");
  const mobileWhatsappShare = $("mobileWhatsappShare");
  if (whatsappShare) whatsappShare.href = whatsappUrl();
  if (mobileWhatsappShare) mobileWhatsappShare.href = whatsappUrl();
  $("shareKitWhatsapp").href = whatsappUrl();
  $("shareMessagePreview").textContent = whatsappMessage().replace("\n\n" + guideUrl(), "").trim();

  $("copyShareButton").addEventListener("click", async () => {
    try {
      await copyText(whatsappMessage());
      shareFeedback.textContent = "Mensaje copiado. Pegalo en WhatsApp y enviá el enlace.";
    } catch (_) {
      shareFeedback.textContent = "No se pudo copiar automáticamente. Usá el botón de WhatsApp.";
    }
  });
  $("shareSearchButton").addEventListener("click", async () => {
    const url = currentSelectionUrl();
    const title = "CHÁÑAR A MANO · Mi búsqueda";
    const text = "Te comparto esta búsqueda de la guía comunitaria de San Patricio del Chañar. Al abrir el enlace se recuperan la palabra buscada y los filtros de tema, teléfono o dirección. Los lugares guardados no se incluyen porque son privados de cada dispositivo.";
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        shareFeedback.textContent = "Se abrió el menú para compartir esta búsqueda.";
      } else {
        await copyText(text + "\n\n" + url);
        shareFeedback.textContent = "Enlace de búsqueda copiado. Podés pegarlo en WhatsApp o en otro mensaje.";
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      try {
        await copyText(text + "\n\n" + url);
        shareFeedback.textContent = "Enlace de búsqueda copiado. Podés pegarlo en WhatsApp o en otro mensaje.";
      } catch (_) {
        shareFeedback.textContent = "No se pudo compartir automáticamente. Copiá este enlace desde la barra del navegador: " + url;
      }
    }
  });

  $("shareKitCopyButton").addEventListener("click", async () => {
    try {
      await copyText(whatsappMessage());
      shareFeedback.textContent = "Mensaje y enlace copiados. Abrí WhatsApp, elegí a quién enviarlo y pegá el texto.";
    } catch (_) {
      shareFeedback.textContent = "No se pudo copiar automáticamente. Podés usar el botón de WhatsApp.";
    }
  });

  async function createShareCardFile() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f5eb"/><stop offset="1" stop-color="#e8eee3"/></linearGradient><linearGradient id="hill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#789078"/><stop offset="1" stop-color="#34553f"/></linearGradient></defs>
      <rect width="1200" height="630" fill="url(#bg)"/><rect width="18" height="630" fill="#9b6547"/>
      <circle cx="1040" cy="90" r="180" fill="#e4d8b8" opacity=".55"/>
      <path d="M700 450 C820 300 930 370 1040 290 C1110 240 1160 260 1200 220 L1200 630 L650 630Z" fill="#d2ddca"/>
      <path d="M660 520 C810 400 900 470 1030 380 C1110 325 1160 360 1200 320 L1200 630 L600 630Z" fill="url(#hill)"/>
      <path d="M700 610 C820 540 900 550 1000 500 C1090 455 1140 470 1200 430" fill="none" stroke="#f3e9d0" stroke-width="14" stroke-linecap="round"/>
      <g fill="#34553f"><path d="M930 360l-34 80h68z"/><path d="M930 330l-26 58h52z"/><rect x="925" y="430" width="10" height="32"/><path d="M1080 300l-30 72h60z"/><path d="M1080 275l-23 53h46z"/><rect x="1075" y="370" width="10" height="30"/></g>
      <rect x="72" y="72" width="84" height="84" rx="22" fill="#304b3a"/><text x="114" y="129" text-anchor="middle" font-family="Georgia,serif" font-size="42" font-weight="bold" fill="#fff">Ch</text>
      <text x="190" y="105" font-family="Arial,sans-serif" font-size="19" font-weight="bold" letter-spacing="4" fill="#965b40">SAN PATRICIO DEL CHAÑAR · NEUQUÉN</text>
      <text x="72" y="265" font-family="Georgia,serif" font-size="78" font-weight="bold" fill="#304b3a">CHÁÑAR A MANO</text>
      <text x="76" y="330" font-family="Arial,sans-serif" font-size="33" fill="#965b40" font-weight="bold">Nuestro Chañar, más a mano.</text>
      <text x="76" y="400" font-family="Arial,sans-serif" font-size="25" fill="#26372e">Una guía comunitaria gratuita para encontrar</text>
      <text x="76" y="440" font-family="Arial,sans-serif" font-size="25" fill="#26372e">instituciones, salud, educación, servicios y comercios.</text>
      <g font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="#304b3a">
        <rect x="76" y="500" width="152" height="48" rx="24" fill="#fffefa" stroke="#cbd7c8"/><text x="152" y="531" text-anchor="middle">GRATUITA</text>
        <rect x="242" y="500" width="170" height="48" rx="24" fill="#fffefa" stroke="#cbd7c8"/><text x="327" y="531" text-anchor="middle">SIN REGISTRO</text>
        <rect x="426" y="500" width="230" height="48" rx="24" fill="#fffefa" stroke="#cbd7c8"/><text x="541" y="531" text-anchor="middle">PARA COMPARTIR</text>
      </g>
      <text x="76" y="592" font-family="Arial,sans-serif" font-size="17" fill="#526257">Universo Ocarina - Elías Martínez</text>
    </svg>`;
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    try {
      const picture = new Image();
      await new Promise((resolve, reject) => {
        picture.onload = resolve;
        picture.onerror = () => reject(new Error("No se pudo preparar la tarjeta gráfica."));
        picture.src = objectUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1200; canvas.height = 630;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo preparar la imagen.");
      context.fillStyle = "#f7f5eb"; context.fillRect(0,0,1200,630);
      context.drawImage(picture,0,0,1200,630);
      const png = await new Promise(resolve => canvas.toBlob(resolve,"image/png"));
      if (!png) throw new Error("No se pudo exportar la tarjeta.");
      return new File([png],"chanar-a-mano-compartir.png",{type:"image/png"});
    } finally { URL.revokeObjectURL(objectUrl); }
  }

  $("shareCardButton").addEventListener("click", async () => {
    const button = $("shareCardButton");
    button.disabled = true; button.textContent = "Preparando tarjeta…";
    try {
      const file = await createShareCardFile();
      if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
        await navigator.share({files:[file],title:"CHÁÑAR A MANO",text:whatsappMessage()});
        shareFeedback.textContent = "Tarjeta lista para compartir. Elegí WhatsApp en el menú del teléfono.";
      } else {
        const downloadUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = downloadUrl; link.download = file.name;
        document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
        try { await copyText(whatsappMessage()); } catch (_) {}
        shareFeedback.textContent = "La tarjeta se descargó y el mensaje quedó preparado. En WhatsApp, adjuntá la imagen y pegá el enlace.";
      }
    } catch (error) {
      if (error && error.name === "AbortError") shareFeedback.textContent = "No se compartió la tarjeta. Podés intentarlo cuando quieras.";
      else shareFeedback.textContent = "No se pudo generar la tarjeta en este equipo. Usá el mensaje de WhatsApp.";
    } finally { button.disabled = false; button.textContent = "Compartir tarjeta gráfica"; }
  });


  async function shareGuide() {
    const shareData = {
      title: "CHÁÑAR A MANO",
      text: "Agenda comunitaria gratuita de San Patricio del Chañar.",
      url: guideUrl()
    };
    shareFeedback.textContent = "";
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        shareFeedback.textContent = "Se abrió el menú para compartir. Elegí WhatsApp u otra aplicación.";
      } else {
        await copyText(whatsappMessage());
        shareFeedback.textContent = "Mensaje y enlace copiados. Ya podés pegarlos en WhatsApp.";
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        shareFeedback.textContent = "No se compartió. Podés intentarlo cuando quieras.";
        return;
      }
      try {
        await copyText(whatsappMessage());
        shareFeedback.textContent = "No se pudo abrir el menú. El mensaje quedó copiado para compartirlo manualmente.";
      } catch (_) {
        shareFeedback.textContent = "No se pudo compartir automáticamente. Usá el botón de WhatsApp.";
      }
    }
  }

  $("shareButton").addEventListener("click", shareGuide);
  $("mobileSearchButton").addEventListener("click", () => {
    $("directoryTitle").scrollIntoView({ behavior: "smooth", block: "start" });
    search.focus({ preventScroll: true });
  });

  function updateConnectionStatus() {
    appStatus.classList.remove("app-status-offline");
    if (!navigator.onLine) {
      appStatus.hidden = false;
      appStatus.classList.add("app-status-offline");
      appStatus.textContent = "Estás sin conexión. Podés consultar la guía guardada en este dispositivo; los enlaces externos necesitan internet.";
    } else if (hasDataWarnings) {
      appStatus.hidden = false;
      appStatus.classList.add("app-status-warning");
      appStatus.textContent = "Algunas fichas no se pudieron cargar porque sus datos necesitan revisión. La información restante sigue disponible.";
    } else {
      appStatus.hidden = true;
      appStatus.textContent = "";
    }
  }
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  updateConnectionStatus();

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      const hadController = Boolean(navigator.serviceWorker.controller);
      if (hadController) {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // El documento actual conserva el JS/CSS anterior: recargar una sola vez
          // cuando el service worker nuevo toma el control evita mezclar versiones.
          window.location.reload();
        }, { once: true });
      }
      navigator.serviceWorker.register(new URL("./sw.js", document.baseURI).toString())
        .then(registration => registration.update().catch(() => {}))
        .catch(error => console.warn("No se pudo activar el modo sin conexión:", error));
    }, { once: true });
  }

  if (!contacts.length) {
    grid.hidden = true;
    appStatus.hidden = false;
    appStatus.classList.add("app-status-error");
    appStatus.textContent = "La agenda no pudo cargar sus fichas. Recargá la página más tarde.";
    empty.hidden = false;
    empty.querySelector("h3").textContent = "La guía no pudo cargar los datos.";
    empty.querySelector("p").textContent = "Volvé a cargar la página más tarde.";
    $("searchForm").hidden = true;
    filters.hidden = true;
    const readingTools = document.querySelector(".reading-tools");
    if (readingTools) readingTools.hidden = true;
  } else {
    renderFilters();
    render();
  }
})();