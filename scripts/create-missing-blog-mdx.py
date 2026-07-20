#!/usr/bin/env python3
"""Create MDX stubs for blog posts that exist as exact-pages but lack MDX."""
from __future__ import annotations

import html as htmlmod
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "src/content/blog"
EXACT = ROOT / "src/content/exact-pages"
CACHE = ROOT / "tmp-exact-cache"


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main() -> None:
    slugs = json.loads((CACHE / "blog-slugs.json").read_text(encoding="utf-8"))
    local = {p.stem for p in BLOG.glob("*.mdx")}
    missing = [s for s in slugs if s not in local]
    print("creating", missing)

    api_path = CACHE / "posts-api-full.json"
    subprocess.run(
        [
            "curl",
            "-sfL",
            "https://interieuradviespunt.nl/wp-json/wp/v2/posts?per_page=100&_fields=slug,title,date,modified",
            "-o",
            str(api_path),
        ],
        check=False,
    )
    try:
        api = json.loads(api_path.read_text(encoding="utf-8"))
    except Exception:
        api = []
    by_slug = {p["slug"]: p for p in api}

    for slug in missing:
        meta = json.loads((EXACT / slug / "meta.json").read_text(encoding="utf-8"))
        page = (EXACT / slug / "page.html").read_text(encoding="utf-8")
        title = re.sub(
            r"\s*-\s*interieuradviespunt\s*$",
            "",
            meta.get("title") or slug,
            flags=re.I,
        ).strip()
        pm = re.search(r"<p[^>]*>(.*?)</p>", page, re.S)
        desc = re.sub(r"<[^>]+>", "", pm.group(1) if pm else "").replace("\xa0", " ").strip()
        desc = htmlmod.unescape(desc)[:240]
        info = by_slug.get(slug, {})
        date = info.get("date", "2026-07-01T12:00:00")
        modified = info.get("modified", date)
        og = meta.get("ogImage") or "/images/2023/05/wanddecoratie.jpg"
        lines = [
            "---",
            f'title: "{esc(title)}"',
            f'description: "{esc(desc)}"',
            f'pubDate: "{date}"',
            f'updatedDate: "{modified}"',
            'author: "info_63njyjwi"',
            "categories:",
            '  - "Blog"',
            "tags: []",
            f'featuredImage: "{og}"',
            f'imageAlt: "{esc(title)}"',
            "---",
            "",
            desc,
            "",
        ]
        (BLOG / f"{slug}.mdx").write_text("\n".join(lines), encoding="utf-8")
        print("wrote", slug)

    print("blog count", len(list(BLOG.glob("*.mdx"))))


if __name__ == "__main__":
    main()
