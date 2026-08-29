export const SCRAPE_URLS: Record<string, string> = {
  vantaa: "https://www.tankille.fi/vantaa/",
  helsinki: "https://www.tankille.fi/helsinki/",
  espoo: "https://www.tankille.fi/espoo/",
};

export interface PriceRow {
  stationName: string;
  price: string;
  updatedText: string;
}

export interface SectionData {
  fuelType: string;
  rows: PriceRow[];
}

export const fuelTypeMapping: Record<string, string> = {
  "fuel-95": "95 E10",
  "fuel-98": "98 E5",
  "fuel-dsl": "Diesel",
};
