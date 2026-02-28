import dotenv from "dotenv";
import { seedAdminData } from "../src/lib/admin-seed";
import { getDb, initDb } from "../src/lib/db";

dotenv.config({ path: ".env.local" });

await initDb();
const db = getDb();
await seedAdminData(db, { adminEmail: "seed@local" });
console.log("Seed data applied.");
