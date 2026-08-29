import * as cheerio from "cheerio";
import {
  SCRAPE_URLS,
  fuelTypeMapping,
  PriceRow,
  SectionData,
} from "./selectors";

export async function scrapePrices(city?: string): Promise<SectionData[]> {
  const normalizedCity = city ? city.toLowerCase() : undefined;
  const urls: string[] = normalizedCity && SCRAPE_URLS[normalizedCity] ? [SCRAPE_URLS[normalizedCity]] : Object.values(SCRAPE_URLS);

  const allSections: SectionData[] = [];
  for (const url of urls) {
    try {
      const sections = await fetchSections(url);
      allSections.push(...sections);
    } catch (e) {
      console.error("Scrape error for", url, e);
    }
  }
  return allSections;
}

async function fetchSections(url: string): Promise<SectionData[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
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
