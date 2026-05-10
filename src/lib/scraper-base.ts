import { ItemGender } from "../types";

// ── Scraper config types ────────────────────────────────────────────

export interface ScraperConfigBase {
  name: string;        // e.g. "sabyasachi" — used as Item.source
  domain: string;      // e.g. "sabyasachi.com"
  gender?: ItemGender; // default gender if site is single-gender
  maxItems?: number;   // default 20
}

export interface ShopifyConfig extends ScraperConfigBase {
  type: "shopify";
  /** Optional: specific collection handle to scrape (e.g. "sarees") */
  collectionHandle?: string;
  /** Filter products by Shopify product_type field */
  allowedProductTypes?: string[];
}

export interface JsonLdConfig extends ScraperConfigBase {
  type: "jsonld";
  /** URLs of collection/category pages to scrape */
  collectionUrls: string[];
  /** CSS selector for product links (fallback if JSON-LD is missing) */
  productLinkSelector?: string;
}

export interface PuppeteerConfig extends ScraperConfigBase {
  type: "puppeteer";
  /** Name of the dedicated scraper function (e.g. "myntra", "ajio") */
  scraperId: string;
}

export type ScraperConfig = ShopifyConfig | JsonLdConfig | PuppeteerConfig;

// ── Size normalization ──────────────────────────────────────────────

const SIZE_MAP: Record<string, string> = {
  "xxs": "XXS",
  "extra extra small": "XXS",
  "xs": "XS",
  "extra small": "XS",
  "s": "S",
  "small": "S",
  "m": "M",
  "medium": "M",
  "l": "L",
  "large": "L",
  "xl": "XL",
  "extra large": "XL",
  "xxl": "XXL",
  "extra extra large": "XXL",
  "2xl": "XXL",
  "xxxl": "XXXL",
  "3xl": "XXXL",
  "free": "Free",
  "free size": "Free",
  "one size": "Free",
  "os": "Free",
};

// Patterns that indicate the variant is a color, not a size
const COLOR_NOISE = /^(red|blue|green|black|white|pink|yellow|maroon|navy|grey|gray|beige|cream|gold|silver|purple|orange|teal|brown|ivory|coral|peach|mint|lavender|rust|olive|wine|mauve|nude|sage|emerald|cobalt|magenta|turquoise|burgundy|charcoal|mustard|rose|lilac|aqua|plum|khaki|tan|indigo|fuchsia|cyan|champagne|onyx|amber|crimson|cerulean|copper|pewter|blush|dusty|pastel|multi|multicolor|multicolour)/i;

/**
 * Normalize a Shopify variant title to a standard size label.
 * Returns null if the variant doesn't look like a size (e.g. it's a color).
 */
export function normalizeSize(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  // Direct map lookup
  if (SIZE_MAP[lower]) return SIZE_MAP[lower];

  // Numeric sizes (e.g. "36", "38", "40", "42") — keep as-is
  if (/^\d{1,3}$/.test(trimmed)) return trimmed;

  // If it looks like a color, skip it
  if (COLOR_NOISE.test(lower)) return null;

  // If it contains a known size token (e.g. "S/M", "L - Blue"), extract the size part
  for (const [key, val] of Object.entries(SIZE_MAP)) {
    if (lower.includes(key) && key.length >= 2) return val;
  }

  return null;
}
