import { ScraperConfig } from "../lib/scraper-base";

/**
 * Central registry of all scraper site configs.
 * This is the single source of truth for which sites to scrape and how.
 */
export const SITE_REGISTRY: ScraperConfig[] = [
  // ── Shopify Sites (~15) — /products.json, no Puppeteer ───────────

  {
    name: "sabyasachi",
    domain: "sabyasachi.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "manish_malhotra",
    domain: "manishmalhotra.in",
    type: "shopify",
  },
  {
    name: "house_of_masaba",
    domain: "houseofmasaba.com",
    type: "shopify",
  },
  {
    name: "ridhi_mehra",
    domain: "ridhimehra.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "aisha_rao",
    domain: "aisharao.com",
    type: "shopify",
    gender: "female",
  },
  // arpita_mehta: domain unreachable as of 2026-05 — removed until confirmed
  {
    name: "w_for_woman",
    domain: "wforwoman.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "torani",
    domain: "torani.in",
    type: "shopify",
    gender: "female",
  },
  {
    name: "suruchi_parakh",
    domain: "suruchiparakh.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "libas",
    domain: "libas.in",
    type: "shopify",
  },
  {
    name: "studio_bagechaa",
    domain: "studiobagechaa.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "devnaagri",
    domain: "devnaagri.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "mishru",
    domain: "mishru.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "payal_singhal",
    domain: "payalsinghal.com",
    type: "shopify",
    gender: "female",
  },
  {
    name: "falguni_shane_peacock",
    domain: "falgunishanepeacock.com",
    type: "shopify",
  },

  // ── Marketplace / Puppeteer Sites ────────────────────────────────

  {
    name: "myntra",
    domain: "myntra.com",
    type: "puppeteer",
    scraperId: "myntra",
  },
  {
    name: "nykaa",
    domain: "nykaafashion.com",
    type: "puppeteer",
    scraperId: "nykaa",
  },
  {
    name: "ajio",
    domain: "ajio.com",
    type: "puppeteer",
    scraperId: "ajio",
  },
  {
    name: "tatacliq",
    domain: "tatacliq.com",
    type: "puppeteer",
    scraperId: "tatacliq",
  },
  {
    name: "perniaspopupshop",
    domain: "perniaspopupshop.com",
    type: "puppeteer",
    scraperId: "perniaspopup",
  },
  {
    name: "azafashions",
    domain: "azafashions.com",
    type: "puppeteer",
    scraperId: "azafashions",
  },
  {
    name: "kalkifashion",
    domain: "kalkifashion.com",
    type: "puppeteer",
    scraperId: "kalkifashion",
  },
  {
    name: "fabindia",
    domain: "fabindia.com",
    type: "puppeteer",
    scraperId: "fabindia",
  },
  {
    name: "manyavar",
    domain: "manyavar.com",
    type: "puppeteer",
    scraperId: "manyavar",
    gender: "male",
  },

  // ── JSON-LD / Generic Scraper Sites ──────────────────────────────

  {
    name: "anita_dongre",
    domain: "anitadongre.com",
    type: "jsonld",
    collectionUrls: ["https://www.anitadongre.com/collections/all"],
  },
  {
    name: "raw_mango",
    domain: "rawmango.in",
    type: "jsonld",
    collectionUrls: ["https://www.rawmango.in/collections/all"],
  },
  {
    name: "ogaan",
    domain: "ogaan.com",
    type: "jsonld",
    collectionUrls: ["https://www.ogaan.com/collections/all"],
  },
  {
    name: "carma",
    domain: "carmaonlineshop.com",
    type: "jsonld",
    collectionUrls: ["https://www.carmaonlineshop.com/collections/all"],
  },
  {
    name: "aashni",
    domain: "aashniandco.com",
    type: "jsonld",
    collectionUrls: ["https://www.aashniandco.com/collections/all"],
  },
  {
    name: "ensemble",
    domain: "ensembleindia.com",
    type: "jsonld",
    collectionUrls: ["https://www.ensembleindia.com/collections/all"],
  },
  {
    name: "the_loom",
    domain: "theloom.in",
    type: "jsonld",
    collectionUrls: ["https://www.theloom.in/collections/all"],
  },
  {
    name: "tarun_tahiliani",
    domain: "taruntahiliani.com",
    type: "jsonld",
    collectionUrls: ["https://www.taruntahiliani.com/collections/all"],
    gender: "female",
  },
  {
    name: "anamika_khanna",
    domain: "anamikakhanna.in",
    type: "jsonld",
    collectionUrls: ["https://www.anamikakhanna.in/collections/all"],
    gender: "female",
  },
  {
    name: "gaurav_gupta",
    domain: "gauravgupta.com",
    type: "jsonld",
    collectionUrls: ["https://www.gauravgupta.com/collections/all"],
  },
  {
    name: "rohit_bal",
    domain: "rohitbal.com",
    type: "jsonld",
    collectionUrls: ["https://www.rohitbal.com/collections/all"],
  },
  {
    name: "ritu_kumar",
    domain: "ritukumar.com",
    type: "jsonld",
    collectionUrls: ["https://www.ritukumar.com/collections/all"],
    gender: "female",
  },
  {
    name: "punit_balana",
    domain: "punitbalana.in",
    type: "jsonld",
    collectionUrls: ["https://www.punitbalana.in/collections/all"],
    gender: "female",
  },
  {
    name: "jayanti_reddy",
    domain: "jayantireddy.com",
    type: "jsonld",
    collectionUrls: ["https://www.jayantireddy.com/collections/all"],
    gender: "female",
  },
  {
    name: "biba",
    domain: "biba.in",
    type: "jsonld",
    collectionUrls: ["https://www.biba.in/collections/all"],
    gender: "female",
  },
  {
    name: "global_desi",
    domain: "globaldesi.in",
    type: "jsonld",
    collectionUrls: ["https://www.globaldesi.in/collections/all"],
    gender: "female",
  },
  {
    name: "house_of_indya",
    domain: "houseofindya.com",
    type: "jsonld",
    collectionUrls: ["https://www.houseofindya.com/collections/all"],
    gender: "female",
  },
  {
    name: "aurelia",
    domain: "aureliaindia.com",
    type: "jsonld",
    collectionUrls: ["https://www.aureliaindia.com/collections/all"],
    gender: "female",
  },
  {
    name: "soch",
    domain: "soch.com",
    type: "jsonld",
    collectionUrls: ["https://www.soch.com/collections/all"],
    gender: "female",
  },
  {
    name: "saaksha_kinni",
    domain: "saakshakinni.com",
    type: "jsonld",
    collectionUrls: ["https://www.saakshakinni.com/collections/all"],
    gender: "female",
  },
  {
    name: "lovebirds",
    domain: "lovebirds.in",
    type: "jsonld",
    collectionUrls: ["https://www.lovebirds.in/collections/all"],
    gender: "female",
  },
  {
    name: "taali",
    domain: "taali.in",
    type: "jsonld",
    collectionUrls: ["https://www.taali.in/collections/all"],
    gender: "female",
  },
  {
    name: "ahi_clothing",
    domain: "ahiclothing.com",
    type: "jsonld",
    collectionUrls: ["https://www.ahiclothing.com/collections/all"],
  },
  {
    name: "utsav_fashion",
    domain: "utsavfashion.com",
    type: "jsonld",
    collectionUrls: ["https://www.utsavfashion.com/"],
  },
  {
    name: "cbazaar",
    domain: "cbazaar.com",
    type: "jsonld",
    collectionUrls: ["https://www.cbazaar.com/"],
  },
  {
    name: "mirraw",
    domain: "mirraw.com",
    type: "jsonld",
    collectionUrls: ["https://www.mirraw.com/"],
  },
  {
    name: "sareeka",
    domain: "sareeka.com",
    type: "jsonld",
    collectionUrls: ["https://www.sareeka.com/"],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

export function getShopifySites() {
  return SITE_REGISTRY.filter((s) => s.type === "shopify");
}

export function getPuppeteerSites() {
  return SITE_REGISTRY.filter((s) => s.type === "puppeteer");
}

export function getJsonLdSites() {
  return SITE_REGISTRY.filter((s) => s.type === "jsonld");
}
