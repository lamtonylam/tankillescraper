export interface FuelPrice {
  fuelType: string;
  price: number;
  updatedText: string;
  currency: string;
}

export interface Station {
  name: string;
  prices: FuelPrice[];
}
