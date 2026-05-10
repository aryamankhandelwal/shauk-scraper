import { Item } from "../types";
import { launchBrowser, createStealthPage, parsePrice } from "../lib/browser";

// Manyavar uses Salesforce Commerce Cloud (Demandware), not Shopify.
// Selectors confirmed from live page inspection.
const CATEGORY_URLS = [
  "https://www.manyavar.com/en-in/men/sherwanis",
  "https://www.manyavar.com/en-in/men/kurtas",
];

const BASE_URL = "https://www.manyavar.com";

export async function scrapeManyavar(_query: string): Promise<Item[]> {
  const browser = await launchBrowser();
  try {
    const seen = new Set<string>();
    const items: Item[] = [];

    for (const url of CATEGORY_URLS) {
      if (items.length >= 10) break;
      const pageItems = await scrapePage(browser, url, 8);
      for (const item of pageItems) {
        if (!seen.has(item.product_url)) {
          seen.add(item.product_url);
          items.push(item);
        }
      }
    }

    return items;
  } finally {
    await browser.close();
  }
}

async function scrapePage(
  browser: import("puppeteer").Browser,
  url: string,
  limit: number
): Promise<Item[]> {
  const page = await createStealthPage(browser);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 35000 });

    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise((r) => setTimeout(r, 4000));

    const raw = await page.evaluate((limit: number) => {
      const tiles = Array.from(document.querySelectorAll(".product-tile")).slice(0, limit * 2);

      return tiles.map((tile) => {
        // Link + title from .pdp-link a.link
        const linkEl = tile.querySelector(".pdp-link a.link") as HTMLAnchorElement | null;
        // Image from the product image anchor
        const img = tile.querySelector("a.d-flex img, img[itemprop='image']") as HTMLImageElement | null;
        // Price: use content attribute (clean number) or fallback to text
        const priceEl = tile.querySelector(".price .value, p.value[content]") as HTMLElement | null;
        const priceContent = priceEl?.getAttribute("content") ?? priceEl?.textContent?.trim() ?? "";

        return {
          title: img?.getAttribute("alt")?.trim() || linkEl?.textContent?.trim() || "",
          priceText: priceContent,
          imgSrc: img?.getAttribute("src") ?? "",
          href: linkEl?.getAttribute("href") ?? "",
        };
      });
    }, limit);

    const items: Item[] = [];
    for (const r of raw) {
      if (items.length >= limit) break;
      if (!r.title || !r.href || !r.imgSrc) continue;

      // Filter out women's items (Mohey brand) from men's pages
      if (r.title.toLowerCase().includes("women") || r.title.toLowerCase().includes("mohey")) continue;

      const productUrl = r.href.startsWith("http")
        ? r.href
        : `${BASE_URL}${r.href.startsWith("/") ? "" : "/"}${r.href}`;

      items.push({
        title: r.title,
        price: parsePrice(r.priceText),
        image_url: r.imgSrc,
        product_url: productUrl,
        source: "manyavar",
        gender: "male",
        currency: "INR",
      });
    }

    return items;
  } catch (err) {
    console.warn(`[manyavar] Page error for ${url}:`, (err as Error).message);
    return [];
  } finally {
    await page.close();
  }
}
