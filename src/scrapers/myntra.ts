import { Item } from "../types";
import {
  launchBrowser,
  createStealthPage,
  parsePrice,
  bestImageUrl,
  isJunkImage,
} from "../lib/browser";

export async function scrapeMyntra(query: string): Promise<Item[]> {
  const slug = query.replace(/\s+/g, "-");
  const url = `https://www.myntra.com/${slug}`;
  const browser = await launchBrowser();
  try {
    const page = await createStealthPage(browser);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise((r) => setTimeout(r, 3000));

    const raw = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll(".product-base, [class*='product-base']")
      );
      return cards.slice(0, 6).map((card) => {
        const anchor = card.querySelector("a") as HTMLAnchorElement | null;
        const img = card.querySelector("img") as HTMLImageElement | null;
        const brand =
          card.querySelector(".product-brand")?.textContent?.trim() ?? "";
        const product =
          card.querySelector(".product-product")?.textContent?.trim() ?? "";
        const priceEl = card.querySelector(
          ".product-discountedPrice, .product-price, [class*='discountedPrice']"
        );

        return {
          title: brand ? `${brand} ${product}` : product,
          priceText: priceEl?.textContent?.trim() ?? "",
          imgSrc: img?.getAttribute("src") ?? "",
          imgSrcset: img?.getAttribute("srcset") ?? "",
          href: anchor?.getAttribute("href") ?? "",
        };
      });
    });

    const items: Item[] = [];
    for (const r of raw) {
      const imageUrl = bestImageUrl(r.imgSrcset || null, r.imgSrc);
      if (!imageUrl || isJunkImage(imageUrl)) continue;

      const price = parsePrice(r.priceText);
      const productUrl = r.href.startsWith("http")
        ? r.href
        : `https://www.myntra.com${r.href.startsWith("/") ? "" : "/"}${r.href}`;

      if (!r.title) continue;

      items.push({
        title: r.title,
        price,
        image_url: imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
        product_url: productUrl,
        source: "myntra",
      });

      if (items.length >= 4) break;
    }

    return items;
  } finally {
    await browser.close();
  }
}
