import "dotenv/config";
import { execSync } from "child_process";

/**
 * Seed script — runs ingestion across all sources.
 *
 * Phase 1: Shopify sites via registry (fast, no Puppeteer)
 * Phase 2: Legacy query+gender pairs via Puppeteer marketplace scrapers
 */

// Legacy catalog for Puppeteer-based marketplace scrapers (Myntra, Nykaa, Manish)
const MARKETPLACE_CATALOG: { query: string; gender: "male" | "female" | "unisex" }[] = [
  // Men's
  { query: "kurta", gender: "male" },
  { query: "sherwani", gender: "male" },
  { query: "indo western", gender: "male" },
  { query: "nehru jacket", gender: "male" },
  { query: "bandhgala", gender: "male" },
  { query: "pathani", gender: "male" },

  // Women's
  { query: "kurta", gender: "female" },
  { query: "anarkali", gender: "female" },
  { query: "lehenga", gender: "female" },
  { query: "saree", gender: "female" },
  { query: "salwar", gender: "female" },
  { query: "indo western", gender: "female" },
];

async function main() {
  console.log("=== SEED: PHASE 1 — Shopify Sites ===\n");

  try {
    execSync("npm run ingest -- shopify", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch {
    console.warn("⚠ Shopify ingest had errors — continuing\n");
  }

  console.log("\n=== SEED: PHASE 2 — Marketplace Queries ===\n");
  console.log(`Running ${MARKETPLACE_CATALOG.length} query+gender combinations...\n`);

  for (const { query, gender } of MARKETPLACE_CATALOG) {
    console.log(`▶ ${query} (${gender})`);
    try {
      execSync(`npm run ingest -- "${query}" ${gender}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } catch {
      console.warn(`  ⚠ Failed: ${query} (${gender}) — continuing\n`);
    }
    console.log();
  }

  console.log("Seed complete.");
}

main();
