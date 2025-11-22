import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/socially?schema=public';

if (!process.env.DATABASE_URL) {
  console.warn('roy: DATABASE_URL not set, using default connection string');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const db = prisma;
export default prisma;

