import "dotenv/config";
import { execSync } from "child_process";

/**
 * Catalog of all query+gender combinations to ingest.
 * Add a new entry here whenever you want to support a new garment type.
 */
const CATALOG: { query: string; gender: "male" | "female" | "unisex" }[] = [
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
  console.log(`Seeding ${CATALOG.length} query+gender combinations...\n`);

  for (const { query, gender } of CATALOG) {
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
