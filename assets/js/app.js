/* ============================================================
   codeugel.dev — Lógica de interfaz (sin dependencias externas)
   - Filtros de proyectos/experiencia con aria-pressed
   - Copiar correo con Clipboard API + respaldo
   - Radar de competencias en SVG (sin Chart.js)
   - Año dinámico del pie
   ============================================================ */
(function () {
  "use strict";

  var WA_NUMBER = "584148013225";

  /* ---------- Radar SVG ---------- */
  function buildRadar() {
    var svg = document.getElementById("radarSvg");
    if (!svg) return;

    var data = [
      { label: "Backend", value: 95 },
      { label: "IA & LLM", value: 92 },
      { label: "DevOps", value: 88 },
      { label: "Frontend", value: 80 },
      { label: "Databases", value: 86 },
      { label: "Seguridad", value: 82 }
    ];

    var NS = "http://www.w3.org/2000/svg";
    var cx = 130, cy = 105, maxR = 66;

    function point(index, value) {
      var angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
      var r = (value / 100) * maxR;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    }

    function polygon(points) {
      return points.map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ");
    }

    function el(name, attrs) {
      var node = document.createElementNS(NS, name);
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, attrs[key]);
      });
      return node;
    }

    // Anillos de fondo (20/40/60/80/100)
    [20, 40, 60, 80, 100].forEach(function (ring) {
      var pts = data.map(function (_, i) { return point(i, ring); });
      svg.appendChild(el("polygon", {
        points: polygon(pts),
        fill: "none",
        stroke: "#1f293d",
        "stroke-width": "1"
      }));
    });

    // Ejes
    data.forEach(function (_, i) {
      var p = point(i, 100);
      svg.appendChild(el("line", {
        x1: cx, y1: cy, x2: p.x.toFixed(1), y2: p.y.toFixed(1),
        stroke: "#1f293d", "stroke-width": "1"
      }));
    });

    // Serie de datos
    var series = data.map(function (d, i) { return point(i, d.value); });
    svg.appendChild(el("polygon", {
      points: polygon(series),
      fill: "rgba(99,102,241,0.25)",
      stroke: "#818cf8",
      "stroke-width": "2",
      "stroke-linejoin": "round"
    }));

    // Puntos
    series.forEach(function (p) {
      svg.appendChild(el("circle", {
        cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: "3.5",
        fill: "#818cf8", stroke: "#090d16", "stroke-width": "1.5"
      }));
    });

    // Etiquetas
    data.forEach(function (d, i) {
      var p = point(i, 126);
      var anchor = "middle";
      if (p.x < cx - 10) anchor = "end";
      if (p.x > cx + 10) anchor = "start";
      var text = el("text", {
        x: p.x.toFixed(1), y: p.y.toFixed(1),
        "text-anchor": anchor,
        "dominant-baseline": "middle",
        fill: "#94a3b8",
        "font-size": "10",
        "font-family": "JetBrains Mono, monospace"
      });
      text.textContent = d.label;
      svg.appendChild(text);
    });
  }

  /* ---------- Búsqueda, filtros y vistas ---------- */
  function normalize(value) {
    return String(value || "").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function initFilters() {
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter-btn"));
    var viewButtons = Array.prototype.slice.call(document.querySelectorAll(".view-btn"));
    var items = Array.prototype.slice.call(document.querySelectorAll("#proyectos [data-category]"));
    var projects = document.getElementById("proyectos");
    var search = document.getElementById("projectSearch");
    var countEl = document.getElementById("filterCount");
    var emptyEl = document.getElementById("emptyState");
    var activeFilter = "all";
    var originalOrder = items.slice();
    if (!items.length || !projects) return null;

    function applyFilters() {
      var query = normalize(search ? search.value : "");
      var visible = 0;
      items.forEach(function (item) {
        var categories = (item.getAttribute("data-category") || "").split(/\s+/);
        var text = normalize(item.textContent);
        var matchesFilter = activeFilter === "all" || categories.indexOf(activeFilter) !== -1;
        var matchesQuery = !query || text.indexOf(query) !== -1;
        var show = matchesFilter && matchesQuery;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (countEl) countEl.textContent = visible + " de " + items.length + " elementos";
      if (emptyEl) {
        emptyEl.classList.toggle("is-visible", visible === 0);
        emptyEl.textContent = query ? "No encontré coincidencias para «" + search.value.trim() + "». Prueba otro término." : "No hay elementos en esta categoría. Prueba con «Todo».";
      }
    }

    function setFilter(category) {
      activeFilter = category || "all";
      filterButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-filter") === activeFilter ? "true" : "false");
      });
      applyFilters();
    }

    function setView(view) {
      var selected = view || "list";
      projects.setAttribute("data-view", selected);
      viewButtons.forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-view") === selected ? "true" : "false");
      });

      var ordered = originalOrder.slice();
      if (selected === "timeline") {
        ordered.sort(function (a, b) {
          var aKind = a.getAttribute("data-kind") || "experience";
          var bKind = b.getAttribute("data-kind") || "experience";
          if (aKind !== bKind) return aKind === "project" ? -1 : 1;
          return Number(b.getAttribute("data-start-year") || 0) - Number(a.getAttribute("data-start-year") || 0);
        });
      }
      ordered.forEach(function (item) { projects.insertBefore(item, emptyEl); });
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () { setFilter(button.getAttribute("data-filter")); });
    });
    viewButtons.forEach(function (button) {
      button.addEventListener("click", function () { setView(button.getAttribute("data-view")); });
    });
    if (search) search.addEventListener("input", applyFilters);
    setView("list");
    setFilter("all");
    return { setFilter: setFilter, setView: setView, refresh: applyFilters };
  }

  /* ---------- Paleta de comandos y atajos ---------- */
  function initCommandPalette(explorer) {
    var trigger = document.getElementById("commandTrigger");
    var dialog = document.getElementById("commandPalette");
    var input = document.getElementById("commandSearch");
    var empty = document.getElementById("commandEmpty");
    var search = document.getElementById("projectSearch");
    if (!trigger || !dialog || !input || !explorer || typeof dialog.showModal !== "function") return;

    var options = Array.prototype.slice.call(dialog.querySelectorAll(".command-option"));
    function visibleOptions() { return options.filter(function (option) { return !option.hidden; }); }
    function filterOptions() {
      var query = normalize(input.value);
      var visible = 0;
      options.forEach(function (option) {
        var terms = normalize(option.textContent + " " + (option.getAttribute("data-command-terms") || ""));
        option.hidden = query && terms.indexOf(query) === -1;
        if (!option.hidden) visible += 1;
      });
      if (empty) empty.hidden = visible > 0;
    }
    function openPalette() {
      if (!dialog.open) dialog.showModal();
      input.value = "";
      filterOptions();
      input.focus();
    }
    function goTo(targetSelector) {
      if (!targetSelector) return;
      var target = document.querySelector(targetSelector);
      if (!target) return;
      window.requestAnimationFrame(function () {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (!target.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) target.setAttribute("tabindex", "-1");
        if (target.focus) target.focus({ preventScroll: true });
      });
    }

    trigger.addEventListener("click", openPalette);
    input.addEventListener("input", filterOptions);
    options.forEach(function (option) {
      option.addEventListener("click", function () {
        if (search && (option.hasAttribute("data-command-filter") || option.hasAttribute("data-command-view"))) search.value = "";
        if (option.hasAttribute("data-command-filter")) explorer.setFilter(option.getAttribute("data-command-filter"));
        if (option.hasAttribute("data-command-view")) {
          explorer.setView(option.getAttribute("data-command-view"));
          explorer.refresh();
        }
        var target = option.getAttribute("data-command-target");
        var action = option.getAttribute("data-command-action");
        dialog.close();
        if (action === "print") window.setTimeout(function () { window.print(); }, 0);
        else goTo(target);
      });
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        if (event.key === "Enter" && event.target === input) {
          var first = visibleOptions()[0];
          if (first) { event.preventDefault(); first.click(); }
        }
        return;
      }
      var visible = visibleOptions();
      if (!visible.length) return;
      event.preventDefault();
      var current = visible.indexOf(document.activeElement);
      var direction = event.key === "ArrowDown" ? 1 : -1;
      var next = current < 0 ? (direction > 0 ? 0 : visible.length - 1) : (current + direction + visible.length) % visible.length;
      visible[next].focus();
    });

    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var isEditing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.open) dialog.close(); else openPalette();
        return;
      }
      if (dialog.open || isEditing || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key === "/" && search) {
        event.preventDefault();
        search.focus();
      } else if (event.key === "1") explorer.setView("list");
      else if (event.key === "2") explorer.setView("grid");
      else if (event.key === "3") explorer.setView("timeline");
    });
  }

  /* ---------- Entrada suave al recorrer ---------- */
  function initScrollReveal() {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var elements = document.querySelectorAll("#proyectos .project-card, .layout-grid > .stack > .panel, .contact-card");
    if (!elements.length) return;
    document.documentElement.classList.add("has-reveal");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    elements.forEach(function (element) {
      element.classList.add("reveal-item");
      observer.observe(element);
    });
  }

  /* ---------- Copiar correo ---------- */
  function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2000);
  }

  function fallbackCopy(text) {
    var input = document.createElement("input");
    input.type = "text";
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try { document.execCommand("copy"); } catch (e) { /* sin portapapeles */ }
    document.body.removeChild(input);
  }

  function initCopy() {
    var buttons = document.querySelectorAll("[data-email]");
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      var email = btn.getAttribute("data-email") || "codeugel@gmail.com";
      btn.addEventListener("click", function () {
        function done() { showToast("Correo copiado al portapapeles"); }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(done, function () {
            fallbackCopy(email);
            done();
          });
        } else {
          fallbackCopy(email);
          done();
        }
      });
    });
  }

  /* ---------- Imprimir / PDF ---------- */
  function initPrint() {
    var btn = document.getElementById("printBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.print();
    });
  }

  /* ---------- Avatar con respaldo tipográfico ---------- */
  function initAvatarFallback() {
    document.querySelectorAll("img[data-avatar]").forEach(function (img) {
      img.addEventListener("error", function () {
        img.remove();
      }, { once: true });
    });
  }

  /* ---------- Año dinámico ---------- */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Enlaces de WhatsApp con mensaje por defecto ---------- */
  function initWhatsApp() {
    document.querySelectorAll("[data-wa]").forEach(function (link) {
      var msg = link.getAttribute("data-wa") || "";
      var href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
      link.setAttribute("href", href);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildRadar();
    var explorer = initFilters();
    initCommandPalette(explorer);
    initScrollReveal();
    initCopy();
    initPrint();
    initAvatarFallback();
    initYear();
    initWhatsApp();
  });
})();
