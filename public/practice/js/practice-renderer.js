(function () {
  // ---------- constants ----------
  const IDS = {
    searchInput: "searchInput",
    pageCount: "pageCount",
    clearSearch: "clearSearch",
  };

  const SELECTORS = {
    tagFilter: ".tag-filter",
    table: "#mainTable",
    row: "tr",
    link: ".menu-link",
    pageLink: ".practice-page-link",
    button: ".button-primary-small",
    pagesBtns: ".pages-btns",
    menuLabel: ".menu-label",
    tagButton: ".tag-button",
    noResults: ".no-results",
  };

  const CLASSES = {
    hidden: "hidden",
    active: "active",
    greyedOut: "greyed-out",
    additionalDesc: "additionalDesc",
    hashLink: "hash-link",
    tagButton: "tag-button",
    visible: "visible",
  };

  const TEXTS = {
    noResults: "No matching items",
    all: "All",
  };

  // ---------- helpers ----------
  /** Create DOM element with attributes and children */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "className") node.className = v;
      else if (k === "dataset") Object.assign(node.dataset, v);
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  /** Capitalize first letter */
  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  /** Extract normalized tags from a menu button */
  function getButtonTags(menuButton) {
    return (menuButton?.dataset?.tags?.split(",") || []).map((t) => (t || "").trim().toLowerCase());
  }

  /** Decide if an item matches search and tag */
  function matchesFilters({ searchTerm, sectionName, buttonText, buttonTags, activeTag }) {
    const term = searchTerm || "";
    const matchesSearch =
      term === "" ||
      buttonText.includes(term) ||
      buttonTags.some((tag) => tag.includes(term)) ||
      sectionName.includes(term);
    const matchesTag = activeTag === "all" || buttonTags.includes(activeTag);
    return matchesSearch && matchesTag;
  }

  // ---------- renderers ----------
  /** Build the header cell for a section */
  function buildHeaderCell(section) {
    const { id, headerClass, sectionName, title, subtitle, prefixHtml } = section;
    const th = el("th", {
      style: "text-align: center; ",
      id,
      class: `anchorWithStickyNavbar headerColumn ${headerClass || ""}`.trim(),
      "section-name": sectionName,
    });
    if (prefixHtml) th.appendChild(el("span", { html: prefixHtml }));

    // Title
    th.appendChild(document.createTextNode(title));

    // Optional subtitle, styled like original (.additionalDesc)
    if (subtitle) {
      th.appendChild(document.createElement("br"));
      const sub = el("span", { className: CLASSES.additionalDesc });
      sub.innerHTML = String(subtitle).replace(/\n/g, "<br />");
      th.appendChild(sub);
    }

    th.appendChild(el("a", { href: `#${id}`, class: CLASSES.hashLink }, "#"));
    return th;
  }

  /** Build the right-side items cell for a section */
  function buildItemsCell(items) {
    const td = el("td", { style: "text-align: left;", className: "pages-btns" });
    items.forEach((it) => {
      if (it.type === "label") {
        td.appendChild(
          el(
            "strong",
            { id: it.id, class: "anchorWithStickyNavbar menu-label" },
            it.label,
            el("a", { href: `#${it.id}`, class: CLASSES.hashLink }, "#")
          )
        );
        return;
      }
      const a = el("a", { href: it.href, class: "menu-link practice-page-link" });
      const btn = el(
        "button",
        {
          className: "button-primary-small",
          style: "margin-top: 4px; font-size: 14px;",
          dataset: { tags: (it.tags || []).join(",") },
        },
        it.label
      );
      a.appendChild(btn);
      td.appendChild(a);
    });
    return td;
  }

  /** Render the main table from sections */
  function renderTable(sections, container) {
    const table = el("table", { id: "mainTable", style: "margin: 0 auto; width: auto;" });
    sections.forEach((section) => {
      const tr = document.createElement("tr");
      tr.appendChild(buildHeaderCell(section));
      tr.appendChild(el("td")); // spacer
      tr.appendChild(buildItemsCell(section.items));
      table.appendChild(tr);
    });
    container.appendChild(table);
  }

  // ---------- filtering & search ----------
  /** Update the "No matching items" info and row greying based on visibility */
  function updateRowVisibility(row, hasVisibleButtons) {
    const tdButtons = row.querySelector(SELECTORS.pagesBtns);
    if (!hasVisibleButtons) {
      row.classList.add(CLASSES.greyedOut);
      if (tdButtons) {
        const existingMsg = tdButtons.querySelector(SELECTORS.noResults);
        if (existingMsg) existingMsg.remove();
        const noResults = el("div", { className: "no-results", text: TEXTS.noResults });
        tdButtons.appendChild(noResults);
      }
      row.querySelectorAll(SELECTORS.menuLabel).forEach((link) => link.classList.add(CLASSES.hidden));
    } else {
      row.classList.remove(CLASSES.greyedOut);
      const noResults = tdButtons?.querySelector(SELECTORS.noResults);
      if (noResults) noResults.remove();
      row.querySelectorAll(SELECTORS.menuLabel).forEach((link) => link.classList.remove(CLASSES.hidden));
    }
  }

  /** Filter items in the table and update visibility + count */
  function filterTable({ table, searchTerm, activeTag, pageCountElement }) {
    let visibleCount = 0;
    table.querySelectorAll(SELECTORS.row).forEach((row) => {
      const pageLinks = row.querySelectorAll(SELECTORS.link);
      if (pageLinks.length === 0) return; // header-only row

      const sectionName = row.querySelector("th")?.getAttribute("section-name")?.toLowerCase() || "";

      let hasVisibleButtons = false;
      pageLinks.forEach((link) => {
        const menuButton = link.querySelector(SELECTORS.button);
        const buttonText = menuButton?.textContent?.toLowerCase() || "";
        const buttonTags = getButtonTags(menuButton);

        const isVisible = matchesFilters({ searchTerm, sectionName, buttonText, buttonTags, activeTag });
        if (isVisible) {
          link.classList.remove(CLASSES.hidden);
          hasVisibleButtons = true;
          visibleCount += 1;
        } else {
          link.classList.add(CLASSES.hidden);
        }
      });

      updateRowVisibility(row, hasVisibleButtons);
    });

    if (pageCountElement) pageCountElement.textContent = visibleCount;
  }

  /** Build tag chips from current DOM buttons inside the main table */
  function buildTagChips(tagFilterEl, tableEl) {
    const uniqueTags = new Set();
    tableEl.querySelectorAll(SELECTORS.button).forEach((button) => {
      const tags = button.dataset.tags?.split(",") || [];
      tags.forEach((tag) => uniqueTags.add((tag || "").trim().toLowerCase()));
    });
    const sortedTags = Array.from(uniqueTags).filter(Boolean).sort();

    // "All" chip first and active by default
    tagFilterEl.appendChild(
      el("button", { className: `${CLASSES.tagButton} ${CLASSES.active}`, dataset: { tag: "all" }, text: TEXTS.all })
    );
    sortedTags.forEach((tag) => {
      if (tag === "all") return;
      tagFilterEl.appendChild(el("button", { className: CLASSES.tagButton, dataset: { tag }, text: capitalize(tag) }));
    });
  }

  /** Retrieve active tag value (defaults to 'all') */
  function getActiveTag(tagFilterEl) {
    const active = tagFilterEl.querySelector(`${SELECTORS.tagButton}.${CLASSES.active}`);
    return active?.dataset?.tag || "all";
  }

  /** Wire up search and tag filtering */
  function setupFiltering() {
    const searchInput = document.getElementById(IDS.searchInput);
    const tagFilter = document.querySelector(SELECTORS.tagFilter);
    const pageCountElement = document.getElementById(IDS.pageCount);
    const clearSearch = document.getElementById(IDS.clearSearch);
    const table = document.querySelector(SELECTORS.table);

    if (!searchInput || !tagFilter || !pageCountElement || !clearSearch || !table) return;

    // reset input value
    searchInput.value = "";

    const toggleClearButton = () => {
      clearSearch.classList.toggle(CLASSES.visible, searchInput.value.length > 0);
    };

    // Build tag chips from rendered buttons
    buildTagChips(tagFilter, table);

    // Wire events
    searchInput.addEventListener("input", () => {
      toggleClearButton();
      filterTable({
        table,
        searchTerm: searchInput.value.toLowerCase(),
        activeTag: getActiveTag(tagFilter),
        pageCountElement,
      });
    });
    clearSearch.addEventListener("click", () => {
      searchInput.value = "";
      toggleClearButton();
      filterTable({
        table,
        searchTerm: "",
        activeTag: getActiveTag(tagFilter),
        pageCountElement,
      });
      searchInput.focus();
    });
    // Event delegation for tag chips
    tagFilter.addEventListener("click", (ev) => {
      const button = ev.target.closest(SELECTORS.tagButton);
      if (!button) return;
      const isActive = button.classList.contains(CLASSES.active);
      tagFilter.querySelectorAll(SELECTORS.tagButton).forEach((b) => b.classList.remove(CLASSES.active));
      if (!isActive) {
        button.classList.add(CLASSES.active);
      } else {
        // if clicking active, fallback to 'All'
        const allBtn = tagFilter.querySelector('[data-tag="all"]');
        allBtn?.classList.add(CLASSES.active);
      }
      filterTable({
        table,
        searchTerm: searchInput.value.toLowerCase(),
        activeTag: getActiveTag(tagFilter),
        pageCountElement,
      });
    });

    // Initial render/filter
    filterTable({
      table,
      searchTerm: "",
      activeTag: getActiveTag(tagFilter),
      pageCountElement,
    });
  }

  // ---------- bootstrap ----------
  function initPracticePage() {
    const container = document.getElementById("practiceContainer");
    if (!container) return;
    renderTable(window.PRACTICE_SECTIONS || [], container);
    setupFiltering();
  }

  // Expose init for manual call if needed
  window.initPracticePage = initPracticePage;

  // Auto-init when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPracticePage);
  } else {
    initPracticePage();
  }
})();
