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
    { label: "Ver todo", key: "Todos", keys: [], terms: [] },
    { label: "Municipio", key: "Municipio", keys: ["Organismos públicos"], terms: ["municipalidad", "organismo", "gobierno", "publico", "publica"] },
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
      return { label: "Directorio provincial", note: "Dato publicado en una agenda provincial." };
    }
    if (contact.fuenteTipo === "institucional") {
      return { label: "Directorio institucional", note: "Dato publicado por una entidad o directorio institucional." };
    }
    if (contact.fuenteTipo === "mapa") {
      return { label: "Referencia en mapas", note: "El enlace abre una búsqueda por nombre en mapas; no confirma por sí solo teléfono, horario ni vigencia del establecimiento." };
    }
    if (contact.fuenteTipo === "oficial") {
      return { label: "Sitio oficial", note: "Dato publicado en un sitio oficial." };
    }
    return { label: "Fuente indicada", note: "Procedencia declarada en esta ficha; revisá el sitio de origen." };
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
    culturales: ["cultural", "cultura", "centro"]
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
      <div class="data-row">
        <span class="data-label">${escapeHtml(contact.fuenteTipo === "mapa" ? "Teléfono referenciado · verificar" : (phone.uso || "Teléfono"))}</span>
        <span class="data-value" aria-label="Número publicado como referencia">${escapeHtml(phone.numero)}</span>
      </div>`).join("");

    const address = contact.direccion ? `
      <div class="data-row"><span class="data-label">Ubicación</span><span class="data-value data-address">${escapeHtml(contact.direccion)}</span></div>` : "";

    const mapUrl = contact.direccion ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(contact.direccion) : "";
    const mapLink = mapUrl ? `<a class="map-location-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">Ver ubicación aproximada en mapas ↗</a>` : "";

    const email = contact.correo ? `
      <div class="data-row">
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
      <article class="contact-card tone-card-${escapeHtml(categoryTone(contact.categoria))}">
        <div class="card-heading">
          <span class="category-label tone-${escapeHtml(categoryTone(contact.categoria))}">${escapeHtml(categoryLabel(contact.categoria))}</span>
          <span class="source-type">${escapeHtml(source.label)}</span>
        </div>
        <h4>${escapeHtml(contact.nombre)}</h4>
        <p class="contact-description">${escapeHtml(contact.descripcion)}</p>
        ${phones || address || email ? `<div class="data-list">${phones}${address}${email}</div>` : `<p class="no-contact-data">No se encontró un teléfono público para esta ficha. Consultá su fuente.</p>`}
        ${mapLink}
        <div class="source-block"><p class="source-note">${escapeHtml(source.note)} Los datos pueden cambiar.</p>${sourceName}${sourceLink}</div>
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
    render();
    $("directoryTitle").scrollIntoView({ behavior: "smooth", block: "start" });
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
    fontScale = Math.max(1, Math.min(1.25, Math.round(next * 100) / 100));
    document.documentElement.style.setProperty("--reading-scale", String(fontScale));
    $("fontDown").disabled = fontScale <= 1;
    $("fontUp").disabled = fontScale >= 1.25;
    $("fontReset").setAttribute("aria-label", "Tamaño de texto actual: " + Math.round(fontScale * 100) + " por ciento. Restablecer");
  }
  $("fontDown").addEventListener("click", () => applyFontScale(fontScale - 0.05));
  $("fontUp").addEventListener("click", () => applyFontScale(fontScale + 0.05));
  $("fontReset").addEventListener("click", () => applyFontScale(1));
  applyFontScale(1);
  $("searchForm").addEventListener("submit", event => event.preventDefault());
  clear.addEventListener("click", () => {
    search.value = "";
    currentPage = 1;
    render();
    search.focus();
  });
  $("showAllButton").addEventListener("click", resetGuide);
  $("resetFilters").addEventListener("click", () => {
    resetGuide();
    search.focus();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.activeElement === search && search.value) {
      search.value = "";
      render();
    }
  });

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
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

  $("shareButton").addEventListener("click", async () => {
    const shareData = {
      title: "Chañar a Mano",
      text: "Guía comunitaria gratuita de San Patricio del Chañar.",
      url: window.location.href
    };
    shareFeedback.textContent = "";
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        shareFeedback.textContent = "Gracias por compartir la guía.";
      } else {
        await copyText(window.location.href);
        shareFeedback.textContent = "Enlace copiado. Ya podés compartir la guía.";
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      shareFeedback.textContent = "No se pudo compartir automáticamente. Podés copiar el enlace desde la barra del navegador.";
    }
  });

  if (!contacts.length) {
    grid.hidden = true;
    empty.hidden = false;
    empty.querySelector("h3").textContent = "La guía no pudo cargar los datos.";
    empty.querySelector("p").textContent = "Volvé a cargar la página más tarde.";
    $("searchForm").hidden = true;
    filters.hidden = true;
    document.querySelector(".quick-search").hidden = true;
    document.querySelector(".reading-tools").hidden = true;
  } else {
    renderFilters();
    render();
  }
})();