import "dotenv/config";
import { scrapeMyntra } from "./scrapers/myntra";
import { scrapeNykaa } from "./scrapers/nykaa";
import { scrapeManish } from "./scrapers/manish";
import { scrapeShopify } from "./scrapers/shopify";
import { scrapeJsonLd } from "./scrapers/jsonld";
import { scrapeAjio } from "./scrapers/ajio";
import { scrapeTataCliq } from "./scrapers/tatacliq";
import { scrapePerniasPopup } from "./scrapers/perniaspopup";
import { scrapeAzaFashions } from "./scrapers/azafashions";
import { scrapeKalkiFashion } from "./scrapers/kalkifashion";
import { scrapeFabindia } from "./scrapers/fabindia";
import { scrapeManyavar } from "./scrapers/manyavar";
import { supabase } from "./lib/supabase";
import { Item, ItemGender } from "./types";
import { extractMetadata } from "./lib/metadata";
import { SITE_REGISTRY, getShopifySites, getJsonLdSites } from "./scrapers/registry";
import { ShopifyConfig, JsonLdConfig, PuppeteerConfig } from "./lib/scraper-base";

// Kids signals — filter at ingest time so they never enter the database
const KIDS_PATTERNS = [
  /\bkids?\b/, /\bboys?\b/, /\bgirls?\b/,
  /\bbaby\b/, /\binfant\b/, /\btoddler\b/,
  /set\s+of\s+[3-9]/,   // 3+ piece ethnic sets are almost always kids
];
const KIDS_URL_SEGMENTS = ["/kids", "/boys", "/girls", "/baby", "/infant"];

function isKidsProduct(item: Pick<Item, "title" | "product_url">): boolean {
  const url = item.product_url.toLowerCase();
  const text = (item.title + " " + url).toLowerCase();
  if (KIDS_URL_SEGMENTS.some((s) => url.includes(s))) return true;
  if (KIDS_PATTERNS.some((p) => p.test(text))) return true;
  return false;
}

// Gender validation patterns — mirror of shauk-api/app/api/lib/classifier.ts
// SYNC: keep these patterns aligned with shauk-api/app/api/lib/classifier.ts
const GENDER_MALE_PATTERNS = [
  /\bmen\b/, /\bmens\b/, /\bmen's\b/, /\bsherwani\b/, /\bkurta\s+for\s+men\b/,
  /\bpathani\b/, /\bnehru\b/, /\bbandhgala\b/,
  /\bkurta\s+pajama\b/, /\bkurta\s+churidar\b/,
];
const GENDER_FEMALE_PATTERNS = [
  /\bwomen\b/, /\bwomens\b/, /\bwomen's\b/, /\bkurti\b/, /\blehenga\b/,
  /\bsaree\b/, /\bsari\b/, /\banarkali\b/, /\bsalwar\b/, /\bdupatta\b/,
  /\bstraight\s+kurta\b/, /\bpalazzo\b/, /\ba[\s-]line\b/, /\bpeplum\b/, /\bkurta\s+pant\b/,
  /\bkurta\s+set\b/, /\bsharara\b/, /\bgharara\b/,
  // SYNC: keep aligned with shauk-api/app/api/lib/classifier.ts
  /\bkurta\b/,
];
const GENDER_MALE_URL_SEGMENTS = ["/men/", "/men-", "-men/", "/menswear", "/mens/"];
const GENDER_FEMALE_URL_SEGMENTS = ["/women/", "/women-", "-women/", "/womenswear", "/womens/"];

function classifyForIngest(item: Pick<Item, "title" | "product_url">): "male" | "female" | "unknown" {
  const url = item.product_url.toLowerCase();
  const text = (item.title + " " + url).toLowerCase();
  if (GENDER_FEMALE_URL_SEGMENTS.some((s) => url.includes(s))) return "female";
  if (GENDER_MALE_URL_SEGMENTS.some((s) => url.includes(s))) return "male";
  if (GENDER_MALE_PATTERNS.some((p) => p.test(text))) return "male";
  if (GENDER_FEMALE_PATTERNS.some((p) => p.test(text))) return "female";
  return "unknown";
}

function validateGender(item: Pick<Item, "title" | "product_url">, intendedGender: ItemGender): ItemGender {
  const detected = classifyForIngest(item);
  if (detected !== "unknown" && detected !== intendedGender) {
    console.log(`[gender-override] "${item.title}" → tagged as ${detected} (overriding ${intendedGender})`);
    return detected as ItemGender;
  }
  return intendedGender;
}

// ── Puppeteer scraper dispatch ──────────────────────────────────────

const PUPPETEER_SCRAPERS: Record<string, (query: string) => Promise<Item[]>> = {
  myntra: scrapeMyntra,
  nykaa: scrapeNykaa,
  manish: () => scrapeManish(),
  ajio: scrapeAjio,
  tatacliq: scrapeTataCliq,
  perniaspopup: scrapePerniasPopup,
  azafashions: scrapeAzaFashions,
  kalkifashion: scrapeKalkiFashion,
  fabindia: scrapeFabindia,
  manyavar: scrapeManyavar,
};

