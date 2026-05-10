import { Item } from "../types";

// AJIO blocks headless browsers with Access Denied.
// Use their internal search JSON API instead.

interface AjioProduct {
  code: string;
  name: string;
  brandName: string;
  price: { value: number; currencyIso: string } | null;
  images: Array<{ url: string; format: string }>;
  url: string;
}

interface AjioSearchResponse {
  products?: AjioProduct[];
}

const SEARCH_QUERIES = [
  { q: "lehenga", gender: "female" },
  { q: "saree", gender: "female" },
  { q: "anarkali", gender: "female" },
  { q: "sherwani", gender: "male" },
  { q: "kurta+men", gender: "male" },
];

const BASE_URL = "https://www.ajio.com";
const API_BASE = `${BASE_URL}/api/search`;

export async function scrapeAjio(_query: string): Promise<Item[]> {
  const items: Item[] = [];
  const seen = new Set<string>();

  for (const { q, gender } of SEARCH_QUERIES) {
    if (items.length >= 10) break;

    try {
      const url = `${API_BASE}?query=${q}&pageNum=0&pageSize=10&fmt=json`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          Referer: `${BASE_URL}/women-ethnic-wear/c/830303`,
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        console.warn(`[ajio] API returned ${res.status} for "${q}"`);
        continue;
      }

      const data = (await res.json()) as AjioSearchResponse;
      if (!data.products?.length) continue;

      for (const p of data.products) {
        if (items.length >= 10) break;
        const productUrl = p.url
          ? p.url.startsWith("http") ? p.url : `${BASE_URL}${p.url}`
          : null;
        if (!productUrl || seen.has(productUrl)) continue;

        // Best image: prefer 1500w, then largest available
        const image =
          p.images?.find((i) => i.format === "1500Wx1500H") ??
          p.images?.find((i) => i.format === "product") ??
          p.images?.[0];

        if (!image?.url) continue;

        const imageUrl = image.url.startsWith("//")
          ? `https:${image.url}`
          : image.url;

        const title = p.brandName
          ? `${p.brandName} ${p.name}`
          : p.name;

        seen.add(productUrl);
        items.push({
          title,
          price: p.price?.value ?? null,
          image_url: imageUrl,
          product_url: productUrl,
          source: "ajio",
          gender: gender as "male" | "female",
          currency: p.price?.currencyIso ?? "INR",
        });
      }
    } catch (err) {
      console.warn(`[ajio] Failed for "${q}":`, (err as Error).message);
    }
  }

  console.log(`[ajio] Scraped ${items.length} products`);
  return items;
}
