import type { APIContext } from "astro";
import { seedAdminData } from "../../../lib/admin-seed";
import { requireAdmin, verifyCsrf } from "../../../lib/auth";
import { getDb, initDb } from "../../../lib/db";

export const POST = async (context: APIContext) => {
  const admin = await requireAdmin(context);
  if (!admin) return new Response("Unauthorized", { status: 401 });

  if (!verifyCsrf(context)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }

  try {
    await initDb();
    const db = getDb();

    // Use the consolidated seeding logic from @lib/admin-seed
    await seedAdminData(db, {
      adminEmail: String(admin.email),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database seeded successfully with enriched data.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Seed error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
