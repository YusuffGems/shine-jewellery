/* Phase 2 — Prisma client singleton.
   Excluded from the mock build (see tsconfig "exclude"). After
   `npm i @prisma/client && npm i -D prisma`, remove it from the exclude list. */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
