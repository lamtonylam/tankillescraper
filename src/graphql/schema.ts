import { gql } from "graphql-tag";

export const typeDefs = gql`
  type FuelPrice {
    fuelType: String!
    price: Float!
    updatedText: String!
    currency: String!
  }

  type Station {
    name: String!
    prices: [FuelPrice!]!
  }

  type Query {
    station(name: String!, city: String): Station
    stations(city: String): [Station!]!
  }
`;
