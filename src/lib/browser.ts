import puppeteer, { Browser, Page } from "puppeteer";

export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });
}

export async function createStealthPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.setUserAgent(
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9" });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
  return page;
}

/** Parse price text like "Rs. 1,25,000" or "₹3,999" into a number, or null */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

/** Pick highest-resolution URL from a srcset string, or return fallback */
export function bestImageUrl(srcset: string | null, fallback: string): string {
  if (!srcset) return fallback;
  let best = fallback;
  let bestWidth = 0;
  for (const entry of srcset.split(",")) {
    const parts = entry.trim().split(/\s+/);
    if (parts.length >= 2) {
      const w = parseInt(parts[1].replace("w", ""), 10);
      if (w > bestWidth) {
        bestWidth = w;
        best = parts[0];
      }
    }
  }
  return best || fallback;
}

/** Returns true if the image URL looks like a logo/icon/sprite */
export function isJunkImage(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("logo") ||
    lower.includes("icon") ||
    lower.includes("sprite")
  );
}
