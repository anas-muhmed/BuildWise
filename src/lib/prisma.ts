import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless'; // or appropriate driver

// For SQLite, you don't actually need an adapter for regular Next.js
// Driver adapters are mainly for databases that need special edge handling

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;