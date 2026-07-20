#!/usr/bin/env python3
"""Build pixel-accurate Elementor pages for ALL beste-* products + shared header/footer.

Usage:
  python scripts/build-exact-product-pages.py              # all products
  python scripts/build-exact-product-pages.py beste-matras # one slug
  python scripts/build-exact-product-pages.py --shared-only
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://interieuradviespunt.nl"
CSS_DIR = ROOT / "public/css/lightbox-exact"
IMG_DIR = ROOT / "public/images/lightbox-exact"
FONT_DIR = ROOT / "public/fonts/lightbox-exact"
EXACT_DIR = ROOT / "src/content/exact-pages"
SHARED_DIR = EXACT_DIR / "_shared"
CACHE_DIR = ROOT / "tmp-exact-cache"

# Reuse the CSS list from the lightbox builder (same template 11/14/17)
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
            raise RuntimeError(f"Failed download: {url}")
        return dest.read_bytes()
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"Failed fetch: {url}")
    return r.stdout


def css_local_name(url: str) -> str:
    return urlparse(url).path.replace("/wp-content/", "").replace("/", "__")


def ensure_css() -> list[str]:
    CSS_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[str] = []
    for url in CSS_URLS:
        name = css_local_name(url)
        dest = CSS_DIR / name
        local = f"/css/lightbox-exact/{name}"
        if not dest.exists() or dest.stat().st_size == 0:
            print(f"CSS {name}")
            curl(url, dest)
            text = dest.read_text(encoding="utf-8", errors="replace")
            rewritten, assets = rewrite_css_urls(text, url)
            dest.write_text(rewritten, encoding="utf-8")
            for asset in assets:
                download_asset(asset)
        paths.append(local)
    (SHARED_DIR).mkdir(parents=True, exist_ok=True)
    (SHARED_DIR / "css-paths.json").write_text(json.dumps(paths, indent=2), encoding="utf-8")
    return paths


def rewrite_css_urls(css_text: str, css_file_url: str) -> tuple[str, set[str]]:
    assets: set[str] = set()

    def repl(m: re.Match) -> str:
        raw = m.group(1).strip().strip("\"'")
        if not raw or raw.startswith(("data:", "/", "#")):
            return m.group(0)
        abs_url = urljoin(css_file_url, raw)
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
        fragment = ("#" + abs_url.split("#", 1)[1].split("?")[0]) if "#" in abs_url else ""
        return f"url({local}{fragment})"

    return re.sub(r"url\(([^)]+)\)", repl, css_text), assets


def download_asset(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return None
    path = parsed.path
    ext = Path(path).suffix.lower()
    if ext in {".woff", ".woff2", ".ttf", ".eot", ".otf"} or (
        ext == ".svg" and "/fonts/" in path
    ):
        dest = FONT_DIR / Path(path).name
        local = f"/fonts/lightbox-exact/{Path(path).name}"
    elif "/wp-content/uploads/" in path:
        rel = path.split("/wp-content/uploads/", 1)[1]
        dest = ROOT / "public/images" / rel
        local = f"/images/{rel}"
    elif "media.s-bol.com" in parsed.netloc:
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
            curl(url.split("?")[0], dest)
        except Exception as e:
            print(f"SKIP {url}: {e}")
            return None
    return local


def rewrite_html_assets(html: str) -> str:
    def abs_url(u: str) -> str:
        return urljoin(SITE + "/", u)

    def repl_attr(m: re.Match) -> str:
        attr, quote, url = m.group(1), m.group(2), m.group(3)
        if url.startswith(("#", "mailto:", "tel:", "data:")):
            return m.group(0)
        full = abs_url(url)
        if attr == "href" and (
            full.startswith(SITE) or url.startswith("/")
        ) and "/wp-content/" not in full and "media.s-bol.com" not in full and not any(
            full.lower().endswith(ext)
            for ext in (".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".woff", ".woff2")
        ):
            if full.startswith(SITE):
                path = full[len(SITE) :] or "/"
                if not path.endswith("/") and "." not in Path(path).name:
                    path += "/"
                return f"{attr}={quote}{path}{quote}"
            return m.group(0)

        if (
            "/wp-content/" in full
            or "media.s-bol.com" in full
            or any(full.lower().endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".woff", ".woff2"))
        ):
            local = download_asset(full.split("?")[0])
            if local:
                return f"{attr}={quote}{local}{quote}"
        if full.startswith(SITE) and attr == "href":
            path = full[len(SITE) :] or "/"
            return f"{attr}={quote}{path}{quote}"
        return m.group(0)

    html = re.sub(r'\b(src|href)=([\'"])([^\'"]+)\2', repl_attr, html)

    def repl_srcset(m: re.Match) -> str:
        quote, value = m.group(1), m.group(2)
        parts = []
        for item in value.split(","):
            item = item.strip()
            if not item:
                continue
            bits = item.split()
            url, rest = bits[0], " ".join(bits[1:])
            full = abs_url(url).split("?")[0]
            local = download_asset(full) or url
            parts.append(f"{local} {rest}".strip())
        return f"srcset={quote}{', '.join(parts)}{quote}"

    html = re.sub(r'srcset=([\'"])([^\'"]+)\1', repl_srcset, html)

    def repl_style_url(m: re.Match) -> str:
        prefix, url, suffix = m.group(1), m.group(2).strip("\"'"), m.group(3)
        if url.startswith(("data:", "/")):
            return m.group(0)
        full = abs_url(url).split("?")[0]
        local = download_asset(full) or url
        return f"{prefix}{local}{suffix}"

    return re.sub(r"(url\()([^\)]+)(\))", repl_style_url, html)


def extract_regions(html: str) -> dict[str, str]:
    skip = re.search(r'(<a class="skip-link screen-reader-text"[^>]*>.*?</a>)', html, re.S)
    header_m = re.search(
        r'(<header\b[^>]*data-elementor-type="header"[^>]*>.*?</header>)', html, re.S
    )
    footer_m = re.search(
        r'(<footer\b[^>]*data-elementor-type="footer"[^>]*>.*?</footer>)', html, re.S
    )
    # Product pages: Elementor wp-page canvas
    page_m = re.search(
        r'(<div\b[^>]*data-elementor-type="wp-page"[^>]*>.*?)(?=<footer\b[^>]*data-elementor-type="footer")',
        html,
        re.S,
    )
    # Category hubs: Hello Elementor theme <main class="site-main">
    if not page_m:
        page_m = re.search(
            r'(<main\b[^>]*class="[^"]*site-main[^"]*"[^>]*>.*?</main>)',
            html,
            re.S | re.I,
        )
    if not header_m or not page_m or not footer_m:
        raise RuntimeError("Could not extract header/page/footer")

    header = ((skip.group(1) + "\n") if skip else "") + header_m.group(1)
    caret = '<span class="sub-arrow"><i class="fas fa-caret-down" aria-hidden="true"></i></span>'
    header = re.sub(r'<span class="sub-arrow">.*?</span>', "", header)
    header = re.sub(
        r'(<li class="[^"]*menu-item-has-children[^"]*"[^>]*>\s*<a [^>]*class="[^"]*elementor-item[^"]*"[^>]*>)(.*?)(</a>)',
        lambda m: m.group(1) + m.group(2) + caret + m.group(3),
        header,
        flags=re.S,
    )

    page = page_m.group(1)
    # Strip WP Rocket location hashes
    page = re.sub(r'\s*data-rocket-location-hash="[^"]*"', "", page)
    if 'id="content"' not in page and 'data-elementor-type="wp-page"' in page:
        page = page.replace(
            '<div data-elementor-type="wp-page"',
            '<div id="content" data-elementor-type="wp-page"',
            1,
        )

    return {"header": header, "page": page, "footer": footer_m.group(1)}


def extract_meta(html: str) -> dict[str, str]:
    title = re.search(r"<title>([^<]+)</title>", html)
    desc = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html, re.I) or re.search(
        r'<meta\s+content="([^"]*)"\s+name="description"', html, re.I
    )
    og = re.search(r'<meta\s+property="og:image"\s+content="([^"]*)"', html, re.I)
    body = re.search(r'<body[^>]*class="([^"]*)"', html, re.I)
    image = ""
    if og:
        image = download_asset(og.group(1).split("?")[0]) or ""
    body_class = body.group(1).strip() if body else (
        "wp-singular page-template page-template-elementor_header_footer page "
        "wp-embed-responsive wp-theme-hello-elementor hello-elementor-default "
        "elementor-default elementor-template-full-width elementor-kit-9 "
        "elementor-page elementor-page-17"
    )
    return {
        "title": title.group(1).strip() if title else "",
        "description": desc.group(1).strip() if desc else "",
        "ogImage": image,
        "bodyClass": body_class,
    }


def product_slugs() -> list[str]:
    return sorted(p.stem for p in (ROOT / "src/content/pages").glob("beste-*.mdx"))


CATEGORY_SLUGS = [
    "decoratie",
    "slaapruimte",
    "woonkamer",
    "verlichting",
    "wasruimte",
    "tuin",
]


def blog_slugs() -> list[str]:
    api = CACHE_DIR / "blog-slugs.json"
    if api.exists():
        return json.loads(api.read_text(encoding="utf-8"))
    # Fallback: local MDX filenames
    return sorted(p.stem for p in (ROOT / "src/content/blog").glob("*.mdx"))


def process_slug(slug: str, write_shared: bool = False) -> dict:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = CACHE_DIR / f"{slug}.html"
    if not cache.exists() or cache.stat().st_size < 1000:
        print(f"FETCH {slug}")
        curl(f"{SITE}/{slug}/", cache)
    else:
        print(f"CACHE {slug}")

    html = cache.read_text(encoding="utf-8", errors="replace")
    regions = extract_regions(html)
    meta = extract_meta(html)

    for key in ("header", "page", "footer"):
        regions[key] = rewrite_html_assets(regions[key])

    if write_shared:
        SHARED_DIR.mkdir(parents=True, exist_ok=True)
        (SHARED_DIR / "header.html").write_text(regions["header"], encoding="utf-8")
        (SHARED_DIR / "footer.html").write_text(regions["footer"], encoding="utf-8")
        blocks = re.findall(r"<style[^>]*>(.*?)</style>", html, re.S | re.I)
        inline = "\n".join(
            b for b in blocks if any(k in b for k in ("wp--preset", "wplmi", "e-con.e-parent", "img:is"))
        )
        (SHARED_DIR / "inline.css").write_text(inline, encoding="utf-8")

    out = EXACT_DIR / slug
    out.mkdir(parents=True, exist_ok=True)
    (out / "page.html").write_text(regions["page"], encoding="utf-8")
    (out / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    return {"slug": slug, "ok": True, "title": meta["title"]}


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    flags = {a for a in sys.argv[1:] if a.startswith("-")}
    SHARED_DIR.mkdir(parents=True, exist_ok=True)
    EXACT_DIR.mkdir(parents=True, exist_ok=True)

    print("Ensuring shared CSS...")
    ensure_css()

    if "--shared-only" in flags:
        # Refresh shared header/footer from lightbox
        process_slug("beste-lightbox", write_shared=True)
        print("Shared header/footer updated")
        return

    if "--categories" in flags:
        slugs = CATEGORY_SLUGS
    elif "--blogs" in flags:
        # Refresh slug list from WP API
        api_dest = CACHE_DIR / "posts-api.json"
        curl(
            "https://interieuradviespunt.nl/wp-json/wp/v2/posts?per_page=100&_fields=slug",
            api_dest,
        )
        posts = json.loads(api_dest.read_text(encoding="utf-8"))
        slugs = [p["slug"] for p in posts]
        (CACHE_DIR / "blog-slugs.json").write_text(json.dumps(slugs, indent=2), encoding="utf-8")
    else:
        slugs = args if args else product_slugs()
    if not slugs:
        raise SystemExit("No slugs found")

    # First slug writes shared header/footer (skip for category/blog-only builds)
    first, rest = slugs[0], slugs[1:]
    write_shared = "--categories" not in flags and "--blogs" not in flags and not args
    process_slug(first, write_shared=write_shared)

    failed = []
    # Parallel fetch remaining (HTML rewrite is mostly CPU + downloads)
    workers = 4
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(process_slug, slug, False): slug for slug in rest}
        for fut in as_completed(futures):
            slug = futures[fut]
            try:
                result = fut.result()
                print(f"OK {result['slug']}")
            except Exception as e:
                print(f"FAIL {slug}: {e}")
                failed.append(slug)

    manifest = {"slugs": slugs, "failed": failed, "count": len(slugs) - len(failed)}
    (EXACT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Done: {manifest['count']}/{len(slugs)} pages. Failed: {failed}")


if __name__ == "__main__":
    main()
