"""
SHINE placeholder media generator (development tool).

Renders every placeholder image and video used by the seed data into public/media/.
All files are replaceable from Admin › Media library — this only exists so the full
UI can be previewed before the real photography and film arrive.

Requirements:  pip install playwright imageio-ffmpeg pillow && python -m playwright install chromium
Run:           python tools/media-generator/generate.py            (everything)
               python tools/media-generator/generate.py products   (one group)
"""
import asyncio
import io
import json
import sys
from pathlib import Path

import imageio_ffmpeg
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "media"
PAGE = (Path(__file__).parent / "render.html").as_uri()

# Seed product order → (renderer piece, metal colour). Must match lib/store/seed.ts.
PRODUCTS = [
    ("solitaire", "White"), ("halo", "Rose"), ("eternity", "Yellow"), ("pave", "Yellow"), ("band", "Yellow"),
    ("signet", "Yellow"), ("studs", "White"), ("drops", "Rose"), ("hoops", "Yellow"), ("jhumka", "Yellow"),
    ("tennis", "White"), ("chain", "Yellow"), ("bridal", "Yellow"), ("emeraldPendant", "Yellow"), ("initial", "Yellow"),
    ("name", "Rose"), ("lineBracelet", "White"), ("chainBracelet", "Yellow"), ("bangle", "Yellow"), ("slimBangle", "Rose"),
    ("couple", "White"), ("cuff", "Silver"), ("goldBar", "Yellow"), ("goldCoin", "Yellow"), ("silverBar", "Silver"), ("silverCoin", "Silver"),
]

CATEGORIES = {
    "gold-jewellery": ("bangle", "Yellow", "pearl"), "diamond-jewellery": ("halo", "White", "pearl"), "silver-jewellery": ("cuff", "Silver", "marble"),
    "platinum-jewellery": ("couple", "White", "marble"), "gold-bars": ("goldBar", "Yellow", "ivory"), "silver-bars": ("silverBar", "Silver", "marble"),
    "gold-coins": ("goldCoin", "Yellow", "ivory"), "silver-coins": ("silverCoin", "Silver", "marble"), "rings": ("solitaire", "Yellow", "pearl"),
    "engagement-rings": ("halo", "Rose", "pearl"), "earrings": ("drops", "Rose", "ivory"), "necklaces": ("tennis", "White", "pearl"),
    "bracelets": ("lineBracelet", "White", "ivory"), "bangles": ("bangle", "Yellow", "ivory"), "pendants": ("emeraldPendant", "Yellow", "pearl"),
    "gemstones": ("emeraldPendant", "White", "marble"), "personalised": ("initial", "Yellow", "ivory"), "wedding": ("bridal", "Yellow", "pearl"),
    "gifting": ("studs", "White", "silk"),
}

# (bg, [ (piece, colour, x, y, scale, rotation) ])
COLLECTIONS = {
    "the-shine-edit": ("burgundyLux", [("tennis", "White", 0.62, 0.4, 1.0), ("solitaire", "Yellow", 0.82, 0.7, 0.5, 10), ("studs", "White", 0.45, 0.72, 0.42)]),
    "everyday-elegance": ("silk", [("chain", "Yellow", 0.6, 0.45, 1.0), ("hoops", "Yellow", 0.83, 0.7, 0.42, 8)]),
    "bridal": ("velvet", [("bridal", "Yellow", 0.6, 0.45, 1.05), ("jhumka", "Yellow", 0.85, 0.72, 0.4)]),
    "engagement": ("marble", [("solitaire", "White", 0.55, 0.52, 0.75, -8), ("halo", "Rose", 0.78, 0.55, 0.7, 10)]),
    "timeless-gold": ("obsidian", [("bangle", "Yellow", 0.58, 0.5, 0.8), ("goldCoin", "Yellow", 0.82, 0.62, 0.45, 12), ("band", "Yellow", 0.4, 0.68, 0.4, -10)]),
    "diamond-stories": ("obsidian", [("tennis", "White", 0.6, 0.42, 1.05), ("drops", "White", 0.83, 0.75, 0.42)]),
    "modern-classics": ("marble", [("signet", "Yellow", 0.5, 0.55, 0.65, -10), ("cuff", "Silver", 0.75, 0.55, 0.7, 6)]),
    "gifts": ("ivory", [("initial", "Yellow", 0.62, 0.48, 0.85), ("goldCoin", "Yellow", 0.84, 0.7, 0.36, 14)]),
}

HERO_ITEMS = [("tennis", "White", 0.66, 0.4, 1.12), ("solitaire", "Yellow", 0.86, 0.72, 0.5, 12), ("drops", "Rose", 0.5, 0.74, 0.42, -6)]
HERO_MOBILE = [("tennis", "White", 0.5, 0.26, 1.0), ("solitaire", "Yellow", 0.72, 0.45, 0.5, 12), ("studs", "White", 0.32, 0.46, 0.42)]


