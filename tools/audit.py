#!/usr/bin/env python3
"""Auditoría estática de seguridad y calidad para codeugel.dev.

Falla (exit 1) si el sitio incumple las reglas mínimas del proyecto:
  * nada de JS/CSS de terceros ni recursos http://
  * nada de handlers inline ni javascript: URLs
  * target="_blank" siempre con rel="noopener noreferrer"
  * CSP declarada y con script-src 'self'
  * archivos de seguridad presentes (_headers, security.txt, robots.txt)
  * cabeceras clave presentes en _headers

Uso:  python3 tools/audit.py
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML_FILES = ["index.html", "404.html"]

errors: list[str] = []
warnings: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def read(name: str) -> str:
    path = ROOT / name
    if not path.exists():
        fail(f"falta el archivo {name}")
        return ""
    return path.read_text(encoding="utf-8")


def audit_html(name: str) -> str:
    html = read(name)
    if not html:
        return html

    if re.search(r'\son[a-z]+\s*=', html, re.I):
        fail(f"{name}: hay manejadores inline (on*=), incompatibles con CSP script-src 'self'")
    if re.search(r"javascript:\s*", html, re.I):
        fail(f"{name}: hay URLs javascript:")
    if re.search(r'\sstyle\s*=', html, re.I):
        fail(f"{name}: hay estilos inline (style=), incompatibles con style-src 'self'")
    if re.search(r'http://(?!www\.w3\.org)', html):
        fail(f"{name}: enlaces en http:// sin TLS")

    for tag in re.findall(r"<[^>]*target=\"_blank\"[^>]*>", html):
        if 'rel="' not in tag:
            fail(f"{name}: target=_blank sin rel: {tag[:80]}")
        else:
            rel = re.search(r'rel="([^"]+)"', tag).group(1).split()
            if "noopener" not in rel or "noreferrer" not in rel:
                fail(f"{name}: target=_blank sin noopener+noreferrer: {tag[:80]}")

    for tag in re.findall(r"<script[^>]*src=[^>]*>", html, re.I):
        if re.search(r'src="(?:https?:)?//', tag):
            fail(f"{name}: script externo detectado (sin CDN): {tag[:100]}")
    for tag in re.findall(r"<link[^>]*rel=\"stylesheet\"[^>]*>", html, re.I):
        if re.search(r'href="(?:https?:)?//', tag):
            fail(f"{name}: hoja de estilos externa detectada (sin CDN): {tag[:100]}")

    csp = re.search(r'http-equiv="Content-Security-Policy"\s+content="([^"]+)"', html)
    if not csp:
        fail(f"{name}: falta la meta Content-Security-Policy")
    else:
        policy = csp.group(1)
        for directive in ("script-src 'self'", "object-src 'none'", "base-uri 'self'"):
            if directive not in policy:
                fail(f"{name}: la CSP no incluye «{directive}»")
        if "unsafe-inline" in policy or "unsafe-eval" in policy:
            fail(f"{name}: la CSP permite unsafe-inline/unsafe-eval")

    if not re.search(r'<meta name="description" content="[^"]{50,}"', html):
        warn(f"{name}: meta description ausente o muy corta")
    if 'property="og:title"' not in html:
        warn(f"{name}: sin Open Graph")
    if 'rel="canonical"' not in html:
        warn(f"{name}: sin canonical")

    for img in re.findall(r"<img[^>]*>", html):
        if "alt=" not in img:
            fail(f"{name}: <img> sin alt: {img[:80]}")
        if "width=" not in img or "height=" not in img:
            warn(f"{name}: <img> sin width/height (riesgo de CLS)")

    for m in re.findall(r'(?:src|href)="((?!https?:|data:|#|mailto:|tel:)[^"]+)"', html):
        if m in ("/", "./"):
            continue
        if not (ROOT / m).exists():
            fail(f"{name}: recurso local inexistente: {m}")

    return html


def audit_headers() -> None:
    text = read("_headers")
    if not text:
        return
    required = {
        "Strict-Transport-Security": "HSTS",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "anti-clickjacking",
        "Referrer-Policy": "política de referrer",
        "Permissions-Policy": "permisos del navegador",
        "Content-Security-Policy": "CSP",
        "Cross-Origin-Opener-Policy": "COOP",
    }
    for header, why in required.items():
        if header not in text:
            fail(f"_headers: falta {header} ({why})")
    if "frame-ancestors 'none'" not in text:
        fail("_headers: la CSP debe incluir frame-ancestors 'none'")


def audit_security_txt() -> None:
    text = read(".well-known/security.txt")
    if not text:
        return
    for field in ("Contact:", "Expires:", "Canonical:"):
        if field not in text:
            fail(f"security.txt: falta el campo {field}")


def audit_no_secrets() -> None:
    sensitive = re.compile(r"(?i)(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]{8,}")
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts or path.suffix not in {".html", ".js", ".css", ".txt", ".md", ".yml"}:
            continue
        if sensitive.search(path.read_text(encoding="utf-8", errors="ignore")):
            fail(f"{path.relative_to(ROOT)}: posible secreto en texto plano")


def main() -> int:
    for name in HTML_FILES:
        if (ROOT / name).exists() or name == "index.html":
            audit_html(name)
    audit_headers()
    audit_security_txt()
    audit_no_secrets()

    for name in ("robots.txt", "sitemap.xml", "_headers"):
        if not (ROOT / name).exists():
            fail(f"falta {name}")

    for w in warnings:
        print(f"AVISO  {w}")
    for e in errors:
        print(f"ERROR  {e}")
    print(f"\n{len(errors)} error(es), {len(warnings)} aviso(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
