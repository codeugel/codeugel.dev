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

  /* ---------- Filtros ---------- */
  function initFilters() {
    var buttons = document.querySelectorAll(".filter-btn");
    var items = document.querySelectorAll("[data-category]");
    var countEl = document.getElementById("filterCount");
    var emptyEl = document.getElementById("emptyState");
    if (!buttons.length || !items.length) return;

    function updateCount(visible) {
      if (countEl) {
        countEl.textContent = visible + " de " + items.length + " elementos";
      }
      if (emptyEl) {
        emptyEl.classList.toggle("is-visible", visible === 0);
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var category = btn.getAttribute("data-filter") || "all";

        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });

        var visible = 0;
        items.forEach(function (item) {
          var cats = (item.getAttribute("data-category") || "").split(" ");
          var show = category === "all" || cats.indexOf(category) !== -1;
          item.hidden = !show;
          if (show) visible += 1;
        });
        updateCount(visible);
      });
    });

    updateCount(items.length);
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
    initFilters();
    initCopy();
    initPrint();
    initAvatarFallback();
    initYear();
    initWhatsApp();
  });
})();
