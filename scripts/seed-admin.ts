import dotenv from "dotenv";
import { initDb, getDb } from "../src/lib/db.ts";
import { seedAdminData } from "../src/lib/admin-seed.ts";

dotenv.config({ path: ".env.local" });

await initDb();
const db = getDb();
await seedAdminData(db, { adminEmail: "seed@local" });
console.log("Seed data applied.");
