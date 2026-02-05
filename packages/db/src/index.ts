import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Load .env from multiple possible locations
config(); // Try current working directory first
config({ path: new URL("../../.env", import.meta.url).pathname });

const connectionString = process.env.DATABASE_URL || "";
console.log("DATABASE_URL loaded:", connectionString ? "Yes" : "No");

const adapter = new PrismaPg({ connectionString });
export * from "./generated/prisma/client";
export const prismaClient = new PrismaClient({ adapter });

// Test connection on startup
prismaClient.$connect()
    .then(() => console.log("✅ Database connected successfully"))
    .catch((err: Error) => console.error("❌ Database connection failed:", err.message));
