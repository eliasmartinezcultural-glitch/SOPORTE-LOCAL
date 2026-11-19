(() => {
  "use strict";

  const contacts = Array.isArray(window.CHANAR_CONTACTOS) ? window.CHANAR_CONTACTOS : [];
  const $ = (id) => document.getElementById(id);
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

  const totalContactCount = $("totalContactCount");
  if (totalContactCount) totalContactCount.textContent = String(contacts.length);
  const totalPhoneCount = $("totalPhoneCount");
  if (totalPhoneCount) totalPhoneCount.textContent = String(contacts.filter(contact => (contact.telefonos || []).length > 0).length);

  let activeCategory = "Todos";
  let currentPage = 1;
  const pageSize = 12;
  let fontScale = 1;
  const phoneOnly = $("phoneOnly");

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
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
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
      contact.direccion, (contact.telefonos || []).length ? "teléfono teléfonos contacto" : "", ...phoneText
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
      const text = searchText(contact);
      return matchesCategory && matchesPhone && terms.every(term => termMatches(contact, text, term));
    }).sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es-AR"));
  }

  function card(contact) {
    const phones = (contact.telefonos || []).map(phone => `
      <div class="data-row data-row-phone">
        <span class="data-label">${escapeHtml(contact.fuenteTipo === "mapa" ? "Teléfono referenciado · verificar" : (phone.uso || "Teléfono"))}</span>
        <span class="data-value" aria-label="Número publicado como referencia">${escapeHtml(phone.numero)}</span>
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
      <article class="contact-card tone-card-${escapeHtml(categoryTone(contact.categoria))} status-${escapeHtml(contact.estadoContacto || "sin-contacto")}">
        <div class="card-heading">
          <span class="category-label tone-${escapeHtml(categoryTone(contact.categoria))}">${escapeHtml(categoryLabel(contact.categoria))}</span>
          <span class="source-type source-type-${escapeHtml(contact.fuenteTipo || "sin-fuente")}">${escapeHtml(source.label)}</span>
        </div>
        <h4>${escapeHtml(contact.nombre)}</h4>
        <p class="contact-description">${escapeHtml(contact.descripcion)}</p>
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
    const visible = visibleContacts();
    const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const start = (currentPage - 1) * pageSize;
    const pageItems = visible.slice(start, start + pageSize);
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
    resultsContext.textContent = (activeCategory === "Todos" ? "Todos los temas" : categoryMap.find(item => item.key === activeCategory)?.label || activeCategory) + (phoneOnly?.checked ? " · Solo con teléfono" : "");
    resultsTitle.textContent = search.value.trim() ? "Resultados de tu búsqueda" : "Información disponible";
    empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
    if (visible.length === 0 && phoneOnly?.checked) {
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
  }

  function resetGuide() {
    currentPage = 1;
    activeCategory = "Todos";
    search.value = "";
    if (phoneOnly) phoneOnly.checked = false;
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
  phoneOnly?.addEventListener("change", () => { currentPage = 1; render(); });
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
    document.documentElement.style.setProperty("--reading-scale", String(fontScale));
    $("fontDown").disabled = fontScale <= 1;
    $("fontUp").disabled = fontScale >= 2;
    $("fontReset").setAttribute("aria-label", "Tamaño de texto actual: " + Math.round(fontScale * 100) + " por ciento. Restablecer");
    const fontStatus = $("fontScaleStatus");
    if (fontStatus) fontStatus.textContent = Math.round(fontScale * 100) + "%";
  }
  $("fontDown").addEventListener("click", () => applyFontScale(fontScale - 0.1));
  $("fontUp").addEventListener("click", () => applyFontScale(fontScale + 0.1));
  $("fontReset").addEventListener("click", () => applyFontScale(1));

  const brightnessControl = $("brightnessControl");
  const contrastControl = $("contrastControl");
  const appearanceStatus = $("appearanceStatus");
  const appearanceDefaults = { brightness: 100, contrast: 100, theme: "natural", font: 1 };

  function saveAppearance() {
    try {
      localStorage.setItem("chanar-a-mano-appearance", JSON.stringify({
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
    const saved = JSON.parse(localStorage.getItem("chanar-a-mano-appearance") || "null");
    if (saved && typeof saved === "object") {
      applyBrightness(saved.brightness, false);
      applyContrast(saved.contrast, false);
      applyTheme(saved.theme, false);
      if (Number.isFinite(Number(saved.font))) applyFontScale(Number(saved.font));
    } else {
      applyBrightness(100, false);
      applyContrast(100, false);
      applyTheme("natural", false);
      applyFontScale(1);
    }
  } catch (_) {
    applyBrightness(100, false);
    applyContrast(100, false);
    applyTheme("natural", false);
    applyFontScale(1);
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

  function updatePrintMeta() {
    const total = visibleContacts().length;
    const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date());
    $("printMeta").textContent = total + (total === 1 ? " ficha" : " fichas")
      + " · Consulta realizada el " + date + " · Ocarina Producciones";
  }

  $("printButton").addEventListener("click", () => {
    updatePrintMeta();
    window.print();
  });
  window.addEventListener("beforeprint", updatePrintMeta);

  function guideUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.href;
  }

  function whatsappMessage() {
    return "Te comparto CHÁÑAR A MANO: una guía comunitaria gratuita de San Patricio del Chañar. Reúne referencias de instituciones, salud, educación, servicios y comercios. Es independiente; revisá siempre la fuente y la vigencia de cada dato. " + guideUrl();
  }

  const whatsappShare = $("whatsappShare");
  if (whatsappShare) {
    whatsappShare.href = "https://wa.me/?text=" + encodeURIComponent(whatsappMessage());
  }

  $("shareButton").addEventListener("click", async () => {
    const shareData = {
      title: "CHÁÑAR A MANO",
      text: "Guía comunitaria gratuita de San Patricio del Chañar.",
      url: guideUrl()
    };
    shareFeedback.textContent = "";
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        shareFeedback.textContent = "Gracias por compartir la guía.";
      } else {
        await copyText(guideUrl());
        shareFeedback.textContent = "Enlace copiado. Ya podés compartir la guía.";
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      shareFeedback.textContent = "No se pudo abrir el menú para compartir. Podés usar el botón de WhatsApp o copiar el enlace.";
    }
  });

  if (!contacts.length) {
    grid.hidden = true;
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