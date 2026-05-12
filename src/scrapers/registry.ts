import { ScraperConfig } from "../lib/scraper-base";

/**
 * Central registry of all scraper site configs.
 * This is the single source of truth for which sites to scrape and how.
 *
 * Target: ~3 000 products, ~50 % female / ~50 % male (after dedup & kids filter).
 * Female sites are mostly Shopify/JSON-LD with high maxItems.
 * Male sites: Manyavar (Puppeteer) + Shopify menswear brands.
 */
export const SITE_REGISTRY: ScraperConfig[] = [

  // ── Female — Shopify ─────────────────────────────────────────────

  {
    name: "libas",
    domain: "libas.in",
    type: "shopify",
    gender: "female",
    maxItems: 400,
  },
  {
    name: "w_for_woman",
    domain: "wforwoman.com",
    type: "shopify",
    gender: "female",
    maxItems: 300,
  },
  {
    name: "house_of_masaba",
    domain: "houseofmasaba.com",
    type: "shopify",
    gender: "female",
    maxItems: 200,
  },
  {
    name: "sabyasachi",
    domain: "sabyasachi.com",
    type: "shopify",
    gender: "female",
    maxItems: 150,
  },
  {
    name: "anita_dongre",
    domain: "anitadongre.com",
    type: "shopify",
    gender: "female",
    maxItems: 150,
  },
  {
    name: "ridhi_mehra",
    domain: "ridhimehra.com",
    type: "shopify",
    gender: "female",
    maxItems: 100,
  },
  {
    name: "aisha_rao",
    domain: "aisharao.com",
    type: "shopify",
    gender: "female",
    maxItems: 100,
  },
  {
    name: "torani",
    domain: "torani.in",
    type: "shopify",
    gender: "female",
    maxItems: 150,
  },
  {
    name: "suruchi_parakh",
    domain: "suruchiparakh.com",
    type: "shopify",
    gender: "female",
    maxItems: 80,
  },
  {
    name: "studio_bagechaa",
    domain: "studiobagechaa.com",
    type: "shopify",
    gender: "female",
    maxItems: 80,
  },
  {
    name: "devnaagri",
    domain: "devnaagri.com",
    type: "shopify",
    gender: "female",
    maxItems: 100,
  },
  {
    name: "mishru",
    domain: "mishru.com",
    type: "shopify",
    gender: "female",
    maxItems: 80,
  },
  {
    name: "payal_singhal",
    domain: "payalsinghal.com",
    type: "shopify",
    gender: "female",
    maxItems: 100,
  },
  {
    name: "falguni_shane_peacock",
    domain: "falgunishanepeacock.com",
    type: "shopify",
    gender: "female",
    maxItems: 120,
  },
  {
    name: "manish_malhotra",
    domain: "manishmalhotra.in",
    type: "shopify",
    gender: "female",
    maxItems: 150,
  },

  // ── Male — Shopify ───────────────────────────────────────────────

  {
    name: "jade_blue",
    domain: "jadeblue.com",
    type: "shopify",
    gender: "male",
    collectionHandle: "sherwani",
    maxItems: 250,
  },
  {
    name: "sojanya",
    domain: "sojanya.com",
    type: "shopify",
    gender: "male",
    maxItems: 500,
  },
  {
    name: "vastramay",
    domain: "vastramay.com",
    type: "shopify",
    gender: "male",
    maxItems: 500,
  },
  {
    name: "shreeman",
    domain: "shreeman.in",
    type: "shopify",
    gender: "male",
    maxItems: 450,
  },
  // benzer: mixed male/female — no gender tag, let classifier decide
  {
    name: "benzer",
    domain: "benzerworld.com",
    type: "shopify",
    maxItems: 400,
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

  // ── Female — JSON-LD / Shopify fallback ──────────────────────────

  {
    name: "biba",
    domain: "biba.in",
    type: "jsonld",
    collectionUrls: ["https://www.biba.in/collections/all"],
    gender: "female",
    maxItems: 400,
  },
  {
    name: "global_desi",
    domain: "globaldesi.in",
    type: "jsonld",
    collectionUrls: ["https://www.globaldesi.in/collections/all"],
    gender: "female",
    maxItems: 300,
  },
  {
    name: "aurelia",
    domain: "aureliaindia.com",
    type: "jsonld",
    collectionUrls: ["https://www.aureliaindia.com/collections/all"],
    gender: "female",
    maxItems: 300,
  },
  {
    name: "soch",
    domain: "soch.com",
    type: "jsonld",
    collectionUrls: ["https://www.soch.com/collections/all"],
    gender: "female",
    maxItems: 300,
  },
  {
    name: "house_of_indya",
    domain: "houseofindya.com",
    type: "jsonld",
    collectionUrls: ["https://www.houseofindya.com/collections/all"],
    gender: "female",
    maxItems: 300,
  },
  {
    name: "utsav_fashion",
    domain: "utsavfashion.com",
    type: "jsonld",
    collectionUrls: ["https://www.utsavfashion.com/"],
    gender: "female",
    maxItems: 200,
  },
  {
    name: "cbazaar_women",
    domain: "cbazaar.com",
    type: "jsonld",
    collectionUrls: ["https://www.cbazaar.com/women"],
    gender: "female",
    maxItems: 200,
  },
  {
    name: "mirraw",
    domain: "mirraw.com",
    type: "jsonld",
    collectionUrls: ["https://www.mirraw.com/"],
    gender: "female",
    maxItems: 200,
  },
  {
    name: "raw_mango",
    domain: "rawmango.in",
    type: "jsonld",
    collectionUrls: ["https://www.rawmango.in/collections/all"],
    gender: "female",
    maxItems: 150,
  },
  {
    name: "ritu_kumar",
    domain: "ritukumar.com",
    type: "jsonld",
    collectionUrls: ["https://www.ritukumar.com/collections/all"],
    gender: "female",
    maxItems: 150,
  },
  {
    name: "tarun_tahiliani",
    domain: "taruntahiliani.com",
    type: "jsonld",
    collectionUrls: ["https://www.taruntahiliani.com/collections/all"],
    gender: "female",
    maxItems: 120,
  },
  {
    name: "anamika_khanna",
    domain: "anamikakhanna.in",
    type: "jsonld",
    collectionUrls: ["https://www.anamikakhanna.in/collections/all"],
    gender: "female",
    maxItems: 100,
  },
  {
    name: "punit_balana",
    domain: "punitbalana.in",
    type: "jsonld",
    collectionUrls: ["https://www.punitbalana.in/collections/all"],
    gender: "female",
    maxItems: 100,
  },
  {
    name: "jayanti_reddy",
    domain: "jayantireddy.com",
    type: "jsonld",
    collectionUrls: ["https://www.jayantireddy.com/collections/all"],
    gender: "female",
    maxItems: 100,
  },
  {
    name: "saaksha_kinni",
    domain: "saakshakinni.com",
    type: "jsonld",
    collectionUrls: ["https://www.saakshakinni.com/collections/all"],
    gender: "female",
    maxItems: 100,
  },
  {
    name: "lovebirds",
    domain: "lovebirds.in",
    type: "jsonld",
    collectionUrls: ["https://www.lovebirds.in/collections/all"],
    gender: "female",
    maxItems: 80,
  },
  {
    name: "taali",
    domain: "taali.in",
    type: "jsonld",
    collectionUrls: ["https://www.taali.in/collections/all"],
    gender: "female",
    maxItems: 80,
  },
  {
    name: "sareeka",
    domain: "sareeka.com",
    type: "jsonld",
    collectionUrls: ["https://www.sareeka.com/"],
    gender: "female",
    maxItems: 150,
  },

  // ── Ungendered — JSON-LD ─────────────────────────────────────────

  {
    name: "ogaan",
    domain: "ogaan.com",
    type: "jsonld",
    collectionUrls: ["https://www.ogaan.com/collections/all"],
    maxItems: 80,
  },
  {
    name: "carma",
    domain: "carmaonlineshop.com",
    type: "jsonld",
    collectionUrls: ["https://www.carmaonlineshop.com/collections/all"],
    maxItems: 80,
  },
  {
    name: "aashni",
    domain: "aashniandco.com",
    type: "jsonld",
    collectionUrls: ["https://www.aashniandco.com/collections/all"],
    maxItems: 80,
  },
  {
    name: "ensemble",
    domain: "ensembleindia.com",
    type: "jsonld",
    collectionUrls: ["https://www.ensembleindia.com/collections/all"],
    maxItems: 80,
  },
  {
    name: "the_loom",
    domain: "theloom.in",
    type: "jsonld",
    collectionUrls: ["https://www.theloom.in/collections/all"],
    maxItems: 80,
  },
  {
    name: "gaurav_gupta",
    domain: "gauravgupta.com",
    type: "jsonld",
    collectionUrls: ["https://www.gauravgupta.com/collections/all"],
    maxItems: 80,
  },
  {
    name: "rohit_bal",
    domain: "rohitbal.com",
    type: "jsonld",
    collectionUrls: ["https://www.rohitbal.com/collections/all"],
    maxItems: 80,
  },
  {
    name: "ahi_clothing",
    domain: "ahiclothing.com",
    type: "jsonld",
    collectionUrls: ["https://www.ahiclothing.com/collections/all"],
    maxItems: 80,
  },

  // ── Male — JSON-LD ───────────────────────────────────────────────

  {
    name: "cbazaar_men",
    domain: "cbazaar.com",
    type: "jsonld",
    collectionUrls: ["https://www.cbazaar.com/men"],
    gender: "male",
    maxItems: 200,
  },
  {
    name: "utsav_men",
    domain: "utsavfashion.com",
    type: "jsonld",
    collectionUrls: ["https://www.utsavfashion.com/mens-wear"],
    gender: "male",
    maxItems: 150,
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
