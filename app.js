(() => {
  "use strict";
  const contacts = Array.isArray(window.CHANAR_CONTACTOS) ? window.CHANAR_CONTACTOS : [];
  const grid = document.getElementById("contactGrid");
  const filters = document.getElementById("filters");
  const search = document.getElementById("searchInput");
  const clear = document.getElementById("clearSearch");
  const count = document.getElementById("resultCount");
  const empty = document.getElementById("emptyState");
  let activeCategory = "Todos";

  const categoryMap = [
    {label:"Ver todo", key:"Todos"},
    {label:"Municipio", key:"Organismos públicos"},
    {label:"Comunidad", key:"Comunidad"},
    {label:"Trabajo", key:"Trabajo y producción"},
    {label:"Educación", key:"Educación"},
    {label:"Salud", key:"Salud y cuidados"}
  ];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }

  filters.innerHTML = categoryMap.map(item =>
    `<button class="filter-button" type="button" data-category="${escapeHtml(item.key)}" aria-pressed="${item.key === activeCategory}">${escapeHtml(item.label)}</button>`
  ).join("");

  function visibleContacts() {
    const term = search.value.trim().toLocaleLowerCase("es-AR");
    return contacts.filter(contact => {
      const matchesCategory = activeCategory === "Todos" || contact.categoria === activeCategory;
      const haystack = [contact.nombre, contact.categoria, contact.descripcion,
        ...(contact.telefonos || []).flatMap(phone => [phone.numero, phone.uso]), contact.correo]
        .join(" ").toLocaleLowerCase("es-AR");
      return matchesCategory && haystack.includes(term);
    });
  }

  function card(contact) {
    const phones = (contact.telefonos || []).map(phone =>
      `<div class="phone-row"><span class="phone-purpose">${escapeHtml(phone.uso || "Teléfono")}</span><span class="contact-value" aria-label="Número publicado como referencia">${escapeHtml(phone.numero)}</span></div>`
    ).join("");
    const email = contact.correo
      ? `<div class="phone-row"><span class="phone-purpose">Correo</span><span class="contact-value contact-email">${escapeHtml(contact.correo)}</span></div>`
      : "";
    const sourceLabel = contact.fuenteTipo === "agenda" ? "Directorio provincial"
      : contact.fuenteTipo === "institucional" ? "Directorio institucional" : "Sitio oficial";
    return `<article class="contact-card">
      <p class="category-label">${escapeHtml(categoryMap.find(item => item.key === contact.categoria)?.label || contact.categoria)}</p>
      <h3>${escapeHtml(contact.nombre)}</h3>
      <p class="contact-description">${escapeHtml(contact.descripcion)}</p>
      ${phones || email ? `<div class="phone-list">${phones}${email}</div>` : ""}
      <a class="card-source" href="${escapeHtml(contact.fuente)}" target="_blank" rel="noopener noreferrer">Ver fuente: ${escapeHtml(contact.fuenteNombre || sourceLabel)}</a>
    </article>`;
  }

  function render() {
    const visible = visibleContacts();
    grid.innerHTML = visible.map(card).join("");
    count.textContent = visible.length + (visible.length === 1 ? " resultado" : " resultados");
    empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
    clear.hidden = !search.value;
    filters.querySelectorAll("button").forEach(button =>
      button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory))
    );
  }

  filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    render();
  });
  search.addEventListener("input", render);
  clear.addEventListener("click", () => { search.value = ""; search.focus(); render(); });
  document.getElementById("resetFilters").addEventListener("click", () => {
    activeCategory = "Todos"; search.value = ""; render(); search.focus();
  });

  document.getElementById("copyAliasButton").addEventListener("click", async () => {
    const alias = document.getElementById("supportAlias").textContent.trim();
    const feedback = document.getElementById("copyFeedback");
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(alias);
      else {
        const helper = document.createElement("textarea");
        helper.value = alias; helper.setAttribute("readonly", "");
        helper.style.position = "fixed"; helper.style.opacity = "0";
        document.body.appendChild(helper); helper.select();
        const copied = document.execCommand("copy"); helper.remove();
        if (!copied) throw new Error("No se pudo copiar");
      }
      feedback.textContent = "Alias copiado.";
    } catch (_) {
      feedback.textContent = "Podés copiar este alias: " + alias;
    }
  });

  function updatePrintMeta() {
    const total = visibleContacts().length;
    const date = new Intl.DateTimeFormat("es-AR", {dateStyle:"long"}).format(new Date());
    document.getElementById("printMeta").textContent =
      total + (total === 1 ? " resultado" : " resultados") + " · Consulta: " + date + " · Ocarina Producciones";
  }
  document.getElementById("printButton").addEventListener("click", () => {
    updatePrintMeta();
    window.print();
  });
  window.addEventListener("beforeprint", updatePrintMeta);
  document.getElementById("shareButton").addEventListener("click", async () => {
    const shareData = {title:"Chañar a Mano", text:"Guía comunitaria de San Patricio del Chañar", url:location.href};
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(location.href);
        alert("Enlace copiado. Ya podés compartir la guía.");
      } else alert("Podés compartir el enlace desde la barra del navegador.");
    } catch (error) {
      if (error.name !== "AbortError") alert("No se pudo compartir. Podés copiar el enlace desde el navegador.");
    }
  });
  render();
})();