class Renderer:
    def __init__(self, page):
        self.page = page

    async def frame(self, js: str, w: int, h: int, fmt="png") -> Image.Image:
        await self.page.set_viewport_size({"width": w, "height": h})
        await self.page.evaluate(f"document.getElementById('stage').innerHTML = {js}")
        await self.page.wait_for_function("Array.from(document.images).every(i => i.complete)")
        data = await self.page.locator("#stage").screenshot(type=fmt)
        return Image.open(io.BytesIO(data)).convert("RGB")

    async def still(self, rel: str, js: str, w: int, h: int, quality=84):
        path = OUT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        img = await self.frame(js, w, h)
        img.save(path, "WEBP", quality=quality, method=6)
        print("  image", rel, f"{path.stat().st_size // 1024} KB")

    async def video(self, rel: str, js_for_t, w: int, h: int, seconds: float, fps=24, crf=27):
        path = OUT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        n = int(seconds * fps)
        writer = imageio_ffmpeg.write_frames(
            str(path), (w, h), fps=fps, codec="libx264", pix_fmt_out="yuv420p", macro_block_size=8,
            output_params=["-crf", str(crf), "-preset", "slow", "-movflags", "+faststart"],
        )
        writer.send(None)
        for i in range(n):
            img = await self.frame(js_for_t(i / n), w, h, fmt="jpeg")
            writer.send(img.tobytes())
        writer.close()
        print("  video", rel, f"{path.stat().st_size // 1024} KB")


def j(v):
    return json.dumps(v)


async def products(r: Renderer):
    for i, (kind, colour) in enumerate(PRODUCTS, 1):
        n = f"{i:03d}"
        for v in (1, 2, 3):
            await r.still(f"products/{n}-{v}.webp", f"SHINE_RENDER.productScene(1000,1250,{j(kind)},{j(colour)},{v},0.08)", 1000, 1250)
        await r.video(f"videos/product-{n}.mp4", lambda t, k=kind, c=colour: f"SHINE_RENDER.productScene(720,896,{j(k)},{j(c)},1,{t})", 720, 896, 3)


async def categories(r: Renderer):
    for slug, (kind, colour, _bg) in CATEGORIES.items():
        await r.still(f"categories/{slug}.webp", f"SHINE_RENDER.productScene(900,1200,{j(kind)},{j(colour)},1,0.15)", 900, 1200)


async def collections(r: Renderer):
    for slug, (bg, items) in COLLECTIONS.items():
        await r.still(f"collections/{slug}.webp", f"SHINE_RENDER.arrangeScene(1800,1000,{j(bg)},{j(items)},0.1)", 1800, 1000)


async def campaigns(r: Renderer):
    A = "SHINE_RENDER.arrangeScene"
    await r.still("campaigns/hero.webp", f"{A}(1920,1080,'burgundyLux',{j(HERO_ITEMS)},0.1)", 1920, 1080)
    await r.still("campaigns/hero-mobile.webp", f"{A}(1080,1620,'burgundyLux',{j(HERO_MOBILE)},0.1)", 1080, 1620)
    await r.video("videos/hero.mp4", lambda t: f"{A}(1280,720,'burgundyLux',{j(HERO_ITEMS)},{t})", 1280, 720, 6)
    await r.still("campaigns/diamond-story.webp", f"{A}(1400,1400,'obsidian',{j([('halo','White',0.5,0.5,1.5)])},0.12)", 1400, 1400)
    await r.still("campaigns/gold-story.webp", f"{A}(1400,1400,'obsidian',{j([('goldBar','Yellow',0.34,0.48,0.62,-8),('goldCoin','Yellow',0.72,0.6,0.5,10)])},0.1)", 1400, 1400)
    await r.still("campaigns/editorial.webp", f"{A}(1920,900,'silk',{j([('chain','Yellow',0.35,0.48,0.95),('tennis','White',0.66,0.45,0.8),('hoops','Yellow',0.86,0.65,0.4)])},0.1)", 1920, 900)
    await r.still("campaigns/craft.webp", "SHINE_RENDER.craftScene(1600,1100,1)", 1600, 1100)
    await r.video("videos/craft.mp4", lambda t: f"SHINE_RENDER.craftScene(1280,720,{t})", 1280, 720, 5)
    await r.still("campaigns/personalisation.webp", f"{A}(1500,1200,'silk',{j([('name','Rose',0.42,0.42,0.9),('initial','Yellow',0.72,0.6,0.7,8)])},0.1)", 1500, 1200)
    await r.still("campaigns/video-story.webp", "SHINE_RENDER.diamondFilm(1920,820,0.1)", 1920, 820)
    await r.video("videos/story.mp4", lambda t: f"SHINE_RENDER.diamondFilm(1280,544,{t})", 1280, 544, 6)


async def banners(r: Renderer):
    A = "SHINE_RENDER.arrangeScene"
    await r.still("banners/mega-jewellery.webp", f"{A}(1200,900,'pearl',{j([('drops','Rose',0.4,0.45,0.75),('solitaire','Yellow',0.72,0.55,0.6,10)])},0.1)", 1200, 900)
    await r.still("banners/mega-collections.webp", f"{A}(1200,900,'velvet',{j([('tennis','White',0.5,0.45,1.0)])},0.1)", 1200, 900)
    for i in range(3):
        await r.still(f"showrooms/branch-{i + 1:02d}.webp", f"SHINE_RENDER.showroomScene(1600,1000,{i},0.1)", 1600, 1000)
    socials = [("solitaire", "Yellow", 2), ("drops", "Rose", 1), ("tennis", "White", 2), ("bangle", "Yellow", 3), ("goldCoin", "Yellow", 2), ("halo", "Rose", 1)]
    for i, (k, c, v) in enumerate(socials, 1):
        await r.still(f"social/social-{i}.webp", f"SHINE_RENDER.productScene(800,800,{j(k)},{j(c)},{v},0.2)", 800, 800)


GROUPS = {"products": products, "categories": categories, "collections": collections, "campaigns": campaigns, "banners": banners}


async def main():
    wanted = sys.argv[1:] or list(GROUPS)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--allow-file-access-from-files"])
        page = await browser.new_page()
        await page.goto(PAGE)
        r = Renderer(page)
        for g in wanted:
            print(f"[{g}]")
            await GROUPS[g](r)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
