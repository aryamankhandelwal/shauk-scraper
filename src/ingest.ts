import "dotenv/config";
import { scrapeMyntra } from "./scrapers/myntra";
import { scrapeNykaa } from "./scrapers/nykaa";
import { scrapeManish } from "./scrapers/manish";
import { supabase } from "./lib/supabase";
import { Item, ItemGender } from "./types";

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

async function main() {
  const query = process.argv[2];
  const genderArg = process.argv[3];

  if (!query) {
    console.error("Usage: npm run ingest -- <query> <gender>");
    console.error('Example: npm run ingest -- "kurta" male');
    process.exit(1);
  }

  if (!genderArg || !["male", "female", "unisex"].includes(genderArg)) {
    console.error('Gender is required: male | female | unisex');
    console.error('Example: npm run ingest -- "kurta" male');
    process.exit(1);
  }

  const gender = genderArg as ItemGender;

  // Build a gender-prefixed search so the scrapers hit gendered category pages
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
      const tagged: Item[] = result.value.map((item) => ({ ...item, gender }));
      console.log(`${labels[i]}: ${tagged.length} products`);
      allItems.push(...tagged);
    } else {
      console.warn(
        `${labels[i]} failed:`,
        result.reason?.message ?? result.reason
      );
    }
  });

  // Hard-exclude kids products before they touch the database
  const adults = allItems.filter((item) => !isKidsProduct(item));
  const kidsCount = allItems.length - adults.length;
  if (kidsCount > 0) {
    console.log(`Excluded ${kidsCount} kids product(s).`);
  }

  if (adults.length === 0) {
    console.log("No products found from any source.");
    process.exit(0);
  }

  // Deduplicate by product_url
  const unique = new Map<string, Item>();
  for (const item of adults) {
    unique.set(item.product_url, item);
  }
  const items = Array.from(unique.values());

  console.log(`Upserting ${items.length} unique products to Supabase...`);

  const { error } = await supabase
    .from("products")
    .upsert(items, { onConflict: "product_url" });

  if (error) {
    console.error("Supabase upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`Done. ${items.length} products inserted/updated.`);
}

main();
