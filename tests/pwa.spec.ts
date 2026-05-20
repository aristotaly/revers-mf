import { test, expect } from "@playwright/test";

test.describe("PWA installability", () => {
  test("manifest is served with the right shape and content type", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/manifest\+json/);

    const manifest = await res.json();
    expect(manifest.name).toBe("Weight Trend Tracker");
    expect(manifest.short_name).toBe("Weight Trend");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/dashboard");
    expect(manifest.theme_color).toBe("#5b21b6");

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    const hasMaskable = manifest.icons.some(
      (i: { purpose?: string }) => i.purpose === "maskable",
    );
    expect(hasMaskable).toBe(true);
  });

  test("service worker is served with correct headers", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(/javascript/);
    expect(res.headers()["cache-control"] ?? "").toMatch(/no-cache/);

    const body = await res.text();
    expect(body).toMatch(/addEventListener\(["']install["']/);
    expect(body).toMatch(/addEventListener\(["']fetch["']/);
  });

  test("offline shell is reachable without auth", async ({ request }) => {
    const res = await request.get("/offline.html");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("You're offline");
  });

  test("required icon assets exist", async ({ request }) => {
    for (const path of [
      "/icon-192.png",
      "/icon-512.png",
      "/icon-maskable.png",
      "/apple-icon.png",
      "/favicon.png",
    ]) {
      const res = await request.get(path);
      expect(res.status(), `expected 200 for ${path}`).toBe(200);
      expect(res.headers()["content-type"] ?? "").toMatch(/image\/png/);
    }
  });

  test("root layout advertises the manifest and apple-touch-icon", async ({
    page,
  }) => {
    // /login is unauthenticated and renders the same root layout.
    await page.goto("/login");
    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .first()
      .getAttribute("href");
    expect(manifestHref).toBe("/manifest.webmanifest");

    const apple = await page
      .locator('link[rel="apple-touch-icon"]')
      .first()
      .getAttribute("href");
    expect(apple).toBe("/apple-icon.png");

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .first()
      .getAttribute("content");
    expect(themeColor).toBe("#5b21b6");
  });
});
