import "dotenv/config";
import { execSync } from "child_process";

/**
 * Seed script — runs ingestion across all sources.
 *
 * Phase 1: Shopify + JSON-LD sites via registry (fast HTTP, no browser)
 * Phase 2: Marketplace query pairs via Puppeteer (Myntra, Nykaa, Manish)
 * Phase 3: Remaining Puppeteer registry sites (Ajio, TataCliq, Pernia's, AZA, Kalki, Fabindia, Manyavar)
 */

// Catalog for Puppeteer marketplace scrapers (Myntra, Nykaa, Manish)
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
  { query: "kurta set", gender: "female" },
  { query: "anarkali", gender: "female" },
  { query: "lehenga", gender: "female" },
  { query: "saree", gender: "female" },
  { query: "salwar", gender: "female" },
  { query: "sharara", gender: "female" },
  { query: "gharara", gender: "female" },
  { query: "indo western", gender: "female" },
];

function run(cmd: string, label: string) {
  console.log(`\n▶ ${label}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
  } catch {
    console.warn(`  ⚠ Failed: ${label} — continuing\n`);
  }
}

async function main() {
  // ── Phase 1: Shopify + JSON-LD sites ─────────────────────────────
  console.log("=== SEED: PHASE 1 — Shopify + JSON-LD Sites ===\n");
  run("npm run ingest -- shopify", "All Shopify + JSON-LD sites");

  // ── Phase 2: Marketplace queries (Myntra, Nykaa, Manish) ─────────
  console.log("\n=== SEED: PHASE 2 — Marketplace Queries ===\n");
  console.log(`Running ${MARKETPLACE_CATALOG.length} query+gender combinations...\n`);

  for (const { query, gender } of MARKETPLACE_CATALOG) {
    run(`npm run ingest -- "${query}" ${gender}`, `${query} (${gender})`);
  }

  // ── Phase 3: Puppeteer registry sites ────────────────────────────
  // Runs: Ajio, TataCliq, Pernia's, AZA, Kalki, Fabindia, Manyavar
  console.log("\n=== SEED: PHASE 3 — Puppeteer Registry Sites ===\n");
  run("npm run ingest -- puppeteer", "All Puppeteer registry sites");

  console.log("\nSeed complete.");
}

main();
