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

  let activeCategory = "Todos";
  let fontScale = 1;

  const categoryMap = [
    { label: "Ver todo", key: "Todos", terms: [] },
    { label: "Municipio", key: "Organismos públicos", terms: ["municipalidad", "organismo", "gobierno", "publico", "publica"] },
    { label: "Comunidad", key: "Comunidad", terms: ["parroquia", "religion", "culto", "organizacion"] },
    { label: "Trabajo y producción", key: "Trabajo y producción", terms: ["empleo", "produccion", "productores", "rural", "renatre", "agro"] },
    { label: "Educación", key: "Educación", terms: ["escuela", "colegio", "educacion", "formacion", "estudio", "jardin"] },
    { label: "Salud y cuidados", key: "Salud y cuidados", terms: ["hospital", "salud", "ninez", "cuidados", "farmacia", "veterinaria"] },
    { label: "Servicios públicos", key: "Servicios públicos", terms: ["epen", "energia", "electricidad", "servicios"] },
    { label: "Deportes", key: "Deportes y recreación", terms: ["deporte", "club", "polideportivo", "estadio", "recreacion"] },
    { label: "Cultura y comunidad", key: "Cultura y comunidad", terms: ["cultura", "biblioteca", "centro cultural", "plaza", "balneario"] },
    { label: "Turismo y gastronomía", key: "Turismo y gastronomía", terms: ["turismo", "gastronomia", "restaurante", "comer", "alojamiento", "hotel", "visitas"] },
    { label: "Turismo y alojamiento", key: "Turismo y alojamiento", terms: ["alojamiento", "hotel", "hosteria", "hospedaje"] },
    { label: "Turismo y producción", key: "Turismo y producción", terms: ["bodega", "visitas", "establecimiento"] },
    { label: "Comercios y servicios", key: "Comercios y servicios", terms: ["comercio", "panaderia", "ferreteria", "corralon", "negocio"] },
    { label: "Educación y cuidados", key: "Educación y cuidados", terms: ["cdi", "infantil", "cuidados"] }
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
      return { label: "Ficha de ubicación", note: "Datos de una ficha pública de mapas; verificá dirección y vigencia antes de concurrir." };
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
    return categoryMap.find(item => item.key === key)?.label || key || "Otros";
  }

  function searchText(contact) {
    const phoneText = (contact.telefonos || [])
      .flatMap(phone => [phone.numero, phone.uso]);
    const aliases = categoryMap.find(item => item.key === contact.categoria)?.terms || [];
    return normalize([
      contact.nombre, contact.categoria, contact.descripcion, contact.correo,
      contact.fuenteNombre, contact.fuenteTipo, contact.direccion, ...phoneText, ...aliases
    ].join(" ")) + " " + normalize([contact.nombre, contact.categoria, contact.descripcion, contact.correo, ...phoneText].join(" ")).replace(/[^0-9]/g, "");
  }

  function visibleContacts() {
    const terms = normalize(search.value).split(" ").filter(Boolean);
    return contacts.filter(contact => {
      const matchesCategory = activeCategory === "Todos" || contact.categoria === activeCategory;
      const text = searchText(contact);
      return matchesCategory && terms.every(term => text.includes(term));
    }).sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es-AR"));
  }

  function card(contact) {
    const phones = (contact.telefonos || []).map(phone => `
      <div class="data-row">
        <span class="data-label">${escapeHtml(phone.uso || "Teléfono")}</span>
        <span class="data-value" aria-label="Número publicado como referencia">${escapeHtml(phone.numero)}</span>
      </div>`).join("");

    const address = contact.direccion ? `
      <div class="data-row"><span class="data-label">Ubicación</span><span class="data-value data-address">${escapeHtml(contact.direccion)}</span></div>` : "";

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
          <span>${contact.fuenteTipo === "mapa" ? "Ver ficha de ubicación" : "Ver dónde se publicó"}</span><span aria-hidden="true">↗</span>
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
        <div class="source-block"><p class="source-note">${escapeHtml(source.note)} Los datos pueden cambiar.</p>${sourceName}${sourceLink}</div>
      </article>`;
  }

  function renderFilters() {
    filters.innerHTML = categoryMap.map(item => {
      const total = item.key === "Todos"
        ? contacts.length
        : contacts.filter(contact => contact.categoria === item.key).length;
      return `<button class="filter-button" type="button" data-category="${escapeHtml(item.key)}"
        aria-pressed="${item.key === activeCategory}">
        <span>${escapeHtml(item.label)}</span><span class="filter-count">${total}</span>
      </button>`;
    }).join("");
  }

  function render() {
    const visible = visibleContacts();
    grid.innerHTML = visible.map(card).join("");
    count.textContent = visible.length + (visible.length === 1 ? " resultado" : " resultados");
    const endNote = $("resultsEndNote");
    if (endNote) endNote.hidden = visible.length === 0;
    resultsContext.textContent = activeCategory === "Todos" ? "Todos los temas" : categoryLabel(activeCategory);
    resultsTitle.textContent = search.value.trim() ? "Resultados de tu búsqueda" : "Información disponible";
    empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
    clear.hidden = !search.value;
    document.querySelectorAll(".quick-chip").forEach(button => {
      button.setAttribute("aria-pressed", String(normalize(search.value) === normalize(button.dataset.query)));
    });
    filters.querySelectorAll("button[data-category]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory));
    });
  }

  function resetGuide() {
    activeCategory = "Todos";
    search.value = "";
    render();
  }

  filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    render();
    $("directoryTitle").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  search.addEventListener("input", render);
  document.querySelectorAll(".quick-chip").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = "Todos";
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