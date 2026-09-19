import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

  // O driver do Neon fala o protocolo deles via WebSocket - so funciona
  // contra a infra real do Neon (producao, preview, dev), nunca contra um
  // Postgres comum (ex.: o container do CI/e2e). Cai pro driver padrao
  // nesses outros casos, sem precisar de nenhuma env var extra pra isso.
  if (connectionString?.includes(".neon.tech")) {
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
