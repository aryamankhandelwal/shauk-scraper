import { Item } from "../types";
import {
  launchBrowser,
  createStealthPage,
  parsePrice,
  bestImageUrl,
  isJunkImage,
} from "../lib/browser";

// Pernia's Pop-Up Shop PWA shows a login modal on first load.
// Work around by intercepting their product API calls.
const SEARCH_URL = "https://www.perniaspopupshop.com/in/women/lehenga-choli";

export async function scrapePerniasPopup(_query: string): Promise<Item[]> {
  const browser = await launchBrowser();
  try {
    const intercepted: Item[] = [];

    const page = await createStealthPage(browser);

    // Intercept API responses that contain product data
    page.on("response", async (resp) => {
      const url = resp.url();
      if (!url.includes("api") && !url.includes("graphql") && !url.includes("product")) return;
      if (resp.headers()["content-type"]?.includes("application/json")) {
        try {
          const json = await resp.json();
          const products = extractProductsFromJson(json);
          intercepted.push(...products);
        } catch { /* ignore parse errors */ }
      }
    });

    await page.goto(SEARCH_URL, { waitUntil: "networkidle2", timeout: 35000 });

    // Try to close login modal if present
    const closeBtn = await page.$('[class*="cross"], [class*="close"], button[aria-label*="close"]');
    if (closeBtn) await closeBtn.click().catch(() => {});

    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise((r) => setTimeout(r, 4000));

    // If API interception got products, return those
    if (intercepted.length > 0) {
      return intercepted.slice(0, 30);
    }

    // Otherwise try DOM scraping
    const raw = await page.evaluate((limit: number) => {
      const anchors = Array.from(
        document.querySelectorAll('a[href*="/in/women/"], a[href*="/in/men/"], a[href*="/product"]')
      ).filter(a => {
        const parts = new URL((a as HTMLAnchorElement).href).pathname.split("/").filter(Boolean);
        return parts.length >= 4; // /in/women/category/product-slug
      }).slice(0, limit * 2) as HTMLAnchorElement[];

      const seen = new Set<string>();
      const results: Array<{ title: string; priceText: string; imgSrc: string; imgSrcset: string; href: string }> = [];

      for (const a of anchors) {
        if (seen.has(a.href)) continue;
        seen.add(a.href);

        const img = a.querySelector("img") as HTMLImageElement | null;
        const titleEl = a.querySelector("[class*='name'], [class*='title'], p, span");
        const priceEl = a.querySelector("[class*='price'], [class*='Price']");

        results.push({
          title: titleEl?.textContent?.trim() ?? img?.getAttribute("alt")?.trim() ?? "",
          priceText: priceEl?.textContent?.trim() ?? "",
          imgSrc: img?.getAttribute("src") ?? "",
          imgSrcset: img?.getAttribute("srcset") ?? "",
          href: a.href,
        });
      }
      return results;
    }, 30);

    const items: Item[] = [];
    for (const r of raw) {
      if (items.length >= 30) break;
      if (!r.title || !r.href) continue;
      const imageUrl = bestImageUrl(r.imgSrcset || null, r.imgSrc);
      if (!imageUrl || isJunkImage(imageUrl)) continue;

      items.push({
        title: r.title,
        price: parsePrice(r.priceText),
        image_url: imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
        product_url: r.href,
        source: "perniaspopupshop",
        currency: "INR",
      });
    }

    return items;
  } finally {
    await browser.close();
  }
}

// Try to pull products from intercepted API JSON responses
function extractProductsFromJson(json: unknown): Item[] {
  if (!json || typeof json !== "object") return [];

  const items: Item[] = [];

  // Common API patterns: { products: [...] } or { data: { products: [...] } }
  const candidates = [
    (json as Record<string, unknown>).products,
    (json as Record<string, unknown>).data,
    (json as Record<string, unknown>).items,
    (json as Record<string, unknown>).results,
  ].flat().filter(Boolean);

  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    const p = c as Record<string, unknown>;
    if (typeof p.name === "string" && (p.image_url || p.imageUrl || p.thumbnail)) {
      const imgRaw = (p.image_url ?? p.imageUrl ?? p.thumbnail ?? "") as string;
      items.push({
        title: p.name,
        price: typeof p.price === "number" ? p.price : null,
        image_url: imgRaw,
        product_url: typeof p.url === "string" ? p.url : `https://www.perniaspopupshop.com`,
        source: "perniaspopupshop",
        currency: "INR",
      });
    }
  }
  return items;
}
