import dotenv from "dotenv";
import { seedAdminData } from "../src/lib/admin-seed.ts";
import { getDb, initDb } from "../src/lib/db.ts";

dotenv.config({ path: ".env.local" });

await initDb();
const db = getDb();

// Seed Tenant 1: RitelKit App (Default)
console.log("Seeding RitelKit App...");
await seedAdminData(db, { 
  adminEmail: "androxoss@hotmail.com",
  tenantId: "ritelkit-app-id",
  tenantSlug: "ritelkit-app",
  tenantName: "RitelKit App"
});

// Seed Tenant 2: Kopi Toktok
console.log("Seeding Kopi Toktok...");
await seedAdminData(db, { 
  adminEmail: "androxoss@hotmail.com",
  tenantId: "kopi-toktok-id",
  tenantSlug: "kopi-toktok",
  tenantName: "Kopi Toktok"
});

console.log("Seed data applied successfully for all tenants.");
