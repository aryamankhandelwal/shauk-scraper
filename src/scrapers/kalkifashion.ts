import { Item } from "../types";

// Kalki Fashion is a Shopify store — use /products.json, no Puppeteer needed.

interface ShopifyProduct {
  title: string;
  handle: string;
  product_type: string;
  variants: Array<{ price: string }>;
  images: Array<{ src: string }>;
}

const BASE_URL = "https://www.kalkifashion.com";

export async function scrapeKalkiFashion(_query: string): Promise<Item[]> {
  const maxItems = 20;
  const url = `${BASE_URL}/products.json?limit=${maxItems + 10}`;

  console.log(`[kalkifashion] Fetching ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as { products?: ShopifyProduct[] };
    if (!data.products?.length) {
      console.warn("[kalkifashion] No products returned");
      return [];
    }

    const items: Item[] = [];
    for (const p of data.products) {
      if (items.length >= maxItems) break;
      if (!p.images?.length) continue;

      const price = p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null;
      const imageUrl = p.images[0].src.replace(/\?.*$/, "");

      items.push({
        title: p.title,
        price: price && price > 0 ? price : null,
        image_url: imageUrl,
        product_url: `${BASE_URL}/products/${p.handle}`,
        source: "kalkifashion",
        garment_type: p.product_type || null,
        currency: "INR",
      });
    }

    console.log(`[kalkifashion] Scraped ${items.length} products`);
    return items;
  } catch (err) {
    console.warn(`[kalkifashion] Failed:`, (err as Error).message);
    return [];
  }
}
