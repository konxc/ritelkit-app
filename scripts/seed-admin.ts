import dotenv from "dotenv";
import { seedAdminData } from "../src/lib/admin-seed.ts";
import { getDb, initDb } from "../src/lib/db.ts";

dotenv.config({ path: ".env.local" });

await initDb();
const db = getDb();

// Email admin diambil dari environment variable (TEST_ADMIN_EMAIL)
// JANGAN hardcode email pribadi di sini untuk menghindari commit ke repo.
// Usage: TEST_ADMIN_EMAIL=your@email.com npm run seed
const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@example.local";

console.log(`--- Seeding Tenant Testing: Kopi Toktok ---`);

await seedAdminData(db, { 
  adminEmail: adminEmail, 
  tenantId: "kopi-toktok-id", // Mengikuti ID yang sudah ada di database lokal
  tenantSlug: "kopi-toktok",
  tenantName: "Kopi Toktok"
});

console.log(`\nSeed data applied successfully for tenant 'kopi-toktok'.`);
console.log(`Email Admin: ${adminEmail}`);
console.log(`Akses: http://kopi-toktok.ritelkit.local:4321`);
