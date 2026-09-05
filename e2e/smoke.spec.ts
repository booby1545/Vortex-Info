import { test, expect } from "@playwright/test";
import { PROJECTS } from "../data/projects";

test.describe("navigation", () => {
  test("home page lists all tools and links work", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Полезные ресурсы" })).toBeVisible();

    for (const [label, heading] of [
      ["SpotX", "SpotX"],
      ["Lost Souls", "Lost Souls"],
      ["Мои проекты", "Мои проекты"],
    ] as const) {
      await page.getByRole("link", { name: label, exact: true }).first().click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await page.goBack();
    }
  });

  test("DBD Randomizer card links out to the standalone site", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /DBD Randomizer/ });
    await expect(link).toHaveAttribute(
      "href",
      "https://flexeykindev.github.io/dbd-perk-randomizer/",
    );
    await expect(link).toHaveAttribute("target", "_blank");
  });
});

test.describe("projects page", () => {
  // Driven from the data rather than a hand-written list of three titles and
  // a hardcoded count: the previous version had to be edited in four places
  // to add a project, and silently kept passing when one was missing.
  test("renders all project cards with a working GitHub link", async ({ page }) => {
    await page.goto("/projects");
    for (const project of PROJECTS) {
      await expect(page.getByRole("heading", { name: project.title })).toBeVisible();
    }

    const githubLinks = page.getByRole("link", { name: "GitHub" });
    await expect(githubLinks).toHaveCount(PROJECTS.length);
    await expect(githubLinks.first()).toHaveAttribute("href", /github\.com/);
  });

  test("a desktop app offers a download, not a demo", async ({ page }) => {
    await page.goto("/projects");
    for (const project of PROJECTS.filter((p) => p.downloadUrl)) {
      const card = page.locator(`[data-project="${project.slug}"]`);
      await expect(card.getByRole("link", { name: "Скачать" })).toHaveAttribute(
        "href",
        project.downloadUrl!,
      );
      await expect(card.getByRole("link", { name: "Открыть демо" })).toHaveCount(0);
    }
  });
});

test.describe("theme toggle", () => {
  test("switches theme and persists across navigation", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Переключить тему" });
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("link", { name: "Мои проекты", exact: true }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
