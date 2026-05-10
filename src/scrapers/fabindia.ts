import { Item } from "../types";
import {
  launchBrowser,
  createStealthPage,
  parsePrice,
} from "../lib/browser";

// Fabindia: Angular/SAP Commerce Cloud app.
// Card: div.product[data-pid], link: a[tabindex="-1"], image: img inside .plpImagewrapper
const WOMEN_URL = "https://www.fabindia.com/clothing/women-ethnic-wear";
const MEN_URL = "https://www.fabindia.com/clothing/men-ethnic-wear";

const BASE_URL = "https://www.fabindia.com";

export async function scrapeFabindia(_query: string): Promise<Item[]> {
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
    await page.goto(url, { waitUntil: "networkidle2", timeout: 35000 });

    // Scroll incrementally to trigger Angular lazy loading
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await new Promise((r) => setTimeout(r, 1200));
    }

    const raw = await page.evaluate((limit: number) => {
      const cards = Array.from(
        document.querySelectorAll("div.product[data-pid]")
      ).slice(0, limit * 2);

      return cards.map((card) => {
        // Product link: the non-wishlist anchor (tabindex="-1" or href starting with /)
        const anchor = Array.from(card.querySelectorAll("a[href]")).find(
          (a) => (a as HTMLAnchorElement).href.includes("/") && !a.classList.contains("btn")
        ) as HTMLAnchorElement | null;

        const img = card.querySelector(".plpImagewrapper img, img") as HTMLImageElement | null;

        // Title: img alt or app-fab-product-grid-item text content
        const titleEl = card.querySelector(
          ".product-name, .plp-product-name, [class*='product-name'], h3, h2"
        );
        const title =
          titleEl?.textContent?.trim() ||
          img?.getAttribute("alt")?.trim() ||
          anchor?.textContent?.trim() ||
          "";

        const priceEl = card.querySelector(
          ".price, [class*='price'], .cx-price"
        );

        return {
          title,
          priceText: priceEl?.textContent?.trim() ?? "",
          imgSrc: img?.getAttribute("src") ?? "",
          href: anchor?.getAttribute("href") ?? "",
        };
      });
    }, limit);

    const items: Item[] = [];
    for (const r of raw) {
      if (items.length >= limit) break;
      if (!r.href || !r.imgSrc) continue;

      const productUrl = r.href.startsWith("http")
        ? r.href
        : `${BASE_URL}${r.href.startsWith("/") ? "" : "/"}${r.href}`;

      // Use URL slug as title fallback
      const title = r.title || r.href.split("/").pop()?.replace(/-\d+$/, "").replace(/-/g, " ") || "";
      if (!title) continue;

      items.push({
        title,
        price: parsePrice(r.priceText),
        image_url: r.imgSrc,
        product_url: productUrl,
        source: "fabindia",
        currency: "INR",
      });
    }

    return items;
  } catch (err) {
    console.warn(`[fabindia] Page error:`, (err as Error).message);
    return [];
  } finally {
    await page.close();
  }
}
