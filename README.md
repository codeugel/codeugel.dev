# codeugel.dev — Portafolio profesional de Eugel Brito

Sitio estático de portafolio/CV, sin build ni dependencias de runtime.
Publicado como sitio estático (Cloudflare Pages / Netlify / GitHub Pages).

## Estructura

```
index.html                     Página principal (semántica, SEO, JSON-LD)
404.html                       Página de error con la misma identidad visual
assets/css/style.css           Estilos propios (sin Tailwind CDN ni frameworks)
assets/img/codeugel-mark.png   Isotipo transparente para navegación y favicon
assets/img/codeugel-logo.png   Logo transparente completo para Open Graph
assets/js/app.js               Filtros, radar SVG, copiar correo, WhatsApp (defer)
_headers                       Cabeceras de seguridad (Cloudflare Pages)
robots.txt / sitemap.xml       Indexación
.well-known/security.txt       Canal de reporte de vulnerabilidades
SECURITY.md                    Política de divulgación responsable
tools/audit.py                 Auditoría estática (CSP, rel, CDN, secretos)
tools/quality.workflow.yml     Plantilla de CI: html-validate + auditoría
eugelcv.html                   Redirección legacy → index.html
```

## Seguridad (diseño)

- **Cero peticiones a terceros**: se eliminaron Tailwind CDN, Chart.js,
  FontAwesome y Google Fonts. Iconos en SVG inline (sprite), radar en SVG
  generado por JS propio y tipografía del sistema (privacidad + velocidad).
- **CSP estricta** (`script-src 'self'`, sin `unsafe-inline`/`unsafe-eval`):
  sin `onclick`, sin `<style>`/`<script>` inline ejecutable, sin `style=""`.
- **Cabeceras** en `_headers`: HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, `COOP`/`CORP`, `frame-ancestors 'none'`.
- Todos los `target="_blank"` llevan `rel="noopener noreferrer"`
  (protección contra *reverse tabnabbing*).
- Imágenes externas con `referrerpolicy="no-referrer"`, `loading` y
  dimensiones para evitar CLS. Pendiente: autoalojar el avatar en
  `assets/img/` y reducir `img-src` a `'self' data:`.
- JS usa `textContent`/`setAttribute` (sin `innerHTML` con datos),
  Clipboard API con respaldo, y enlaces de WhatsApp construidos con
  `encodeURIComponent`.
- **Auditoría automatizada**: `python3 tools/audit.py` falla si aparece un CDN,
  un handler inline, un `target="_blank"` sin `noopener`, una CSP débil, un
  recurso inexistente, una imagen sin `alt` o un secreto en texto plano.

## Frontend

- HTML semántico (`header/nav/main/section/article/aside/footer`),
  *skip link*, `aria-pressed` en filtros, `aria-live` en contador y toast,
  foco visible, `prefers-reduced-motion`, contraste AA.
- Responsive *mobile-first*, tipografía `clamp()`, tarjetas de proyecto
  con métricas y CTA por proyecto.
- **WhatsApp directo**: botón flotante + CTA en hero, por proyecto y en
  contacto, todos a `wa.me/584148013225` con mensaje prellenado
  (funciona sin JS; `app.js` normaliza el enlace con `data-wa`).
- SEO: meta description, Open Graph, Twitter Card, canonical,
  `theme-color`, favicon SVG y datos estructurados `Person`.
- Impresión: hoja limpia en blanco que oculta navegación, filtros y
  botón flotante.
- `404.html` con la misma identidad visual y salida rápida a WhatsApp.

## Desarrollo local

```bash
python3 -m http.server 8000 --bind 0.0.0.0
# abrir http://localhost:8000

python3 tools/audit.py            # auditoría de seguridad
npx html-validate@9 index.html 404.html
```

## Pendiente sugerido

1. **Autoalojar el avatar** en `assets/img/` y borrar el host externo de
   `img-src` en la CSP (quedaría `img-src 'self' data:`).
2. Usar `security@codeugel.dev` (alias) en `security.txt` en lugar del Gmail.
3. Sirgar los formularios de contacto con un backend propio si algún día se
   añaden (hoy no hay formularios: cero superficie de entrada de datos).

## Despliegue

Sube el repo a Cloudflare Pages (framework: *None*, directorio de salida: `/`).
El archivo `_headers` se aplica automáticamente. Si usas otro host,
replica las cabeceras en su configuración (Netlify: `netlify.toml`,
nginx: `add_header`, etc.).
