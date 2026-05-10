import { Item } from "../types";
import { JsonLdConfig } from "../lib/scraper-base";

// ── Shopify types (subset) ────────────────────────────────────────────

interface ShopifyVariant {
  price: string;
  available: boolean;
}

interface ShopifyProduct {
  title: string;
  handle: string;
  product_type: string;
  variants: ShopifyVariant[];
  images: Array<{ src: string }>;
}

// ── JSON-LD types ─────────────────────────────────────────────────────

interface JsonLdOffer {
  price?: string | number;
  priceCurrency?: string;
}

interface JsonLdProduct {
  "@type": string;
  name?: string;
  url?: string;
  image?: string | string[] | { url: string } | Array<{ url: string }>;
  offers?: JsonLdOffer | JsonLdOffer[];
}

// ── Main entry point ──────────────────────────────────────────────────

/**
 * Scraper for "jsonld" type sites — all of which are Shopify stores.
 * Strategy:
 *   1. Try the Shopify /products.json endpoint (fast, no browser)
 *   2. Fall back to fetching collection pages and parsing JSON-LD <script> tags
 */
export async function scrapeJsonLd(config: JsonLdConfig): Promise<Item[]> {
  const maxItems = config.maxItems ?? 20;
  const domain = new URL(config.collectionUrls[0]).origin; // e.g. https://www.rawmango.in

  console.log(`[jsonld:${config.name}] Trying Shopify /products.json...`);

  // Phase 1: Try Shopify /products.json
  try {
    const url = `${domain}/products.json?limit=${Math.min(maxItems + 10, 250)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (res.ok) {
      const data = (await res.json()) as { products?: ShopifyProduct[] };
      if (data.products?.length) {
        const items = mapShopifyProducts(data.products, domain, config.name, maxItems);
        console.log(`[jsonld:${config.name}] Shopify: ${items.length} products`);
        return items;
      }
    }
  } catch {
    // Fall through to JSON-LD
  }

  // Phase 2: Fetch collection pages and parse JSON-LD
  console.log(`[jsonld:${config.name}] Falling back to JSON-LD page scraping...`);
  const allItems: Item[] = [];

  for (const collectionUrl of config.collectionUrls) {
    if (allItems.length >= maxItems) break;
    const pageItems = await scrapeViaJsonLd(collectionUrl, config.name, maxItems - allItems.length);
    allItems.push(...pageItems);
  }

  console.log(`[jsonld:${config.name}] JSON-LD: ${allItems.length} products`);
  return allItems;
}

// ── Helpers ───────────────────────────────────────────────────────────

function mapShopifyProducts(
  products: ShopifyProduct[],
  domain: string,
  source: string,
  maxItems: number
): Item[] {
  const items: Item[] = [];
  for (const p of products) {
    if (items.length >= maxItems) break;
    if (!p.images?.length) continue;

    const priceStr = p.variants?.[0]?.price;
    const price = priceStr ? parseFloat(priceStr) : null;
    const imageUrl = p.images[0].src.replace(/\?.*$/, "");

    items.push({
      title: p.title,
      price: price && price > 0 ? price : null,
      image_url: imageUrl,
      product_url: `${domain}/products/${p.handle}`,
      source,
      garment_type: p.product_type || null,
      currency: "INR",
    });
  }
  return items;
}

async function scrapeViaJsonLd(
  url: string,
  source: string,
  maxItems: number
): Promise<Item[]> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  // Extract all <script type="application/ld+json"> blocks
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const items: Item[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null && items.length < maxItems) {
    let data: unknown;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }

    // Handle single object or array
    const schemas = Array.isArray(data) ? data : [data];

    for (const schema of schemas) {
      if (items.length >= maxItems) break;
      if (!schema || typeof schema !== "object") continue;

      const s = schema as JsonLdProduct;
      if (s["@type"] !== "Product") continue;

      const name = s.name;
      const productUrl = s.url;
      if (!name || !productUrl) continue;

      const image = extractImageUrl(s.image);
      if (!image) continue;

      const offer = Array.isArray(s.offers) ? s.offers[0] : s.offers;
      const price = offer?.price ? parseFloat(String(offer.price)) : null;

      items.push({
        title: name,
        price: price && price > 0 ? price : null,
        image_url: image,
        product_url: productUrl,
        source,
        currency: offer?.priceCurrency ?? "INR",
      });
    }
  }

  return items;
}

function extractImageUrl(
  image: JsonLdProduct["image"]
): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) return (first as { url: string }).url;
    return null;
  }
  if (typeof image === "object" && "url" in image) return (image as { url: string }).url;
  return null;
}
