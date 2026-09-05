"""Builds the Projects-page GIFs.

Two of the four are real capture sequences of the applications running,
produced by scripts/capture-project-frames.mjs into .frames/ — run that first.
The other two are Windows desktop apps that no browser can drive, so they are
slideshows of their own graphics. roflo-pinterest's are pure-white diagrams,
and pasted straight onto a dark card they read as a bright slab, so they get
converted to dark here; Lumen's are already dark and go on as they are.

    node scripts/capture-project-frames.mjs
    python scripts/make_project_gifs.py

Everything comes out at one size and one aspect ratio. The cards render with
`aspect-video` and `object-cover`, so anything that is not 16:9 gets silently
cropped — the old dota GIF was 16:10 and lost a strip off the top and bottom.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "projects"
FRAMES = ROOT / ".frames"

# Both match app/globals.css. The canvas is the page ground; the diagrams
# are refilled with the SURFACE tone rather than the ground, so a converted
# graphic still reads as a panel sitting on the page instead of dissolving
# into it — the tray-menu mockup in particular is only legible as a menu if
# it keeps an edge.
CANVAS_BG = (11, 12, 15)   # --background #0b0c0f
SURFACE_BG = (20, 22, 27)  # --surface #14161b
# 16:9, and 2x the ~400px the card is drawn at on a normal desktop.
WIDTH, HEIGHT = 800, 450

HOLD_MS = 2000
FADE_STEPS = 4
FADE_STEP_MS = 40
PALETTE_COLORS = 128


def fit_on_canvas(im, width=WIDTH, height=HEIGHT, bg=CANVAS_BG):
    """Scales to fit and centres on the card's own background colour."""
    im = im.convert("RGB")
    scale = min(width / im.width, height / im.height)
    size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    im = im.resize(size, Image.LANCZOS)
    canvas = Image.new("RGB", (width, height), bg)
    canvas.paste(im, ((width - size[0]) // 2, (height - size[1]) // 2))
    return canvas


def to_dark(path, bg=SURFACE_BG):
    """Turns a white-background flat diagram into a dark-background one.

    Deliberately not a whole-image inversion: these diagrams carry coloured
    tray icons with white shapes inside them, and inverting everything turns
    the white mountains black inside a red circle.

    Instead the background proper is flood-filled from the borders — it is one
    connected white region, and the white *inside* a circle is not reachable
    from the edge, so it survives. What remains dark after that is text, which
    is inverted so it reads on the new ground. Saturated pixels are never
    touched.
    """
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()

    filled = bytearray(w * h)
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    def near_white(c):
        # 200, not 240: these diagrams are drawn as a rounded card with a
        # light-grey stroke around it (221,224,229), and a tighter threshold
        # stops the fill dead at that stroke — leaving the whole interior
        # white while the text inside it gets inverted to invisible. The
        # coloured tray icons sit far below 200 on at least one channel, so
        # they still block the fill and keep their white shapes.
        return min(c) >= 200

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if filled[i]:
            continue
        if not near_white(px[x, y]):
            continue
        filled[i] = 1
        px[x, y] = bg
        stack.append((x + 1, y))
        stack.append((x - 1, y))
        stack.append((x, y + 1))
        stack.append((x, y - 1))

    def saturated(c):
        return max(c) - min(c) > 26

    # Near-white regions the border fill could not reach are of two kinds, and
    # they need opposite treatment: the counters inside letters (the hole in
    # an "О"), which are background and must go dark, and the white shapes
    # inside the coloured tray icons, which are the artwork and must stay.
    # Told apart by what each region borders — type, or colour.
    for sy in range(h):
        for sx in range(w):
            if filled[sy * w + sx] or not near_white(px[sx, sy]):
                continue
            region, edge_coloured, edge_total = [], 0, 0
            stack = [(sx, sy)]
            seen = {(sx, sy)}
            while stack:
                x, y = stack.pop()
                if not (0 <= x < w and 0 <= y < h):
                    continue
                if filled[y * w + x]:
                    continue
                if not near_white(px[x, y]):
                    edge_total += 1
                    if saturated(px[x, y]):
                        edge_coloured += 1
                    continue
                region.append((x, y))
                filled[y * w + x] = 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if (nx, ny) not in seen:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            # Bordering colour is not enough on its own: the third tray icon
            # is a GREY circle, so its white mountain borders nothing
            # saturated and was being blacked out. Size settles it — measured
            # on these diagrams, artwork regions run 394px and up while letter
            # counters top out at 42, so anything in between is unambiguous.
            inside_icon = (
                edge_total and edge_coloured / edge_total > 0.5
            ) or len(region) >= 200
            if inside_icon:
                for x, y in region:
                    filled[y * w + x] = 0  # leave the artwork alone
            else:
                for x, y in region:
                    px[x, y] = bg

    # What is left and still dark-and-greyish is type: invert it so it reads.
    for y in range(h):
        for x in range(w):
            if filled[y * w + x]:
                continue
            c = px[x, y]
            if saturated(c):
                continue  # coloured — the tray icons, left alone
            lum = sum(c) // 3
            if lum < 200:  # dark type; white shapes inside icons are ~255
                v = 255 - lum
                px[x, y] = (v, v, v)
    return im


def build_gif(images, out_path, hold_ms=HOLD_MS, crossfade=True, colors=PALETTE_COLORS):
    canvases = [fit_on_canvas(im) for im in images]
    sequence, durations = [], []
    n = len(canvases)
    for i in range(n):
        a = canvases[i]
        sequence.append(a)
        durations.append(hold_ms)
        if crossfade:
            b = canvases[(i + 1) % n]
            for step in range(1, FADE_STEPS + 1):
                sequence.append(Image.blend(a, b, step / (FADE_STEPS + 1)))
                durations.append(FADE_STEP_MS)

    # One shared adaptive palette across every frame: per-frame palettes make
    # the background shimmer between frames on a dark UI.
    base = sequence[0].convert("P", palette=Image.ADAPTIVE, colors=colors)
    quantized = [f.quantize(palette=base, dither=Image.FLOYDSTEINBERG) for f in sequence]

    out_path.parent.mkdir(parents=True, exist_ok=True)
    quantized[0].save(
        out_path,
        save_all=True,
        append_images=quantized[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=2,
    )
    kb = out_path.stat().st_size / 1024
    print(f"wrote {out_path.name} — {len(sequence)} frames, {kb:.0f} KB")


def captured(name):
    d = FRAMES / name
    if not d.is_dir():
        return []
    return [Image.open(p) for p in sorted(d.glob("*.png"))]


def main():
    dbd = captured("dbd")
    if dbd:
        # Real rolls of the randomiser. Held briefly and without a crossfade:
        # the point is that the build CHANGES, and blending one build into the
        # next just reads as mush.
        build_gif(dbd, OUT_DIR / "dbd-perk-randomizer.gif", hold_ms=900, crossfade=False)
    else:
        print("skip dbd — no frames, run capture-project-frames.mjs first")

    dota = captured("dota")
    if dota:
        build_gif(dota, OUT_DIR / "dota-counter-web.gif", hold_ms=1500, crossfade=False)
    else:
        print("skip dota — no frames, run capture-project-frames.mjs first")

    # Key art, then the settings window. Frame order matters more than it looks:
    # the first frame is what a viewer sees before the GIF has looped, and it
    # should be the capsule rather than a dialog. Held longer than the others —
    # the settings shot is dense and needs a moment to read.
    #
    # Only the English settings capture, though both exist. Side by side at
    # 400px the two languages are the same window with the same layout and
    # unreadable type, so the pair reads as a stutter rather than as evidence
    # the app is localised; the card's own text says that instead.
    #
    # No crossfade, and the reason is size rather than taste. These frames
    # share almost no pixels, so every blended step between them is a full new
    # image: crossfading three of them cost 1535 KB against 247 KB for the
    # cuts, and dropping the palette to 48 colours clawed back only 15% of that
    # because the fades, not the colour depth, are the file.
    lumen_docs = Path("D:/VScode/dev/debug/lumen/docs")
    lumen = captured("lumen")
    settings = lumen_docs / "settings.png"
    if lumen and settings.is_file():
        build_gif(
            lumen + [Image.open(settings)],
            OUT_DIR / "lumen.gif",
            hold_ms=2400,
            crossfade=False,
        )
    else:
        print("skip lumen — no frames, run capture-project-frames.mjs first")

    readme = Path("D:/VScode/dev/debug/roflo-pinterest/assets/readme")
    if readme.is_dir():
        build_gif(
            [to_dark(readme / f) for f in ("icon-states.png", "menu-mockup.png", "workflow.png")],
            OUT_DIR / "roflo-pinterest.gif",
            # Flat diagrams: a handful of flat fills, one red, and grey type.
            # 128 colours is spent on dither noise it does not need, and this
            # is the longest of the three sequences so it pays twice.
            colors=48,
        )
    else:
        print(f"skip roflo — no assets at {readme}")


if __name__ == "__main__":
    main()
