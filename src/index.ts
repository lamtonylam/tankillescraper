import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import { server } from "./server";

export async function start(): Promise<void> {
  await server.start();

  const app = express();
  app.use(express.json());
  app.use("/graphql", expressMiddleware(server));

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  app.listen(PORT, () => {
    console.log(`App server running at http://localhost:${PORT}/graphql`);
  });
}

start();
