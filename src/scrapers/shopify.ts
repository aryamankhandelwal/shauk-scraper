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

// ── Scraper ─────────────────────────────────────────────────────────

/**
 * Generic Shopify scraper using the public /products.json endpoint.
 * No Puppeteer required — plain HTTP fetch.
 */
export async function scrapeShopify(config: ShopifyConfig): Promise<Item[]> {
  const maxItems = config.maxItems ?? 20;
  const baseUrl = `https://${config.domain}`;

  // Build the URL: either a specific collection or all products
  const jsonPath = config.collectionHandle
    ? `/collections/${config.collectionHandle}/products.json`
    : `/products.json`;

  const url = `${baseUrl}${jsonPath}?limit=${Math.min(maxItems + 10, 250)}`;

  console.log(`[shopify:${config.name}] Fetching ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(
      `[shopify:${config.name}] HTTP ${res.status} from ${config.domain}`
    );
  }

  const data = (await res.json()) as ShopifyResponse;

  if (!data.products?.length) {
    console.warn(`[shopify:${config.name}] No products returned`);
    return [];
  }

  const items: Item[] = [];

  for (const product of data.products) {
    if (items.length >= maxItems) break;

    // Skip products with no images
    if (!product.images?.length) continue;

    // Filter by allowed product types if specified
    if (
      config.allowedProductTypes?.length &&
      !config.allowedProductTypes.some(
        (t) => product.product_type.toLowerCase().includes(t.toLowerCase())
      )
    ) {
      continue;
    }

    // Price from first variant
    const priceStr = product.variants?.[0]?.price;
    const price = priceStr ? parseFloat(priceStr) : null;

    // Available sizes from variants
    const availableSizes = extractSizes(product.variants);

    // Image URL — Shopify CDN, strip query params for clean URL
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

  console.log(
    `[shopify:${config.name}] Scraped ${items.length} products`
  );

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
