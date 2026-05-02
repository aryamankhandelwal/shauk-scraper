import { Item } from "../types";
import {
  launchBrowser,
  createStealthPage,
  parsePrice,
  bestImageUrl,
  isJunkImage,
} from "../lib/browser";

const COLLECTION_URL = "https://www.manishmalhotra.in/collections/all";

interface PdpEnrichment {
  color: string | null;
  fabric: string | null;
}

async function enrichFromPdp(
  browser: import("puppeteer").Browser,
  productUrl: string
): Promise<PdpEnrichment> {
  const page = await createStealthPage(browser);
  try {
    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 15000 });
    return await page.evaluate(() => {
      const body = document.body.innerText;
      const colourMatch = body.match(/colou?r[:\s]+([^\n,]+)/i);
      const fabricMatch = body.match(/fabric[:\s]+([^\n,]+)/i);
      return {
        color:  colourMatch ? colourMatch[1].trim().toLowerCase() : null,
        fabric: fabricMatch ? fabricMatch[1].trim().toLowerCase() : null,
      };
    });
  } catch (err) {
    console.warn(`[manish] PDP enrichment failed for ${productUrl}:`, (err as Error).message);
    return { color: null, fabric: null };
  } finally {
    await page.close();
  }
}

export async function scrapeManish(): Promise<Item[]> {
  const browser = await launchBrowser();
  try {
    const page = await createStealthPage(browser);
    await page.goto(COLLECTION_URL, {
      waitUntil: "networkidle2",
      timeout: 20000,
    });

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise((r) => setTimeout(r, 3000));

    const raw = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll(".product-card, .grid__item, .product-item")
      );
      return cards.slice(0, 6).map((card) => {
        const anchor = card.querySelector("a[href*='/products/']") as HTMLAnchorElement | null;
        const img = card.querySelector("img") as HTMLImageElement | null;
        const titleEl =
          card.querySelector(".product-card__title, .product__title, h3, h2") ||
          card.querySelector("a");
        const priceEl = card.querySelector(
          ".product-card__price, .price, .money, [class*='price']"
        );

        return {
          // Prefer img.alt — Shopify cards have full untruncated title there
          title: img?.getAttribute("alt")?.trim() || titleEl?.textContent?.trim() || "",
          priceText: priceEl?.textContent?.trim() ?? "",
          imgSrc: img?.getAttribute("src") ?? "",
          imgSrcset: img?.getAttribute("srcset") ?? "",
          href: anchor?.getAttribute("href") ?? "",
        };
      });
    });

    // Build base items from collection page
    const baseItems: Item[] = [];
    for (const r of raw) {
      const imageUrl = bestImageUrl(r.imgSrcset || null, r.imgSrc);
      if (!imageUrl || isJunkImage(imageUrl)) continue;

      const price = parsePrice(r.priceText);
      const productUrl = r.href.startsWith("http")
        ? r.href
        : `https://www.manishmalhotra.in${r.href}`;

      if (!r.title || !productUrl.includes("/products/")) continue;

      baseItems.push({
        title: r.title,
        price,
        image_url: imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
        product_url: productUrl,
        source: "manish_malhotra",
      });

      if (baseItems.length >= 4) break;
    }

    // PDP enrichment — sequential to avoid anti-bot triggers
    const items: Item[] = [];
    for (const item of baseItems) {
      const { color, fabric } = await enrichFromPdp(browser, item.product_url);
items.push({
        ...item,
        ...(color  ? { color }  : {}),
        ...(fabric ? { fabric } : {}),
      });
    }

    return items;
  } finally {
    await browser.close();
  }
}
