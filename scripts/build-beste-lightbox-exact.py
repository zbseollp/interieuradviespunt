#!/usr/bin/env python3
"""Extract live beste-lightbox page into a pixel-accurate Astro route."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote

ROOT = Path(__file__).resolve().parents[1]
LIVE_HTML = ROOT / "tmp-lightbox-analysis/live.html"
OUT_DIR = ROOT / "src/pages/beste-lightbox"
CSS_DIR = ROOT / "public/css/lightbox-exact"
IMG_DIR = ROOT / "public/images/lightbox-exact"
FONT_DIR = ROOT / "public/fonts/lightbox-exact"
SITE = "https://interieuradviespunt.nl"

CSS_URLS = [
    "https://interieuradviespunt.nl/wp-content/themes/hello-elementor/assets/css/reset.css?ver=3.4.9",
    "https://interieuradviespunt.nl/wp-content/themes/hello-elementor/assets/css/theme.css?ver=3.4.9",
    "https://interieuradviespunt.nl/wp-content/themes/hello-elementor/assets/css/header-footer.css?ver=3.4.9",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/frontend.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/uploads/elementor/css/post-9.css?ver=1784238229",
    "https://interieuradviespunt.nl/wp-content/plugins/ele-custom-skin/modules/color-scheme/assets/css/ecs-color-scheme.css?ver=4.3.6",
    "https://interieuradviespunt.nl/wp-content/plugins/ele-custom-skin/modules/container-layout/assets/css/ecs-container-layout.css?ver=4.3.6",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/lib/swiper/v8/css/swiper.min.css?ver=8.4.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/conditionals/e-swiper.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/ele-custom-skin/modules/mobile-menu/assets/css/ecs-mobile-menu.css?ver=4.3.6",
    "https://interieuradviespunt.nl/wp-content/plugins/ele-custom-skin/modules/editorial-text/assets/css/ecs-editorial-text.css?ver=4.3.6",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/widget-image.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor-pro/assets/css/widget-nav-menu.min.css?ver=4.1.3",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor-pro/assets/css/widget-search-form.min.css?ver=4.1.3",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/lib/font-awesome/css/fontawesome.min.css?ver=5.15.3",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/lib/font-awesome/css/solid.min.css?ver=5.15.3",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/widget-social-icons.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/conditionals/apple-webkit.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/widget-heading.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor-pro/assets/css/widget-posts.min.css?ver=4.1.3",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/lib/eicons/css/elementor-icons.min.css?ver=5.50.0",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor-pro/assets/css/widget-table-of-contents.min.css?ver=4.1.3",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/widget-star-rating.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/widget-divider.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/widget-spacer.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/css/widget-accordion.min.css?ver=4.1.5",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor-pro/assets/css/widget-author-box.min.css?ver=4.1.3",
    "https://interieuradviespunt.nl/wp-content/uploads/elementor/css/post-17.css?ver=1784238889",
    "https://interieuradviespunt.nl/wp-content/uploads/elementor/css/post-14.css?ver=1784238229",
    "https://interieuradviespunt.nl/wp-content/uploads/elementor/css/post-11.css?ver=1784238229",
    "https://interieuradviespunt.nl/wp-content/plugins/ele-custom-skin/assets/css/ecs-style.css?ver=4.3.6",
    "https://interieuradviespunt.nl/wp-content/uploads/elementor/google-fonts/css/oswald.css?ver=1742227466",
    "https://interieuradviespunt.nl/wp-content/uploads/elementor/google-fonts/css/didactgothic.css?ver=1742227466",
    "https://interieuradviespunt.nl/wp-content/uploads/elementor/google-fonts/css/roboto.css?ver=1742227471",
    "https://interieuradviespunt.nl/wp-content/plugins/elementor/assets/lib/font-awesome/css/brands.min.css?ver=5.15.3",
]


def curl(url: str, dest: Path | None = None) -> bytes:
    cmd = ["curl", "-sfL", "--max-time", "90", url]
    if dest:
        dest.parent.mkdir(parents=True, exist_ok=True)
        cmd.extend(["-o", str(dest)])
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode != 0 or not dest.exists() or dest.stat().st_size == 0:
            raise RuntimeError(f"Failed download: {url}\n{r.stderr.decode(errors='replace')}")
        return dest.read_bytes()
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"Failed fetch: {url}")
    return r.stdout


def css_local_name(url: str) -> str:
    path = urlparse(url).path
    return path.replace("/wp-content/", "").replace("/", "__")


def download_css() -> list[str]:
    CSS_DIR.mkdir(parents=True, exist_ok=True)
    local_paths: list[str] = []
    for url in CSS_URLS:
        name = css_local_name(url)
        dest = CSS_DIR / name
        # Always refresh from live so url() rewriting stays correct
        print(f"CSS {name}")
        curl(url, dest)
        local_paths.append(f"/css/lightbox-exact/{name}")
    return local_paths


def rewrite_css_urls(css_text: str, css_file_url: str) -> tuple[str, set[str]]:
    """Rewrite url(...) in CSS to local paths; return rewritten css + remote asset urls."""
    assets: set[str] = set()

    def repl(m: re.Match) -> str:
        raw = m.group(1).strip().strip("\"'")
        if not raw or raw.startswith("data:") or raw.startswith("/") or raw.startswith("#"):
            return m.group(0)
        abs_url = urljoin(css_file_url, raw)
        # Strip hash/query for download key, keep hash in local ref if font SVG
        clean = abs_url.split("#")[0].split("?")[0]
        assets.add(clean)
        parsed = urlparse(clean)
        ext = Path(parsed.path).suffix.lower()
        if ext in {".woff", ".woff2", ".ttf", ".eot", ".otf"} or (
            ext == ".svg" and "/fonts/" in parsed.path
        ):
            local = f"/fonts/lightbox-exact/{Path(parsed.path).name}"
        elif "/wp-content/uploads/" in parsed.path:
            rel = parsed.path.split("/wp-content/uploads/", 1)[1]
            local = f"/images/{rel}"
        else:
            local = f"/images/lightbox-exact/{Path(parsed.path).name}"
        fragment = ""
        if "#" in abs_url:
            fragment = "#" + abs_url.split("#", 1)[1].split("?")[0]
        return f"url({local}{fragment})"

    rewritten = re.sub(r"url\(([^)]+)\)", repl, css_text)
    return rewritten, assets


def download_asset(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return None
    path = parsed.path
    ext = Path(path).suffix.lower()
    if ext in {".woff", ".woff2", ".ttf", ".eot", ".otf"}:
        dest = FONT_DIR / Path(path).name
        local = f"/fonts/lightbox-exact/{Path(path).name}"
    elif "/wp-content/uploads/" in path:
        rel = path.split("/wp-content/uploads/", 1)[1]
        dest = ROOT / "public/images" / rel
        local = f"/images/{rel}"
    elif "media.s-bol.com" in parsed.netloc:
        # Bol CDN product images
        safe = re.sub(r"[^a-zA-Z0-9._-]+", "-", path.strip("/"))
        dest = IMG_DIR / f"bol-{safe}"
        if not dest.suffix:
            dest = dest.with_suffix(".jpg")
        local = f"/images/lightbox-exact/{dest.name}"
    else:
        dest = IMG_DIR / Path(path).name
        local = f"/images/lightbox-exact/{Path(path).name}"

    if not dest.exists() or dest.stat().st_size == 0:
        try:
            print(f"ASSET {url} -> {dest}")
            curl(url.split("?")[0], dest)
        except Exception as e:
            print(f"SKIP asset {url}: {e}")
            return None
    return local


def extract_body_chunks(html: str) -> dict[str, str]:
    # Live markup uses <header>, <div>, <footer> with data-elementor-type.
    header_m = re.search(
        r"(<header\b[^>]*data-elementor-type=\"header\"[^>]*>.*?</header>)",
        html,
        re.S,
    )
    page_m = re.search(
        r"(<div\b[^>]*data-elementor-type=\"wp-page\"[^>]*>.*?)(?=<footer\b[^>]*data-elementor-type=\"footer\")",
        html,
        re.S,
    )
    footer_m = re.search(
        r"(<footer\b[^>]*data-elementor-type=\"footer\"[^>]*>.*?</footer>)",
        html,
        re.S,
    )
    if not header_m or not page_m or not footer_m:
        raise RuntimeError(
            "Could not extract header/page/footer regions "
            f"(header={bool(header_m)} page={bool(page_m)} footer={bool(footer_m)})"
        )

    skip = re.search(
        r'(<a class="skip-link screen-reader-text"[^>]*>.*?</a>)',
        html,
        re.S,
    )
    header_html = ((skip.group(1) + "\n") if skip else "") + header_m.group(1)

    return {
        "header": header_html,
        "page": page_m.group(1),
        "footer": footer_m.group(1),
    }


def rewrite_html_assets(html: str) -> tuple[str, set[str]]:
    assets: set[str] = set()

    def abs_url(u: str) -> str:
        return urljoin(SITE + "/", u)

    # src / href for media
    def repl_attr(m: re.Match) -> str:
        attr, quote, url = m.group(1), m.group(2), m.group(3)
        if url.startswith("#") or url.startswith("mailto:") or url.startswith("tel:"):
            return m.group(0)
        full = abs_url(url)
        # Keep internal page links as relative site paths
        if attr == "href" and (
            full.startswith(SITE)
            or url.startswith("/")
        ) and not any(
            full.lower().endswith(ext)
            for ext in (
                ".css",
                ".js",
                ".png",
                ".jpg",
                ".jpeg",
                ".webp",
                ".gif",
                ".svg",
                ".woff",
                ".woff2",
                ".ttf",
            )
        ) and "/wp-content/" not in full and "media.s-bol.com" not in full:
            # convert absolute site URLs to relative
            if full.startswith(SITE):
                path = full[len(SITE) :] or "/"
                if not path.endswith("/") and "." not in Path(path).name:
                    path = path + "/"
                return f"{attr}={quote}{path}{quote}"
            return m.group(0)

        # media / uploads / bol
        if (
            "/wp-content/" in full
            or "media.s-bol.com" in full
            or any(full.lower().endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".woff", ".woff2"))
        ):
            assets.add(full.split("?")[0])
            local = download_asset(full.split("?")[0])
            if local:
                return f"{attr}={quote}{local}{quote}"
        # rewrite absolute site links
        if full.startswith(SITE) and attr == "href":
            path = full[len(SITE) :] or "/"
            return f"{attr}={quote}{path}{quote}"
        return m.group(0)

    html = re.sub(
        r'\b(src|href)=([\'"])([^\'"]+)\2',
        repl_attr,
        html,
    )

    # srcset
    def repl_srcset(m: re.Match) -> str:
        quote, value = m.group(1), m.group(2)
        parts = []
        for item in value.split(","):
            item = item.strip()
            if not item:
                continue
            bits = item.split()
            url = bits[0]
            rest = " ".join(bits[1:])
            full = abs_url(url).split("?")[0]
            assets.add(full)
            local = download_asset(full) or url
            parts.append(f"{local} {rest}".strip())
        return f"srcset={quote}{', '.join(parts)}{quote}"

    html = re.sub(r'srcset=([\'"])([^\'"]+)\1', repl_srcset, html)

    # inline style url()
    def repl_style_url(m: re.Match) -> str:
        prefix, url, suffix = m.group(1), m.group(2).strip("\"'"), m.group(3)
        full = abs_url(url).split("?")[0]
        assets.add(full)
        local = download_asset(full) or url
        return f"{prefix}{local}{suffix}"

    html = re.sub(r'(url\()([^\)]+)(\))', repl_style_url, html)

    return html, assets


def extract_inline_styles(html: str) -> str:
    blocks = re.findall(r"<style[^>]*>(.*?)</style>", html, re.S | re.I)
    # Keep useful ones (skip emoji and lazyload boilerplate if huge wp presets needed)
    keep = []
    for b in blocks:
        if "wp--preset" in b or "wplmi" in b or "e-con.e-parent" in b or "img:is" in b:
            keep.append(b)
    return "\n".join(keep)


def main() -> None:
    if not LIVE_HTML.exists():
        print("Fetching live HTML...")
        LIVE_HTML.parent.mkdir(parents=True, exist_ok=True)
        curl(f"{SITE}/beste-lightbox/", LIVE_HTML)

    html = LIVE_HTML.read_text(encoding="utf-8", errors="replace")
    css_paths = download_css()

    # Rewrite CSS internal urls + download fonts/images referenced by CSS
    all_css_assets: set[str] = set()
    for url, local in zip(CSS_URLS, css_paths):
        dest = ROOT / "public" / local.lstrip("/")
        text = dest.read_text(encoding="utf-8", errors="replace")
        rewritten, assets = rewrite_css_urls(text, url)
        dest.write_text(rewritten, encoding="utf-8")
        all_css_assets |= assets

    print(f"Downloading {len(all_css_assets)} CSS-referenced assets...")
    for asset in sorted(all_css_assets):
        download_asset(asset)

    chunks = extract_body_chunks(html)
    rewritten = {}
    for key, chunk in chunks.items():
        rewritten[key], _ = rewrite_html_assets(chunk)

    # Inject Elementor submenu carets (normally added by Elementor JS)
    if key == "header":
        caret = (
            '<span class="sub-arrow">'
            '<i class="fas fa-caret-down" aria-hidden="true"></i>'
            "</span>"
        )
        rewritten[key] = re.sub(
            r'<span class="sub-arrow">.*?</span>',
            "",
            rewritten[key],
        )
        rewritten[key] = re.sub(
            r'(<li class="[^"]*menu-item-has-children[^"]*"[^>]*>\s*<a [^>]*class="[^"]*elementor-item[^"]*"[^>]*>)(.*?)(</a>)',
            lambda m: m.group(1) + m.group(2) + caret + m.group(3),
            rewritten[key],
            flags=re.S,
        )
    if key == "page" and 'id="content"' not in rewritten[key]:
        rewritten[key] = rewritten[key].replace(
            '<div data-elementor-type="wp-page"',
            '<div id="content" data-elementor-type="wp-page"',
            1,
        )
    title_m = re.search(r"<title>([^<]+)</title>", html)
    desc_m = re.search(
        r'<meta\s+name="description"\s+content="([^"]*)"', html, re.I
    ) or re.search(r'<meta\s+content="([^"]*)"\s+name="description"', html, re.I)
    og_image = re.search(r'<meta\s+property="og:image"\s+content="([^"]*)"', html, re.I)

    title = title_m.group(1).strip() if title_m else "Beste lightbox"
    description = desc_m.group(1).strip() if desc_m else ""
    image = og_image.group(1).strip() if og_image else ""
    if image:
        local_img = download_asset(image.split("?")[0])
        if local_img:
            image = local_img

    inline_css = extract_inline_styles(html)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Save HTML partials
    partials = OUT_DIR / "_ partials"
    # avoid space in name
    partials_dir = OUT_DIR / "partials"
    partials_dir.mkdir(exist_ok=True)
    (partials_dir / "header.html").write_text(rewritten["header"], encoding="utf-8")
    (partials_dir / "page.html").write_text(rewritten["page"], encoding="utf-8")
    (partials_dir / "footer.html").write_text(rewritten["footer"], encoding="utf-8")
    (partials_dir / "inline.css").write_text(inline_css, encoding="utf-8")
    (partials_dir / "css-paths.json").write_text(json.dumps(css_paths, indent=2), encoding="utf-8")

    # Build the Astro page
    css_links = "\n".join(f'  <link rel="stylesheet" href="{p}" />' for p in css_paths)

    astro = f'''---
import fs from 'node:fs';
import path from 'node:path';

const partialsDir = path.join(process.cwd(), 'src/pages/beste-lightbox/partials');
const headerHtml = fs.readFileSync(path.join(partialsDir, 'header.html'), 'utf-8');
const pageHtml = fs.readFileSync(path.join(partialsDir, 'page.html'), 'utf-8');
const footerHtml = fs.readFileSync(path.join(partialsDir, 'footer.html'), 'utf-8');
const inlineCss = fs.readFileSync(path.join(partialsDir, 'inline.css'), 'utf-8');

const title = {json.dumps(title)};
const description = {json.dumps(description)};
const ogImage = {json.dumps(image)};
---
<!doctype html>
<html lang="nl-NL">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{title}}</title>
  <meta name="description" content={{description}} />
  <meta property="og:locale" content="nl_NL" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={{title}} />
  <meta property="og:description" content={{description}} />
  <meta property="og:url" content="https://interieuradviespunt.nl/beste-lightbox/" />
  <meta property="og:site_name" content="interieuradviespunt" />
  {{ogImage && <meta property="og:image" content={{ogImage}} />}}
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" sizes="32x32" href="/images/2022/08/cropped-Group-5-32x32.png" />
{css_links}
  <style set:html={{inlineCss}}></style>
</head>
<body class="wp-singular page-template page-template-elementor_header_footer page page-id-17 wp-embed-responsive wp-theme-hello-elementor hello-elementor-default elementor-default elementor-template-full-width elementor-kit-9 elementor-page elementor-page-17">
  <div set:html={{headerHtml}} />
  <div set:html={{pageHtml}} />
  <div set:html={{footerHtml}} />

  <script is:inline>
    // Accordion (Elementor FAQ)
    document.querySelectorAll('.elementor-accordion-item .elementor-tab-title').forEach((title) => {{
      title.addEventListener('click', () => {{
        const item = title.closest('.elementor-accordion-item');
        const content = item?.querySelector('.elementor-tab-content');
        const expanded = title.getAttribute('aria-expanded') === 'true';
        title.setAttribute('aria-expanded', String(!expanded));
        title.classList.toggle('elementor-active', !expanded);
        content?.classList.toggle('elementor-active', !expanded);
        if (content) content.hidden = expanded;
      }});
      const content = title.closest('.elementor-accordion-item')?.querySelector('.elementor-tab-content');
      if (content && title.getAttribute('aria-expanded') !== 'true') {{
        content.hidden = true;
      }}
    }});

    // Mobile nav toggle (Elementor / Hello)
    document.querySelectorAll('.elementor-menu-toggle').forEach((btn) => {{
      btn.addEventListener('click', () => {{
        const nav = btn.closest('nav') || btn.parentElement;
        btn.classList.toggle('elementor-active');
        nav?.querySelector('.elementor-nav-menu--dropdown')?.classList.toggle('elementor-menu-open');
        document.body.classList.toggle('elementor-menu-open');
      }});
    }});

    // Nested submenu toggles
    document.querySelectorAll('.elementor-menu-toggle, .elementor-item.has-submenu').forEach(() => {{}});
    document.querySelectorAll('.elementor-nav-menu .menu-item-has-children > a').forEach((link) => {{
      // leave hover behavior to CSS; on touch open submenu via click on sibling toggle if present
    }});

    // Search form toggle if present
    document.querySelectorAll('.elementor-search-form__toggle').forEach((btn) => {{
      btn.addEventListener('click', (e) => {{
        e.preventDefault();
        btn.closest('.elementor-search-form')?.classList.toggle('elementor-active');
      }});
    }});

    // TOC minimize
    document.querySelectorAll('.elementor-toc__toggle-button').forEach((btn) => {{
      btn.addEventListener('click', () => {{
        const toc = btn.closest('.elementor-widget-table-of-contents');
        toc?.classList.toggle('elementor-toc--collapsed');
      }});
    }});
  </script>
</body>
</html>
'''
    (OUT_DIR / "index.astro").write_text(astro, encoding="utf-8")
    print("Wrote", OUT_DIR / "index.astro")
    print("Partials in", partials_dir)


if __name__ == "__main__":
    main()
