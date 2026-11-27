# Política de seguridad

## Alcance

Este repositorio contiene el sitio estático `codeugel.dev`. No procesa pagos,
formularios ni datos de usuarios: todo el contenido se sirve como HTML, CSS y JS
propios desde el mismo origen.

## Cómo reportar una vulnerabilidad

Escríbeme en privado; no abras un issue público con detalles explotables.

- **Correo:** codeugel@gmail.com (asunto `[SECURITY]`)
- **WhatsApp:** https://wa.me/584148013225
- **security.txt:** https://codeugel.dev/.well-known/security.txt

Incluye, si puedes: URL afectada, pasos de reproducción, impacto y evidencia.
Respondo en un máximo de 72 horas y confirmo la corrección cuando se publique.

## Compromisos del proyecto

| Control | Implementación |
|---|---|
| CSP | `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'` |
| Sin CDNs | CSS, JS e iconos son locales; no hay Tailwind CDN, Chart.js ni FontAwesome |
| Sin inline | Sin `onclick`, sin `style=""`, sin scripts inline ejecutables (solo JSON-LD) |
| Enlaces externos | `rel="noopener noreferrer"` en todo `target="_blank"` |
| Transporte | HSTS con `includeSubDomains; preload` y `upgrade-insecure-requests` |
| Aislamiento | `X-Frame-Options: DENY`, `COOP: same-origin`, `CORP: same-origin` |
| Privacidad | Sin cookies, sin analítica de terceros, sin fuentes externas |
| Datos mínimos | El sitio no recoge información; el contacto va por WhatsApp o correo |

## Verificación local

```bash
python3 tools/audit.py          # auditoría estática de reglas de seguridad
npx html-validate@9 index.html  # validación del HTML
```

Ambas comprobaciones se ejecutan en CI (`.github/workflows/quality.yml`).
