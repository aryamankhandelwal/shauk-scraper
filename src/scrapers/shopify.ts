import { Item } from "../types";
import { ShopifyConfig, normalizeSize } from "../lib/scraper-base";

// ── Shopify JSON types (subset we care about) ──────────────────────

interface ShopifyVariant {
  title: string;
  price: string;
  available: boolean;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

const PER_PAGE = 250;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

// ── Scraper ─────────────────────────────────────────────────────────

/**
 * Generic Shopify scraper using the public /products.json endpoint.
 * Paginates through pages of 250 until maxItems is reached or catalog is exhausted.
 */
export async function scrapeShopify(config: ShopifyConfig): Promise<Item[]> {
  const maxItems = config.maxItems ?? 20;
  const baseUrl = `https://${config.domain}`;
  const jsonPath = config.collectionHandle
    ? `/collections/${config.collectionHandle}/products.json`
    : `/products.json`;

  const items: Item[] = [];
  let page = 1;

  while (items.length < maxItems) {
    const url = `${baseUrl}${jsonPath}?limit=${PER_PAGE}&page=${page}`;

    if (page === 1) {
      console.log(`[shopify:${config.name}] Fetching ${url}`);
    }

    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      throw new Error(`[shopify:${config.name}] HTTP ${res.status} from ${config.domain}`);
    }

    const data = (await res.json()) as ShopifyResponse;

    if (!data.products?.length) break;

    for (const product of data.products) {
      if (items.length >= maxItems) break;

      if (!product.images?.length) continue;

      if (
        config.allowedProductTypes?.length &&
        !config.allowedProductTypes.some(
          (t) => product.product_type.toLowerCase().includes(t.toLowerCase())
        )
      ) {
        continue;
      }

      const priceStr = product.variants?.[0]?.price;
      const price = priceStr ? parseFloat(priceStr) : null;
      const availableSizes = extractSizes(product.variants);
      const imageUrl = product.images[0].src.replace(/\?.*$/, "");

      items.push({
        title: product.title,
        price: price && price > 0 ? price : null,
        image_url: imageUrl,
        product_url: `${baseUrl}/products/${product.handle}`,
        source: config.name,
        gender: config.gender,
        garment_type: product.product_type || null,
        available_sizes: availableSizes.length > 0 ? availableSizes : undefined,
        currency: "INR",
      });
    }

    // If the page returned fewer than PER_PAGE, we've hit the last page
    if (data.products.length < PER_PAGE) break;
    page++;
  }

  console.log(`[shopify:${config.name}] Scraped ${items.length} products`);
  return items;
}

// ── Helpers ──────────────────────────────────────────────────────────

function extractSizes(variants: ShopifyVariant[]): string[] {
  const sizes: string[] = [];
  const seen = new Set<string>();

  for (const v of variants) {
    if (!v.available) continue;

    const normalized = normalizeSize(v.title);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      sizes.push(normalized);
    }
  }

  return sizes;
}
