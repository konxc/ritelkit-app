import dotenv from "dotenv";
import { seedAdminData } from "../src/lib/admin-seed.ts";
import { getDb, initDb } from "../src/lib/db.ts";

dotenv.config({ path: ".env.local" });

await initDb();
const db = getDb();
await seedAdminData(db, { adminEmail: "seed@local" });
console.log("Seed data applied.");