// ── Enrichment pipeline ─────────────────────────────────────────────

function enrichItems(items: Item[], defaultGender?: ItemGender): Item[] {
  return items.map((item) => {
    const meta = extractMetadata(item.title);
    const gender = item.gender ?? defaultGender ?? "unisex";
    return {
      ...item,
      gender:         validateGender(item, gender as ItemGender),
      garment_type:   item.garment_type ?? meta.garmentType,
      color:          item.color        ?? meta.color,
      fabric:         item.fabric       ?? meta.fabric,
      embellishments: [
        ...(item.embellishments ?? []),
        ...meta.embellishments.filter(
          (e) => !(item.embellishments ?? []).includes(e)
        ),
      ],
      currency:       item.currency ?? meta.currency,
    };
  });
}

// ── Upsert to Supabase ──────────────────────────────────────────────

async function upsertItems(items: Item[]): Promise<void> {
  // Batch in chunks of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("products")
      .upsert(batch, { onConflict: "product_url" });

    if (error) {
      console.error(`Supabase upsert failed (batch ${i / BATCH_SIZE + 1}):`, error.message);
      throw error;
    }
  }
}

// ── Mode: Legacy query-based ingest (existing behavior) ─────────────

async function ingestByQuery(query: string, gender: ItemGender) {
  const searchQuery =
    gender === "male"
      ? `mens ${query}`
      : gender === "female"
      ? `womens ${query}`
      : query;

  console.log(`Scraping for: "${searchQuery}" (gender: ${gender})`);

  const results = await Promise.allSettled([
    scrapeMyntra(searchQuery),
    scrapeNykaa(searchQuery),
    scrapeManish(),
  ]);

  const labels = ["Myntra", "Nykaa", "Manish Malhotra"];
  const allItems: Item[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const tagged = enrichItems(result.value, gender);
      console.log(`${labels[i]}: ${tagged.length} products`);
      allItems.push(...tagged);
    } else {
      console.warn(
        `${labels[i]} failed:`,
        result.reason?.message ?? result.reason
      );
    }
  });

  return allItems;
}

// ── Mode: Registry-based ingest (new) ───────────────────────────────

async function ingestShopifySites(): Promise<Item[]> {
  const sites = getShopifySites();
  console.log(`\nScraping ${sites.length} Shopify sites...\n`);

  const allItems: Item[] = [];

  // Run Shopify sites in batches of 5 (no Puppeteer, just HTTP)
  const CONCURRENCY = 5;
  for (let i = 0; i < sites.length; i += CONCURRENCY) {
    const batch = sites.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((site) => scrapeShopify(site as ShopifyConfig))
    );

    results.forEach((result, j) => {
      const site = batch[j];
      if (result.status === "fulfilled") {
        const enriched = enrichItems(result.value, site.gender);
        console.log(`  ${site.name}: ${enriched.length} products`);
        allItems.push(...enriched);
      } else {
        console.warn(`  ${site.name}: FAILED — ${result.reason?.message ?? result.reason}`);
      }
    });
  }

  return allItems;
}

async function ingestJsonLdSites(): Promise<Item[]> {
  const sites = getJsonLdSites();
  console.log(`\nScraping ${sites.length} JSON-LD/Shopify sites...\n`);

  const allItems: Item[] = [];

  // Run in batches of 5 (plain HTTP, no browser)
  const CONCURRENCY = 5;
  for (let i = 0; i < sites.length; i += CONCURRENCY) {
    const batch = sites.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((site) => scrapeJsonLd(site as JsonLdConfig))
    );

    results.forEach((result, j) => {
      const site = batch[j];
      if (result.status === "fulfilled") {
        const enriched = enrichItems(result.value, site.gender);
        console.log(`  ${site.name}: ${enriched.length} products`);
        allItems.push(...enriched);
      } else {
        console.warn(`  ${site.name}: FAILED — ${result.reason?.message ?? result.reason}`);
      }
    });
  }

  return allItems;
}

