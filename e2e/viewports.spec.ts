import { test, expect, type Page } from "@playwright/test";

/* Display QA for the hub, the Projects tab in particular: a small phone, a
 * large phone, a tablet, a laptop, 1080p, 1440p and a 4K TV.
 *
 * Looking for the failures a single desktop viewport cannot show — content
 * wider than the screen, text too small to read at that distance, and a
 * layout that stops using the screen and strands everything in a strip. */

const VIEWPORTS = [
  { name: "phone-small  360x740", width: 360, height: 740 },
  { name: "phone-large  430x932", width: 430, height: 932 },
  { name: "tablet       768x1024", width: 768, height: 1024 },
  { name: "laptop      1366x768", width: 1366, height: 768 },
  { name: "desktop     1920x1080", width: 1920, height: 1080 },
  { name: "monitor     2560x1440", width: 2560, height: 1440 },
  { name: "tv-4k       3840x2160", width: 3840, height: 2160 },
];

const ROUTES = ["/projects", "/", "/spotx", "/lost-souls"];

async function audit(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const overflowers: string[] = [];
    const tiny: string[] = [];

    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      // Content inside something that scrolls is allowed to exceed the
      // viewport; only what pushes the PAGE out of shape is a defect.
      let scrollable = false;
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const ox = getComputedStyle(n).overflowX;
        if (ox === "auto" || ox === "scroll") {
          scrollable = true;
          break;
        }
      }
      if (scrollable) continue;

      if (r.right > doc.clientWidth + 1 || r.left < -1) {
        const path: string[] = [];
        for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
          const cls =
            typeof n.className === "string" && n.className
              ? "." + n.className.trim().split(/\s+/).slice(0, 3).join(".")
              : "";
          path.unshift(n.tagName.toLowerCase() + cls);
        }
        if (overflowers.length < 4) {
          overflowers.push(
            `right=${Math.round(r.right)} "${(el.textContent ?? "").trim().slice(0, 20)}" ${path.slice(-3).join(" > ")}`,
          );
        }
      }

      const text = (el.textContent ?? "").trim();
      if (text && el.children.length === 0 && parseFloat(cs.fontSize) < 12 && tiny.length < 5) {
        tiny.push(`${Math.round(parseFloat(cs.fontSize))}px "${text.slice(0, 22)}"`);
      }
    }

    const main = document.querySelector("main") ?? document.body;
    const used = Math.round(main.getBoundingClientRect().width);
    return {
      sideways: doc.scrollWidth > doc.clientWidth + 1,
      scrollW: doc.scrollWidth,
      clientW: doc.clientWidth,
      overflowers,
      tiny,
      contentWidth: used,
      usedPct: Math.round((used / doc.clientWidth) * 100),
    };
  });
}

for (const vp of VIEWPORTS) {
  test(`display: ${vp.name}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const rows: string[] = [];
    for (const route of ROUTES) {
      await page.goto(route);
      await page.locator("main").first().waitFor({ state: "visible" });
      const a = await audit(page);
      rows.push(
        `  ${route.padEnd(14)} content ${String(a.contentWidth).padStart(5)}px (${String(a.usedPct).padStart(3)}%)` +
          `${a.sideways ? `  SIDEWAYS ${a.scrollW}>${a.clientW}` : ""}` +
          `${a.overflowers.length ? `\n      overflow: ${a.overflowers.join("; ")}` : ""}` +
          `${a.tiny.length ? `\n      tiny text: ${a.tiny.join("; ")}` : ""}`,
      );
      expect(a.sideways, `${vp.name} ${route}: page scrolls sideways`).toBe(false);
      expect(a.overflowers, `${vp.name} ${route}: elements past the viewport`).toEqual([]);
    }
    console.log(`\n[${vp.name}]\n${rows.join("\n")}`);
  });
}
