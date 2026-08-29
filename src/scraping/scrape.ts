import * as cheerio from "cheerio";
import UserAgent from "user-agents";
import NodeCache from "node-cache";
import {
  SCRAPE_URLS,
  fuelTypeMapping,
  PriceRow,
  SectionData,
} from "./selectors";

function randomUA(): string {
  return new UserAgent().toString();
}

function randomDelay(min = 300, max = 1200): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
}

function buildHeaders(): Record<string, string> {
  const ua = randomUA();
  return {
    "User-Agent": ua,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-User": "?1",
  };
}

const cache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 60 });

function getCacheKey(city?: string): string {
  return city ? city.toLowerCase() : "all";
}

export async function scrapePrices(city?: string): Promise<SectionData[]> {
  const key = getCacheKey(city);
  const cached = cache.get<SectionData[]>(key);
  if (cached) {
    return cached;
  }

  const normalizedCity = city ? city.toLowerCase() : undefined;
  const urls: string[] = normalizedCity && SCRAPE_URLS[normalizedCity] ? [SCRAPE_URLS[normalizedCity]] : Object.values(SCRAPE_URLS);

  const allSections: SectionData[] = [];
  for (const url of urls) {
    await randomDelay(200, 900);
    try {
      const sections = await fetchSections(url);
      allSections.push(...sections);
    } catch (e) {
      console.error("Scrape error for", url, e);
    }
  }
  cache.set(key, allSections);
  return allSections;
}

export async function fetchSections(url: string): Promise<SectionData[]> {
  try {
    const res = await fetch(url, { headers: buildHeaders(), signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error("Fetch failed:", res.status);
      return [];
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    const sections: SectionData[] = [];
    for (const [id, fuelType] of Object.entries(fuelTypeMapping)) {
      const sectionEl = $(`#${id}`);
      if (sectionEl.length === 0) continue;

      const rows: PriceRow[] = [];
      sectionEl.find("table tbody tr").each((_, rowEl) => {
        const tds = $(rowEl).find("td");
        if (tds.length < 4) return;

        const stationName = $(tds.eq(1)).text().trim();
        const priceText = $(tds.eq(2)).text().trim();
        const updatedText = $(tds.eq(3)).text().trim();

        if (
          stationName.includes("espoo") ||
          stationName.includes("helsinki") ||
          stationName.includes("/")
        ) {
          return;
        }

        rows.push({ stationName, price: priceText, updatedText });
        if (rows.length >= 10) return false;
      });

      sections.push({ fuelType, rows });
    }

    return sections;
  } catch (e) {
    console.error("Scrape error:", e);
    return [];
  }
}