async function ingestPuppeteerSite(config: PuppeteerConfig, query: string): Promise<Item[]> {
  const scraperFn = PUPPETEER_SCRAPERS[config.scraperId];
  if (!scraperFn) {
    console.warn(`[puppeteer] No scraper implemented for "${config.scraperId}" — skipping`);
    return [];
  }

  try {
    const items = await scraperFn(query);
    const enriched = enrichItems(items, config.gender);
    console.log(`  ${config.name}: ${enriched.length} products`);
    return enriched;
  } catch (err) {
    console.warn(`  ${config.name}: FAILED — ${(err as Error).message}`);
    return [];
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2];

  let allItems: Item[];

  if (mode === "shopify") {
    // Ingest Shopify sites + JSON-LD sites (both use plain HTTP, no browser)
    const [shopifyItems, jsonldItems] = await Promise.all([
      ingestShopifySites(),
      ingestJsonLdSites(),
    ]);
    allItems = [...shopifyItems, ...jsonldItems];

  } else if (mode === "puppeteer") {
    // Ingest only the Puppeteer registry sites (no browser for Shopify/JSON-LD)
    console.log("=== INGESTING PUPPETEER REGISTRY SITES ===\n");
    const puppeteerSites = SITE_REGISTRY.filter(
      (s): s is PuppeteerConfig => s.type === "puppeteer"
    );
    const puppeteerItems: Item[] = [];
    for (const site of puppeteerSites) {
      const items = await ingestPuppeteerSite(site, "ethnic wear");
      puppeteerItems.push(...items);
    }
    allItems = puppeteerItems;

  } else if (mode === "all") {
    // Ingest all sites from registry
    console.log("=== INGESTING ALL SITES ===\n");

    // Phase 1: Shopify + JSON-LD (fast, plain HTTP, run concurrently)
    const [shopifyItems, jsonldItems] = await Promise.all([
      ingestShopifySites(),
      ingestJsonLdSites(),
    ]);

    // Phase 2: Puppeteer marketplaces (need browser, run sequentially)
    console.log(`\nScraping Puppeteer marketplace sites...\n`);
    const puppeteerItems: Item[] = [];
    const puppeteerSites = SITE_REGISTRY.filter(
      (s): s is PuppeteerConfig => s.type === "puppeteer"
    );
    for (const site of puppeteerSites) {
      const items = await ingestPuppeteerSite(site, "ethnic wear");
      puppeteerItems.push(...items);
    }

    allItems = [...shopifyItems, ...jsonldItems, ...puppeteerItems];

  } else {
    // Legacy mode: query + gender
    const query = mode;
    const genderArg = process.argv[3];

    if (!query) {
      console.error("Usage:");
      console.error('  npm run ingest -- <query> <gender>     (legacy mode)');
      console.error('  npm run ingest -- shopify               (all Shopify + JSON-LD sites)');
      console.error('  npm run ingest -- puppeteer             (all Puppeteer registry sites)');
      console.error('  npm run ingest -- all                   (all registry sites)');
      process.exit(1);
    }

    if (!genderArg || !["male", "female", "unisex"].includes(genderArg)) {
      console.error('Gender is required: male | female | unisex');
      console.error('Example: npm run ingest -- "kurta" male');
      process.exit(1);
    }

    allItems = await ingestByQuery(query, genderArg as ItemGender);
  }

  // ── Post-processing pipeline ────────────────────────────────────

  // Hard-exclude kids products
  const adults = allItems.filter((item) => !isKidsProduct(item));
  const kidsCount = allItems.length - adults.length;
  if (kidsCount > 0) {
    console.log(`\nExcluded ${kidsCount} kids product(s).`);
  }

  if (adults.length === 0) {
    console.log("No products found from any source.");
    process.exit(0);
  }

  // Image URL dedup within same source (catches same-photo different-SKU variants)
  const imageDeduped = (() => {
    const seen = new Map<string, Item>();
    for (const item of adults) {
      if (!item.image_url) { seen.set(item.product_url, item); continue; }
      const rawKey = item.image_url.split("?")[0]
        .replace(/_([\d]+x[\d]*|x[\d]+|grande|large|medium|small|compact|master|thumb|icon|pico|nano)(?=\.\w{3,4}$)/i, "")
        .toLowerCase();
      const key = `${rawKey}||${item.source}`;
      const ex = seen.get(key);
      if (!ex) { seen.set(key, item); continue; }
      const scoreA = (ex.garment_type!=null?1:0)+(ex.color!=null?1:0)+(ex.fabric!=null?1:0);
      const scoreB = (item.garment_type!=null?1:0)+(item.color!=null?1:0)+(item.fabric!=null?1:0);
      if (scoreB > scoreA) seen.set(key, item);
    }
    return Array.from(seen.values());
  })();
  const imgDupCount = adults.length - imageDeduped.length;
  if (imgDupCount > 0) console.log(`Removed ${imgDupCount} image duplicate(s).`);

  // Deduplicate by product_url (safety net)
  const unique = new Map<string, Item>();
  for (const item of imageDeduped) {
    unique.set(item.product_url, item);
  }
  const items = Array.from(unique.values());
  const dupeCount = imageDeduped.length - items.length;
  if (dupeCount > 0) {
    console.log(`Removed ${dupeCount} duplicate(s).`);
  }

  console.log(`\nUpserting ${items.length} unique products to Supabase...`);
  await upsertItems(items);
  console.log(`Done. ${items.length} products inserted/updated.`);
}

main();
