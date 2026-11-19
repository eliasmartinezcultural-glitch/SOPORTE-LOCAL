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

  const categoryMap = [
    { label: "Ver todo", key: "Todos", terms: [] },
    { label: "Municipio", key: "Organismos públicos", terms: ["municipalidad", "organismo", "gobierno", "publico", "publica"] },
    { label: "Comunidad", key: "Comunidad", terms: ["parroquia", "religion", "culto", "organizacion"] },
    { label: "Trabajo", key: "Trabajo y producción", terms: ["empleo", "produccion", "productores", "rural", "renatre"] },
    { label: "Educación", key: "Educación", terms: ["escuela", "colegio", "educacion", "formacion", "estudio"] },
    { label: "Salud", key: "Salud y cuidados", terms: ["hospital", "salud", "ninez", "cuidados"] }
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
    return { label: "Sitio oficial", note: "Fuente institucional indicada en esta ficha." };
  }

  function safeSource(value) {
    try {
      const url = new URL(String(value || ""));
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
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
      ...phoneText, ...aliases
    ].join(" "));
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

    const email = contact.correo ? `
      <div class="data-row">
        <span class="data-label">Correo publicado</span>
        <span class="data-value data-email">${escapeHtml(contact.correo)}</span>
      </div>` : "";

    const source = sourceInfo(contact);
    const sourceUrl = safeSource(contact.fuente);
    const sourceLink = sourceUrl
      ? `<a class="card-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">
          <span>Consultar fuente</span><span aria-hidden="true">↗</span>
        </a>`
      : `<span class="card-source-unavailable">Fuente web no disponible en esta ficha.</span>`;

    return `
      <article class="contact-card">
        <div class="card-heading">
          <span class="category-label">${escapeHtml(categoryLabel(contact.categoria))}</span>
          <span class="source-type">${escapeHtml(source.label)}</span>
        </div>
        <h4>${escapeHtml(contact.nombre)}</h4>
        <p class="contact-description">${escapeHtml(contact.descripcion)}</p>
        ${phones || email ? `<div class="data-list">${phones}${email}</div>` : `<p class="no-contact-data">Esta ficha no contiene un teléfono o correo publicado.</p>`}
        <p class="source-note">${escapeHtml(source.note)} Los datos pueden cambiar.</p>
        ${sourceLink}
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
    resultsContext.textContent = activeCategory === "Todos" ? "Todos los temas" : categoryLabel(activeCategory);
    resultsTitle.textContent = search.value.trim() ? "Resultados de tu búsqueda" : "Información disponible";
    empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
    clear.hidden = !search.value;
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
  } else {
    renderFilters();
    render();
  }
})();