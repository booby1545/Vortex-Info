/* Captures real frames from each project for the Projects-page GIFs.
 *
 * The cards used to show crossfaded still screenshots, and the DBD one was a
 * single-frame .gif — an animated file format holding one static picture of a
 * YouTube thumbnail, which showed a trailer rather than the product. These
 * capture the applications actually running.
 *
 * Local-only helper, like scripts/make_project_gifs.py which consumes its
 * output. It reaches into sibling checkouts by absolute path (the same
 * assumption the GIF script already makes) and is not part of the build.
 *
 *   node scripts/capture-project-frames.mjs
 *
 * Then: python scripts/make_project_gifs.py
 */
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const HERE = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const FRAMES = join(HERE, "..", ".frames");
const DBD_OUT = "D:/VScode/dev/debug/dbd-perk-randomizer/out";
const DOTA_DIR = "D:/VScode/dev/debug/the-counter-web DOTA2";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Minimal static server — a directory of files is all these two need. */
function serve(root, port) {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    let path = normalize(join(root, url)).replace(/[\\/]+$/, "");
    if (!path.startsWith(normalize(root))) {
      res.writeHead(403).end();
      return;
    }
    try {
      let s = await stat(path).catch(() => null);
      if (s?.isDirectory()) {
        path = join(path, "index.html");
        s = await stat(path).catch(() => null);
      }
      if (!s) {
        path = `${path}.html`;
        s = await stat(path).catch(() => null);
      }
      if (!s) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
      createReadStream(path).pipe(res);
    } catch {
      res.writeHead(500).end();
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

function frameDir(name) {
  const dir = join(FRAMES, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function captureDbd(browser) {
  if (!existsSync(DBD_OUT)) {
    console.log("skip dbd — no build at " + DBD_OUT + " (run `npm run build` there)");
    return;
  }
  const server = await serve(DBD_OUT, 4411);
  const dir = frameDir("dbd");
  const page = await browser.newPage({ viewport: { width: 1700, height: 1100 } });
  // Killer + full loadout is the densest, most recognisable state: perks,
  // Power, add-ons and offering all on screen at once.
  await page.goto("http://localhost:4411/?role=killer&mode=all");
  await page.locator("[data-perk-card]").first().waitFor({ state: "visible" });

  // The page leads with the chapter trailer, which is the one thing on it
  // that is not the product — an unclipped capture is mostly a YouTube
  // thumbnail, which is exactly what the old still showed.
  const hideTrailer = page.getByRole("button", { name: /Скрыть трейлер/ });
  if (await hideTrailer.count()) await hideTrailer.first().click();
  await page.waitForTimeout(1200);

  /** Union of the things worth showing, rather than a guessed ancestor. */
  const box = await page.evaluate(() => {
    const els = document.querySelectorAll("[data-perk-card], [data-testid^=loadout-slot]");
    if (!els.length) return null;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const el of els) {
      const q = el.getBoundingClientRect();
      l = Math.min(l, q.left); t = Math.min(t, q.top);
      r = Math.max(r, q.right); b = Math.max(b, q.bottom);
    }
    return { x: l, y: t, width: r - l, height: b - t };
  });
  if (!box) throw new Error("no board found to capture");

  /* A 16:9 window that CONTAINS the board rather than one derived from its
   * width alone. Sized from the width only, a board taller than 9/16 of it
   * simply got its bottom row sliced off — the first attempt cut every perk
   * card in half. Whichever dimension is binding decides the window; the
   * viewport is deliberately large enough that neither hits its edge. */
  const VW = 1700;
  const VH = 1100;
  const pad = 40;
  const contentW = box.width + pad * 2;
  const contentH = box.height + pad * 2;
  const width = Math.min(VW, Math.round(Math.max(contentW, contentH * (16 / 9))));
  const height = Math.min(VH, Math.round(width / (16 / 9)));
  // Less padding above than below. Centred, the top edge landed part-way
  // through the page's own caption and printed a sliced line of text; the
  // slack is better spent below, where the action buttons are.
  const clip = {
    x: Math.max(0, Math.min(VW - width, Math.round(box.x + box.width / 2 - width / 2))),
    y: Math.max(0, Math.min(VH - height, Math.round(box.y - pad * 0.55))),
    width,
    height,
  };

  let n = 0;
  for (let roll = 0; roll < 4; roll++) {
    // Two frames per roll: the settled build, then the next one.
    await page.screenshot({ path: join(dir, `${String(n++).padStart(3, "0")}.png`), clip });
    await page.getByRole("button", { name: "Сгенерировать новый билд" }).click();
    await page.waitForTimeout(260);
    await page.screenshot({ path: join(dir, `${String(n++).padStart(3, "0")}.png`), clip });
    await page.waitForTimeout(500);
  }
  await page.close();
  server.close();
  console.log(`dbd: ${n} frames at ${clip.width}x${clip.height}`);
}

async function captureDota(browser) {
  if (!existsSync(DOTA_DIR)) {
    console.log("skip dota — no checkout at " + DOTA_DIR);
    return;
  }
  const server = await serve(DOTA_DIR, 4412);
  const dir = frameDir("dota");
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://localhost:4412/");
  // The force simulation needs to settle before it is worth looking at.
  await page.waitForTimeout(4500);

  const clip = { x: 0, y: 0, width: 1280, height: 720 };
  let n = 0;

  // No idle-overview frame first. At card size the untouched graph is a field
  // of faint dots, and it is the frame a viewer sees before the GIF has
  // looped — the sequence opens on a hero already selected instead. Clicking
  // is the whole point of the graph, so a slideshow of it idle undersells it.
  const nodes = page.locator("svg circle");
  const total = await nodes.count();
  for (const i of [Math.floor(total * 0.3), Math.floor(total * 0.55), Math.floor(total * 0.8)]) {
    if (i >= total) continue;
    await nodes.nth(i).click({ force: true }).catch(() => {});
    await page.waitForTimeout(900);
    await page.screenshot({ path: join(dir, `${String(n++).padStart(3, "0")}.png`), clip });
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(dir, `${String(n++).padStart(3, "0")}.png`), clip });
  }
  await page.close();
  server.close();
  console.log(`dota: ${n} frames at ${clip.width}x${clip.height}`);
}

const browser = await chromium.launch();
await captureDbd(browser);
await captureDota(browser);
await browser.close();
console.log("frames in " + FRAMES);
