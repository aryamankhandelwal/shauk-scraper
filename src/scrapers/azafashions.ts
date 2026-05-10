import { Item } from "../types";
import {
  launchBrowser,
  createStealthPage,
  parsePrice,
} from "../lib/browser";

// Aza is a Next.js app — product links are a[href*="/products/"]
const WOMEN_URL = "https://www.azafashions.com/collection/women";
const MEN_URL = "https://www.azafashions.com/collection/men";

export async function scrapeAzaFashions(_query: string): Promise<Item[]> {
  const browser = await launchBrowser();
  try {
    const items: Item[] = [];
    for (const url of [WOMEN_URL, MEN_URL]) {
      if (items.length >= 10) break;
      const pageItems = await scrapePage(browser, url, 5);
      items.push(...pageItems);
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
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise((r) => setTimeout(r, 4000));

    const raw = await page.evaluate((limit: number) => {
      // Collect unique product anchors — Aza deduplicates by /products/{slug}/{id}
      const seen = new Set<string>();
      const results: Array<{
        title: string; priceText: string; imgSrc: string; href: string;
      }> = [];

      const anchors = Array.from(
        document.querySelectorAll('a[href*="/products/"]')
      ) as HTMLAnchorElement[];

      for (const a of anchors) {
        const href = a.href;
        if (seen.has(href)) continue;
        seen.add(href);

        const img = a.querySelector("img") as HTMLImageElement | null;
        // Title: image alt, or span/p inside anchor
        const titleEl = a.querySelector("p, span, h3, h2");
        const title =
          img?.getAttribute("alt")?.trim() ||
          titleEl?.textContent?.trim() ||
          "";

        // Price: look in or after the anchor for price sibling
        const priceEl = a.closest("[class]")?.querySelector(
          "[class*='price'], [class*='Price']"
        );

        if (!title || !href || !img?.src) continue;

        results.push({
          title,
          priceText: priceEl?.textContent?.trim() ?? "",
          imgSrc: img.src,
          href,
        });

        if (results.length >= limit * 2) break;
      }

      return results;
    }, limit);

    const items: Item[] = [];
    for (const r of raw) {
      if (items.length >= limit) break;
      items.push({
        title: r.title,
        price: parsePrice(r.priceText),
        image_url: r.imgSrc,
        product_url: r.href,
        source: "azafashions",
        currency: "INR",
      });
    }

    return items;
  } catch (err) {
    console.warn(`[azafashions] Page error:`, (err as Error).message);
    return [];
  } finally {
    await page.close();
  }
}
