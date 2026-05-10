import { Item } from "../types";
import {
  launchBrowser,
  createStealthPage,
  parsePrice,
} from "../lib/browser";

const WOMEN_URL =
  "https://www.tatacliq.com/womens-clothing-ethnic-wear/c-msh1012";
const MEN_URL =
  "https://www.tatacliq.com/mens-clothing-ethnic-wear/c-msh1009";

export async function scrapeTataCliq(_query: string): Promise<Item[]> {
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
    await new Promise((r) => setTimeout(r, 3000));

    const raw = await page.evaluate((limit: number) => {
      // Tata CLiQ: card=.plpGridItem, title in a[aria-label], image in img
      const cards = Array.from(
        document.querySelectorAll(".plpGridItem")
      ).slice(0, limit * 2);

      return cards.map((card) => {
        // Main product anchor has aria-label = full product title
        const anchor = card.querySelector(
          "a[href*='/p-mp'], a[href*='/p/']"
        ) as HTMLAnchorElement | null;
        const img = card.querySelector("img") as HTMLImageElement | null;
        const brand =
          (card.querySelector(".newPLPTags") as HTMLElement)?.innerText?.trim() ?? "";
        const title = anchor?.getAttribute("aria-label")?.trim() ?? img?.getAttribute("alt")?.trim() ?? "";
        const priceEl = card.querySelector(
          "[class*='priceDetail'], [class*='price'], .ProductModule__price"
        );

        return {
          title: title,
          brand,
          priceText: priceEl?.textContent?.trim() ?? "",
          imgSrc: img?.getAttribute("src") ?? "",
          href: anchor?.getAttribute("href") ?? "",
        };
      });
    }, limit);

    const items: Item[] = [];
    for (const r of raw) {
      if (items.length >= limit) break;
      if (!r.title || !r.href || !r.imgSrc) continue;

      const productUrl = r.href.startsWith("http")
        ? r.href
        : `https://www.tatacliq.com${r.href}`;

      items.push({
        title: r.title,
        price: parsePrice(r.priceText),
        image_url: r.imgSrc,
        product_url: productUrl,
        source: "tatacliq",
        currency: "INR",
      });
    }

    return items;
  } catch (err) {
    console.warn(`[tatacliq] Page error:`, (err as Error).message);
    return [];
  } finally {
    await page.close();
  }
}
