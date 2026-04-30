import "dotenv/config";
import { scrapeMyntra } from "./scrapers/myntra";
import { scrapeNykaa } from "./scrapers/nykaa";
import { scrapeManish } from "./scrapers/manish";
import { supabase } from "./lib/supabase";
import { Item } from "./types";

async function main() {
  const query = process.argv[2];
  if (!query) {
    console.error("Usage: npm run ingest -- <query>");
    console.error('Example: npm run ingest -- "lehenga"');
    process.exit(1);
  }

  console.log(`Scraping for: "${query}"`);

  const results = await Promise.allSettled([
    scrapeMyntra(query),
    scrapeNykaa(query),
    scrapeManish(),
  ]);

  const labels = ["Myntra", "Nykaa", "Manish Malhotra"];
  const allItems: Item[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`${labels[i]}: ${result.value.length} products`);
      allItems.push(...result.value);
    } else {
      console.warn(`${labels[i]} failed:`, result.reason?.message ?? result.reason);
    }
  });

  if (allItems.length === 0) {
    console.log("No products found from any source.");
    process.exit(0);
  }

  // Deduplicate by product_url
  const unique = new Map<string, Item>();
  for (const item of allItems) {
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
