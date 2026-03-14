import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@db/schema";
import { adsCampaigns, orders, products, refunds } from "@db/schema";

type Db = LibSQLDatabase<typeof schema>;

export async function getDashboardStats(db: Db) {
  const today = new Date().toISOString().split("T")[0];

  const ordersToday = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(sql`date(${orders.createdAt}) = ${today}`)
    .get();

  const revenueToday = await db
    .select({ total: sql<number>`sum(${orders.total})` })
    .from(orders)
    .where(sql`date(${orders.createdAt}) = ${today}`)
    .get();

  const activeCoupons = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.coupons)
    .where(eq(schema.coupons.isActive, 1))
    .get();

  const activeProducts = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, 1))
    .get();

  const pendingShipments = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.shipments)
    .where(or(eq(schema.shipments.status, "packing"), eq(schema.shipments.status, "shipped")))
    .get();

  const pendingRefunds = await db
    .select({ count: sql<number>`count(*)` })
    .from(refunds)
    .where(eq(refunds.status, "requested"))
    .get();

  return {
    ordersToday: Number(ordersToday?.count || 0),
    revenueToday: Number(revenueToday?.total || 0),
    activeCoupons: Number(activeCoupons?.count || 0),
    activeProducts: Number(activeProducts?.count || 0),
    pendingShipments: Number(pendingShipments?.count || 0),
    pendingRefunds: Number(pendingRefunds?.count || 0),
  };
}

export async function getRecentOrders(db: Db, limit = 5) {
  return await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function getReportData(db: Db) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

  // Orders last 30 days
  const ordersRes = await db.select().from(orders).where(gte(orders.createdAt, thirtyDaysAgoStr));

  // Orders last 90 days
  const orders90Res = await db
    .select({
      customerPhone: orders.customerPhone,
      total: orders.total,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(gte(orders.createdAt, ninetyDaysAgoStr));

  // Refunds approved last 30 days
  const refundsRes = await db
    .select({ amount: refunds.amount })
    .from(refunds)
    .where(and(eq(refunds.status, "approved"), gte(refunds.createdAt, thirtyDaysAgoStr)));

  // Products for cost calculation
  const productsRes = await db.select({ id: products.id, cost: products.cost, name: products.name }).from(products);

  const productCost: Record<string, { cost: number; name: string }> = {};
  for (const row of productsRes) {
    productCost[row.id] = {
      cost: Number(row.cost || 0),
      name: row.name,
    };
  }

  let totalOrders = 0;
  let paidOrders = 0;
  let revenue = 0;
  let discountTotal = 0;
  let cogs = 0;
  const productQty: Record<string, number> = {};

  for (const order of ordersRes) {
    totalOrders += 1;
    revenue += Number(order.total || 0);
    discountTotal += Number(order.discountTotal || 0);
    if (order.paymentStatus === "paid") paidOrders += 1;

    try {
      const items = JSON.parse(order.itemsJson || "[]");
      if (Array.isArray(items)) {
        for (const item of items) {
          const pid = String(item.product_id || "");
          const qty = Number(item.qty || 0);
          const cost = productCost[pid]?.cost || 0;
          cogs += cost * qty;
          productQty[pid] = (productQty[pid] || 0) + qty;
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  const refundTotal = refundsRes.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
  const grossProfit = revenue - cogs - refundTotal;

  // LTV (90 days)
  const paidOrders90 = orders90Res.filter((row: any) => row.paymentStatus === "paid");
  const uniqueCustomers = new Set(paidOrders90.map((row: any) => row.customerPhone));
  const revenue90 = paidOrders90.reduce((sum: number, row: any) => sum + Number(row.total || 0), 0);
  const ltv = uniqueCustomers.size ? Math.round(revenue90 / uniqueCustomers.size) : 0;

  // Cohort
  const cohortMap: Record<string, Set<string>> = {};
  for (const row of ordersRes) {
    const phone = row.customerPhone;
    const month = row.createdAt.slice(0, 7);
    if (!cohortMap[month]) cohortMap[month] = new Set();
    cohortMap[month].add(phone);
  }
  const cohorts = Object.entries(cohortMap)
    .map(([month, set]) => ({ month, count: set.size }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  // ROAS
  const adsRes = await db
    .select({ spend: adsCampaigns.spend })
    .from(adsCampaigns)
    .where(or(eq(adsCampaigns.status, "active"), eq(adsCampaigns.status, "completed")));

  const totalSpend = adsRes.reduce((sum: number, row: any) => sum + Number(row.spend || 0), 0);
  const roas = totalSpend > 0 ? (revenue / totalSpend).toFixed(2) : "-";

  const topProducts = Object.entries(productQty)
    .map(([id, qty]) => ({
      id,
      qty,
      name: productCost[id]?.name || id,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return {
    thirtyDays: {
      totalOrders,
      paidOrders,
      revenue,
      discountTotal,
      cogs,
      refundTotal,
      grossProfit,
    },
    topProducts,
    analytics: {
      ltv,
      roas,
      cohorts,
    },
  };
}
