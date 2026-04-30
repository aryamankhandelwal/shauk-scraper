import { Item } from "../types";
import {
  launchBrowser,
  createStealthPage,
  parsePrice,
  bestImageUrl,
  isJunkImage,
} from "../lib/browser";

export async function scrapeNykaa(query: string): Promise<Item[]> {
  const url = `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(query)}`;
  const browser = await launchBrowser();
  try {
    const page = await createStealthPage(browser);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise((r) => setTimeout(r, 3000));

    const raw = await page.evaluate(() => {
      // Nykaa uses aria-label IDs per product: aria-label-{id}-1 (brand),
      // aria-label-{id}-2 (product name), plus [aria-label="Discounted price"]
      const anchors = Array.from(
        document.querySelectorAll('a[data-at="product"]')
      );
      const seen = new Set<string>();
      const results: Array<{
        title: string;
        priceText: string;
        imgSrc: string;
        imgSrcset: string;
        href: string;
      }> = [];

      for (const a of anchors) {
        const href = (a as HTMLAnchorElement).href;
        if (!href.includes("/p/") || seen.has(href)) continue;
        seen.add(href);

        const img = a.querySelector("img") as HTMLImageElement | null;
        const brand =
          a.querySelector("[id$='-1'][class]")?.textContent?.trim() ?? "";
        const product =
          a.querySelector("[id$='-2'][class]")?.textContent?.trim() ?? "";
        const priceEl = a.querySelector('[aria-label="Discounted price"]');

        results.push({
          title: brand ? `${brand} ${product}` : product,
          priceText: priceEl?.textContent?.trim() ?? "",
          imgSrc: img?.getAttribute("src") ?? "",
          imgSrcset: img?.getAttribute("srcset") ?? "",
          href,
        });

        if (results.length >= 6) break;
      }
      return results;
    });

    const items: Item[] = [];
    for (const r of raw) {
      const imageUrl = bestImageUrl(r.imgSrcset || null, r.imgSrc);
      if (!imageUrl || isJunkImage(imageUrl)) continue;

      const price = parsePrice(r.priceText);
      const productUrl = r.href.startsWith("http")
        ? r.href
        : `https://www.nykaafashion.com${r.href}`;

      if (!r.title) continue;

      items.push({
        title: r.title,
        price,
        image_url: imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl,
        product_url: productUrl,
        source: "nykaa",
      });

      if (items.length >= 4) break;
    }

    return items;
  } finally {
    await browser.close();
  }
}
