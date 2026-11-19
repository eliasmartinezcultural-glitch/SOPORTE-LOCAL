(() => {
  const contacts = Array.isArray(window.CHANAR_CONTACTOS) ? window.CHANAR_CONTACTOS : [];
  const grid = document.getElementById("contactGrid");
  const filters = document.getElementById("filters");
  const search = document.getElementById("searchInput");
  const clear = document.getElementById("clearSearch");
  const count = document.getElementById("resultCount");
  const empty = document.getElementById("emptyState");
  let activeCategory = "Todos";
  const categories = ["Todos", ...new Set(contacts.map(c => c.categoria))];
  filters.innerHTML = categories.map(category =>
    `<button class="filter-button" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category)}</button>`
  ).join("");
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }
  function telHref(number) { return "tel:" + String(number).replace(/[^+0-9]/g, ""); }
  function card(contact) {
    const phones = (contact.telefonos || []).map(phone =>
      `<div class="phone-row"><span class="phone-purpose">${escapeHtml(phone.uso)}</span><a class="phone-link" href="${telHref(phone.numero)}">${escapeHtml(phone.numero)}</a></div>`
    ).join("");
    const email = contact.correo ? `<div class="phone-row"><span class="phone-purpose">Correo</span><a class="phone-link" href="mailto:${escapeHtml(contact.correo)}">${escapeHtml(contact.correo)}</a></div>` : "";
    const status = contact.fuenteTipo === "agenda" ? '<span class="status secondary">Agenda provincial</span>' : contact.fuenteTipo === "institucional" ? '<span class="status secondary">Fuente institucional</span>' : '<span class="status">Sitio oficial</span>';
    return `<article class="contact-card">
      <div class="card-top"><span class="category-label">${escapeHtml(contact.categoria)}</span>${status}</div>
      <h3>${escapeHtml(contact.nombre)}</h3><p class="contact-description">${escapeHtml(contact.descripcion)}</p>
      <div class="phone-list">${phones}${email}</div>
      <a class="card-source" href="${escapeHtml(contact.fuente)}" target="_blank" rel="noopener noreferrer">Consultar fuente: ${escapeHtml(contact.fuenteNombre || "sitio institucional")}</a>
    </article>`;
  }
  function render() {
    const term = search.value.trim().toLocaleLowerCase("es-AR");
    const visible = contacts.filter(c => {
      const matchesCategory = activeCategory === "Todos" || c.categoria === activeCategory;
      const haystack = [c.nombre,c.categoria,c.descripcion,...(c.telefonos || []).map(p => p.numero),c.correo].join(" ").toLocaleLowerCase("es-AR");
      return matchesCategory && haystack.includes(term);
    });
    grid.innerHTML = visible.map(card).join("");
    count.textContent = visible.length + (visible.length === 1 ? " ficha" : " fichas");
    empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
    clear.hidden = !search.value;
    filters.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory)));
  }
  filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    render();
  });
  search.addEventListener("input", render);
  clear.addEventListener("click", () => { search.value = ""; search.focus(); render(); });
  document.getElementById("resetFilters").addEventListener("click", () => { activeCategory = "Todos"; search.value = ""; render(); });
  document.getElementById("copyAliasButton").addEventListener("click", async () => {
    const alias = document.getElementById("supportAlias").textContent.trim();
    const feedback = document.getElementById("copyFeedback");
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(alias);
        feedback.textContent = "Alias copiado. Gracias por acompañar este proyecto.";
      } else {
        const helper = document.createElement("textarea");
        helper.value = alias; helper.setAttribute("readonly", "");
        helper.style.position = "absolute"; helper.style.left = "-9999px";
        document.body.appendChild(helper); helper.select();
        const copied = document.execCommand("copy"); helper.remove();
        feedback.textContent = copied ? "Alias copiado. Gracias por acompañar este proyecto." : "Podés copiar el alias: " + alias;
      }
    } catch (error) {
      feedback.textContent = "Podés copiar manualmente el alias: " + alias;
    }
  });
  function updatePrintMeta() {
    const visibleCount = contacts.filter(c => {
      const term = search.value.trim().toLocaleLowerCase("es-AR");
      const matchesCategory = activeCategory === "Todos" || c.categoria === activeCategory;
      const haystack = [c.nombre,c.categoria,c.descripcion,...(c.telefonos || []).map(p => p.numero),c.correo].join(" ").toLocaleLowerCase("es-AR");
      return matchesCategory && haystack.includes(term);
    }).length;
    const parts = [visibleCount + (visibleCount === 1 ? " ficha" : " fichas")];
    if (activeCategory !== "Todos") parts.push("Categoría: " + activeCategory);
    if (search.value.trim()) parts.push('Búsqueda: "' + search.value.trim() + '"');
    parts.push(new Intl.DateTimeFormat("es-AR", {dateStyle:"long"}).format(new Date()));
    document.getElementById("printMeta").textContent = parts.join(" · ") + " · Ocarina Producciones";
  }
  document.getElementById("printButton").addEventListener("click", () => {
    updatePrintMeta();
    window.print();
  });
  window.addEventListener("beforeprint", updatePrintMeta);
  document.getElementById("shareButton").addEventListener("click", async () => {
    const shareData = {title:"Chañar a Mano",text:"Guía local de instituciones y servicios de San Patricio del Chañar",url:location.href};
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard) { await navigator.clipboard.writeText(location.href); alert("Enlace copiado. Ya podés compartirlo."); }
      else alert("Copiá el enlace desde la barra del navegador para compartirlo.");
    } catch (error) { if (error.name !== "AbortError") alert("No se pudo compartir automáticamente. Copiá el enlace desde el navegador."); }
  });
  render();
})();