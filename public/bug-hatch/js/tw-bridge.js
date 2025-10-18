// Tailwind Bridge: map legacy `bh-*` utility classes to Tailwind utility classes at runtime
// This allows removing custom CSS while keeping existing markup/JS hooks.
(function () {
  const add = (el, cls) => {
    if (!cls) return;
    for (const c of cls.split(/\s+/).filter(Boolean)) el.classList.add(c);
  };

  const mapOnce = new WeakSet();

  function styleElement(el) {
    if (!el || mapOnce.has(el)) return;
    const cl = el.classList || { contains: () => false };

    // Visibility aliases
    if (cl.contains("bh-hidden")) add(el, "hidden");

    // Base palette
    if (cl.contains("bh-bg-dark")) add(el, "bg-neutral-950");
    if (cl.contains("bh-text-light")) add(el, "text-neutral-100");

    // Nav and brand
    if (cl.contains("bh-navbar"))
      add(el, "sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/70 backdrop-blur");
    if (cl.contains("bh-navbar-brand")) add(el, "inline-flex items-center gap-2 text-lg font-semibold");
    if (cl.contains("bh-brand-badge")) add(el, "inline-flex items-center gap-2");
    if (cl.contains("bh-logo-icon")) add(el, "text-2xl");

    // Layout helpers
    if (cl.contains("bh-max-w-screen")) add(el, "max-w-7xl");
    if (cl.contains("bh-mx-auto")) add(el, "mx-auto");
    if (cl.contains("bh-p-xl")) add(el, "px-4 py-8 sm:py-10");
    if (cl.contains("bh-p-lg")) add(el, "px-4 py-6");
    if (cl.contains("bh-mb-xl")) add(el, "mb-8");
    if (cl.contains("bh-mb-lg")) add(el, "mb-6");
    if (cl.contains("bh-mb-md")) add(el, "mb-4");
    if (cl.contains("bh-mb-sm")) add(el, "mb-2");
    if (cl.contains("bh-mb-xs")) add(el, "mb-1");
    if (cl.contains("bh-mt-xs")) add(el, "mt-1");
    if (cl.contains("bh-mt-2xs")) add(el, "mt-0.5");
    if (cl.contains("bh-m-0")) add(el, "m-0");
    if (cl.contains("bh-text-center")) add(el, "text-center");

    // Typography
    if (cl.contains("bh-heading-display")) add(el, "text-4xl sm:text-5xl font-extrabold");
    if (cl.contains("bh-heading-gradient"))
      add(el, "bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent");
    if (cl.contains("bh-heading-section")) add(el, "text-lg font-semibold");
    if (cl.contains("bh-text-dim")) add(el, "text-neutral-400");
    if (cl.contains("bh-text-xs")) add(el, "text-xs");
    if (cl.contains("bh-text-sm")) add(el, "text-sm");
    if (cl.contains("bh-text-md")) add(el, "text-base");
    if (cl.contains("bh-text-lg")) add(el, "text-xl");
    if (cl.contains("bh-text-xl")) add(el, "text-2xl");
    if (cl.contains("bh-text-2xs")) add(el, "text-[11px]");
    if (cl.contains("bh-text-3xs")) add(el, "text-[10px]");
    if (cl.contains("bh-font-medium")) add(el, "font-medium");
    if (cl.contains("bh-preline")) add(el, "whitespace-pre-line");

    // Flex/grid
    if (cl.contains("bh-flex")) add(el, "flex");
    if (cl.contains("bh-flex-col") || cl.contains("bh-col")) add(el, "flex-col");
    if (cl.contains("bh-flex-wrap") || cl.contains("bh-wrap")) add(el, "flex-wrap");
    if (cl.contains("bh-items-center")) add(el, "items-center");
    if (cl.contains("bh-justify-end")) add(el, "justify-end");
    if (cl.contains("bh-justify-between")) add(el, "justify-between");
    if (cl.contains("bh-gap-2xs")) add(el, "gap-0.5");
    if (cl.contains("bh-gap-xs")) add(el, "gap-1");
    if (cl.contains("bh-gap-sm")) add(el, "gap-2");
    if (cl.contains("bh-gap-md")) add(el, "gap-3");
    if (cl.contains("bh-gap-lg")) add(el, "gap-6");
    if (cl.contains("bh-space-y-2xs")) add(el, "space-y-0.5");
    if (cl.contains("bh-space-y-xs")) add(el, "space-y-1");
    if (cl.contains("bh-flex-1")) add(el, "flex-1");
    if (cl.contains("bh-min-w-0")) add(el, "min-w-0");
    if (cl.contains("bh-flex-grow-0")) add(el, "flex-grow-0");
    if (cl.contains("bh-flex-shrink-0")) add(el, "flex-shrink-0");

    // Cards & containers
    if (cl.contains("bh-card")) add(el, "rounded-xl border border-neutral-800 bg-neutral-900/40 p-4");
    if (cl.contains("bh-card-glow")) add(el, "shadow-lg shadow-neutral-900/30");

    // Stacks
    if (cl.contains("bh-stack")) add(el, "flex flex-col");

    // Buttons
    if (cl.contains("bh-btn"))
      add(
        el,
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      );
    if (cl.contains("bh-btn-primary")) add(el, "bg-emerald-500 text-neutral-900 hover:bg-emerald-600");
    if (cl.contains("bh-btn-secondary"))
      add(el, "border border-neutral-700/70 bg-neutral-900 hover:bg-neutral-800 text-neutral-100");
    if (cl.contains("bh-btn-danger")) add(el, "bg-red-600 hover:bg-red-500 text-white");
    if (cl.contains("bh-btn-success")) add(el, "bg-emerald-600 hover:bg-emerald-500 text-white");
    if (cl.contains("bh-btn-ghost")) add(el, "hover:bg-neutral-800 text-neutral-200");
    if (cl.contains("bh-btn-lg")) add(el, "px-5 py-2.5 text-base");
    if (cl.contains("bh-btn-sm")) add(el, "px-2.5 py-1.5");
    if (cl.contains("bh-btn-xs")) add(el, "px-2 py-1 text-xs");
    if (cl.contains("bh-btn-2xs")) add(el, "px-2 py-0.5 text-[11px]");
    if (cl.contains("bh-btn-block")) add(el, "w-full");

    // Badges
    if (cl.contains("bh-badge"))
      add(
        el,
        "inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/60 px-2 py-0.5 text-xs text-neutral-300"
      );
    if (cl.contains("bh-badge-outline")) add(el, "border-neutral-600 bg-transparent");
    if (cl.contains("bh-badge-warn")) add(el, "border-amber-500/40 bg-amber-500/10 text-amber-300");
    if (cl.contains("bh-badge-dim")) add(el, "text-neutral-400");
    if (cl.contains("bh-badge-tiny")) add(el, "px-1.5 py-0 text-[10px]");

    // Alerts
    if (cl.contains("bh-alert")) add(el, "rounded-md border px-3 py-2 text-sm");
    if (cl.contains("bh-alert-error")) add(el, "border-red-500/40 bg-red-500/10 text-red-200");
    if (cl.contains("bh-alert-info")) add(el, "border-blue-500/40 bg-blue-500/10 text-blue-200");
    if (cl.contains("bh-alert-warn") || cl.contains("bh-alert-warning"))
      add(el, "border-amber-500/40 bg-amber-500/10 text-amber-100");

    // Inputs
    if (cl.contains("bh-input"))
      add(
        el,
        "block w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 outline-none"
      );
    if (cl.contains("bh-label")) add(el, "block text-xs font-medium text-neutral-300 mb-1");
    if (cl.contains("bh-field")) add(el, "space-y-1");
    if (cl.contains("bh-overflow-auto")) add(el, "overflow-auto");

    // Lists & links
    if (cl.contains("bh-list")) add(el, "space-y-2");
    if (cl.contains("bh-link")) add(el, "text-emerald-400 hover:underline");

    // Stat grid
    if (cl.contains("bh-stat-grid")) add(el, "grid grid-cols-1 sm:grid-cols-3 gap-4");
    if (cl.contains("bh-stat-card")) add(el, "rounded-xl border border-neutral-800 bg-neutral-900/40 p-4");

    // Demo banner
    if (cl.contains("bh-demo-banner"))
      add(
        el,
        "flex items-center justify-between gap-3 px-4 py-2 text-sm border border-amber-500/30 bg-amber-500/10 text-amber-100"
      );
    if (cl.contains("bh-demo-cta"))
      add(
        el,
        "inline-flex items-center rounded-md border border-amber-500/40 px-3 py-1.5 text-amber-100 hover:bg-amber-500/10"
      );

    // Table
    if (cl.contains("bh-table")) {
      add(el, "min-w-full divide-y divide-neutral-800");
      const thead = el.querySelector("thead");
      if (thead) add(thead, "bg-neutral-900");
      thead
        ?.querySelectorAll("th")
        .forEach((th) => add(th, "px-4 py-2 text-left text-xs font-medium text-neutral-400"));
      const tbody = el.querySelector("tbody");
      if (tbody) add(tbody, "divide-y divide-neutral-800");
      tbody?.querySelectorAll("td").forEach((td) => add(td, "px-4 py-2 text-sm text-neutral-200"));
    }

    // Modal pieces
    if (cl.contains("bh-modal")) {
      // If used as a dialog element inside a backdrop, style like a dialog and do not force hidden
      if (el.parentElement && el.parentElement.classList.contains("bh-modal-backdrop")) {
        add(el, "relative z-10 w-full max-w-lg rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-xl");
      } else {
        // Default: modal container/overlay
        add(el, "fixed inset-0 hidden z-50 flex items-center justify-center p-4");
      }
    }
    if (cl.contains("bh-modal-backdrop"))
      add(el, "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60");
    if (cl.contains("bh-modal-dialog"))
      add(el, "relative z-10 w-full max-w-lg rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-xl");
    if (cl.contains("bh-modal-header"))
      add(el, "flex items-center justify-between border-b border-neutral-800 pb-2 mb-3");
    if (cl.contains("bh-modal-close")) add(el, "text-neutral-400 hover:text-neutral-200");

    // Boards
    if (cl.contains("bh-kanban-col")) add(el, "rounded-lg border border-neutral-800 bg-neutral-900/40 p-3");
    if (cl.contains("bh-kanban-dropzone")) add(el, "flex flex-col gap-2 min-h-[240px]");
    if (cl.contains("bh-qc-area")) add(el, "rounded-xl border border-neutral-800 bg-neutral-900/40 p-4");

    // Simple separators
    if (el.tagName === "HR" && cl.contains("bh-separator")) add(el, "border-neutral-800");

    // Skeletons
    if (cl.contains("bh-skeleton")) add(el, "animate-pulse bg-neutral-800/60 rounded");
    if (cl.contains("bh-skeleton-text")) add(el, "h-4 rounded");
    if (cl.contains("bh-skeleton-card")) add(el, "h-20 rounded");

    // Preview layout (project issue preview)
    if (cl.contains("bh-preview-layout")) add(el, "grid grid-cols-1 md:grid-cols-3 gap-4");
    if (cl.contains("bh-preview-main")) add(el, "md:col-span-2");
    if (cl.contains("bh-preview-aside")) add(el, "md:col-span-1 space-y-2");
    if (cl.contains("bh-preview-aside-title")) add(el, "text-sm font-semibold");
    if (cl.contains("bh-preview-transitions")) add(el, "space-y-2");

    mapOnce.add(el);
  }

  function syncAliases(mutation) {
    const t = mutation.target;
    if (!(t instanceof HTMLElement)) return;
    const c = t.classList;
    if (!c) return;
    // bh-hidden <-> hidden
    if (c.contains("bh-hidden") && !c.contains("hidden")) c.add("hidden");
    if (!c.contains("bh-hidden") && c.contains("hidden") && mutation.oldValue?.includes("bh-hidden"))
      c.remove("hidden");

    // Modal open alias: when element with .bh-modal toggles .bh-modal-open
    if (c.contains("bh-modal")) {
      if (c.contains("bh-modal-open")) c.remove("hidden");
      else if (mutation.oldValue?.includes("bh-modal-open") && !c.contains("bh-modal-open")) c.add("hidden");
    }
  }

  function observe(root) {
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (!(n instanceof HTMLElement)) return;
            styleElement(n);
            n.querySelectorAll?.("[class]").forEach(styleElement);
          });
        }
        if (m.type === "attributes" && m.attributeName === "class") {
          syncAliases(m);
          styleElement(m.target);
        }
      }
    });
    mo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["class"],
    });
  }

  // Initial pass
  document.querySelectorAll("[class]").forEach(styleElement);
  observe(document.documentElement);

  // Ensure any initially present .bh-hidden elements are actually hidden
  document.querySelectorAll(".bh-hidden").forEach((el) => el.classList.add("hidden"));
})();
