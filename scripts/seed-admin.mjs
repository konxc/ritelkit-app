import dotenv from "dotenv";
import { initDb, getDb } from "../src/lib/db";
import { seedAdminData } from "../src/lib/admin-seed";

dotenv.config({ path: ".env.local" });

await initDb();
const db = getDb();
await seedAdminData(db, { adminEmail: "seed@local" });
console.log("Seed data applied.");
