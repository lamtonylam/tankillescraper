import { ApolloServer } from "@apollo/server";
import { typeDefs } from "./schema";
import { scrapePrices } from "../scraping/scrape";
import { Station, FuelPrice } from "../types/types";
import { SectionData, PriceRow } from "../scraping/selectors";

function parsePrice(row: PriceRow, fuelType: string): FuelPrice {
  const value = parseFloat(row.price);
  return {
    fuelType,
    price: isNaN(value) ? 0 : value,
    updatedText: row.updatedText,
    currency: "EUR",
  };
}

function buildStationMap(sections: SectionData[]): Map<string, FuelPrice[]> {
  const map = new Map<string, FuelPrice[]>();
  for (const section of sections) {
    for (const row of section.rows || []) {
      const price = parsePrice(row, section.fuelType);
      const existing = map.get(row.stationName) || [];
      existing.push(price);
      map.set(row.stationName, existing);
    }
  }
  return map;
}

export const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      station: async (
        _: unknown,
        args: { name: string; city?: string }
      ): Promise<Station | null> => {
        const sections = await scrapePrices(args.city);
        const stationMap = buildStationMap(sections);
        const prices = stationMap.get(args.name);
        if (!prices) return null;
        return { name: args.name, prices };
      },
      stations: async (_: unknown, args: { city?: string }): Promise<Station[]> => {
        const sections = await scrapePrices(args.city);
        const stationMap = buildStationMap(sections);
        const result: Station[] = [];
        for (const [name, prices] of stationMap) {
          result.push({ name, prices });
        }
        return result.sort((a, b) => a.name.localeCompare(b.name));
      },
    },
  },
});

