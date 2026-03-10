import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import type { APIContext } from "astro";
import { asc, desc, eq, like, or, sql } from "drizzle-orm";
import {
  adminUsers,
  auditLogs,
  categories,
  cmsPages,
  customers,
  inventoryMovements,
  invoices,
  notifications,
  orders,
  products,
  refunds,
  settings,
  shipments,
  shippingRules,
} from "../db/schema";
import { logAudit } from "../lib/admin";
import {
  createSession,
  destroySession,
  getAdminSession,
  getClientIp,
  normalizeEmail,
  requireAdmin,
  sanitizeText,
  verifyCsrf,
  verifyPassword,
} from "../lib/auth";
import { calculateShipping } from "../lib/checkout";
import { getDb, getDrizzle, initDb } from "../lib/db";
import { checkRateLimit } from "../lib/rate-limit";
import {
  CategorySchema,
  CustomerSchema,
  DeliverySettingsSchema,
  InventoryMovementSchema,
  InvoiceSchema,
  OrderSettingsSchema,
  ProductSchema,
  RefundSchema,
  ShipmentSchema,
  ShippingRuleSchema,
} from "../lib/types";

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export const server = {
  checkOrderStatus: defineAction({
    input: z.object({
      orderNo: z.string().regex(/^RS-\d{10,}$/, "Invalid order number format"),
      phone: z.string().min(9).max(15, "Invalid phone number format"),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      await initDb(apiCtx);
      const ip = getClientIp(apiCtx);
      const limit = await checkRateLimit(apiCtx, `order-status:${ip}`, 30, 60);

      if (!limit.ok) {
        throw new Error("Too many requests. Try again later.");
      }

      const normalizedPhone = normalizePhone(input.phone);
      const db = getDb(apiCtx);

      const result = await db.execute({
        sql: "SELECT status, payment_status, customer_phone FROM orders WHERE order_no = ?",
        args: [input.orderNo],
      });

      const row = result.rows[0] as { status?: string; payment_status?: string; customer_phone?: string } | undefined;

      if (!row) {
        throw new Error("Order not found");
      }

      const samePhone = normalizePhone(String(row.customer_phone || "")) === normalizedPhone;

      if (!samePhone) {
        throw new Error("Order not found");
      }

      return {
        status: row.status ?? "unknown",
        paymentStatus: row.payment_status ?? "unpaid",
      };
    },
  }),

  adminLogin: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email("Invalid email format"),
      password: z.string().min(1, "Password is required"),
      csrf_token: z.string().optional(),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      await initDb(apiCtx);

      // CSRF check
      if (!verifyCsrf(apiCtx, input)) {
        throw new Error("Invalid CSRF token");
      }

      const email = normalizeEmail(input.email);
      const password = sanitizeText(input.password);
      const db = getDb(apiCtx);
      const ip = getClientIp(apiCtx);
      const nowSec = Math.floor(Date.now() / 1000);

      // Rate limit check
      const limitWindow = nowSec - 10 * 60;
      const attemptRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM login_attempts WHERE ip = ? AND created_at >= ?",
        args: [ip, limitWindow],
      });
      const attempts = Number(attemptRes.rows[0]?.count || 0);
      if (attempts >= 5) {
        throw new Error("Too many attempts, try again later");
      }

      const result = await db.execute({
        sql: "SELECT password_hash FROM admin_users WHERE email = ?",
        args: [email],
      });
      const row = result.rows[0] as { password_hash?: string } | undefined;

      if (!row?.password_hash) {
        await db.execute({
          sql: "INSERT INTO login_attempts (id, ip, created_at) VALUES (?, ?, ?)",
          args: [crypto.randomUUID(), ip, nowSec],
        });
        throw new Error("Invalid email or password");
      }

      const valid = await verifyPassword(password, row.password_hash);
      if (!valid) {
        await db.execute({
          sql: "INSERT INTO login_attempts (id, ip, created_at) VALUES (?, ?, ?)",
          args: [crypto.randomUUID(), ip, nowSec],
        });
        throw new Error("Invalid email or password");
      }

      // Clean attempts on success? (Optional, here we just insert another success log if wanted, but original logic just inserts an attempt)
      await db.execute({
        sql: "INSERT INTO login_attempts (id, ip, created_at) VALUES (?, ?, ?)",
        args: [crypto.randomUUID(), ip, nowSec],
      });

      await createSession(apiCtx, email);
      return { success: true };
    },
  }),

  adminLogout: defineAction({
    accept: "form",
    handler: async (_, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      destroySession(apiCtx);
      return { success: true };
    },
  }),

  // Product Actions
  listProducts: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;

      const where = q ? or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`)) : undefined;

      const rows = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          slug: products.slug,
          description: products.description,
          categoryId: products.categoryId,
          categoryName: categories.name,
          price: products.price,
          cost: products.cost,
          stock: products.stock,
          isActive: products.isActive,
          imagesJson: products.imagesJson,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(products.createdAt));

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  createProduct: defineAction({
    input: ProductSchema.omit({ id: true, createdAt: true, updatedAt: true }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      const id = crypto.randomUUID();
      await db.insert(products).values({
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(apiCtx, "create_product", "product", id, { name: input.name, sku: input.sku });

      return { success: true, id };
    },
  }),

  updateProduct: defineAction({
    input: z.object({
      id: z.string(),
      data: ProductSchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      await db
        .update(products)
        .set({ ...input.data, updatedAt: now })
        .where(eq(products.id, input.id));

      await logAudit(apiCtx, "update_product", "product", input.id, input.data);

      return { success: true };
    },
  }),

  deleteProduct: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      await db.delete(products).where(eq(products.id, id));

      await logAudit(apiCtx, "delete_product", "product", id);

      return { success: true };
    },
  }),

  // Category Actions
  listCategories: defineAction({
    handler: async (_, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));

      return rows;
    },
  }),

  createCategory: defineAction({
    input: CategorySchema.omit({ id: true, createdAt: true, updatedAt: true }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      const id = crypto.randomUUID();
      await db.insert(categories).values({
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(apiCtx, "create_category", "category", id, { name: input.name });

      return { success: true };
    },
  }),

  updateCategory: defineAction({
    input: z.object({
      id: z.string(),
      data: CategorySchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      await db
        .update(categories)
        .set({ ...input.data, updatedAt: now })
        .where(eq(categories.id, input.id));

      await logAudit(apiCtx, "update_category", "category", input.id, input.data);

      return { success: true };
    },
  }),

  deleteCategory: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      await db.delete(categories).where(eq(categories.id, id));

      await logAudit(apiCtx, "delete_category", "category", id);

      return { success: true };
    },
  }),

  // Inventory Actions
  listInventoryMovements: defineAction({
    handler: async (_, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      const rows = await db
        .select({
          id: inventoryMovements.id,
          productId: inventoryMovements.productId,
          type: inventoryMovements.type,
          qty: inventoryMovements.qty,
          notes: inventoryMovements.notes,
          refOrderNo: inventoryMovements.refOrderNo,
          createdAt: inventoryMovements.createdAt,
          productName: products.name,
        })
        .from(inventoryMovements)
        .leftJoin(products, eq(inventoryMovements.productId, products.id))
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(30);

      return rows;
    },
  }),

  listInventoryProducts: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;

      const where = q ? or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`)) : undefined;

      const rows = await db
        .select({
          id: products.id,
          sku: products.sku,
          name: products.name,
          price: products.price,
          stock: products.stock,
        })
        .from(products)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(products.createdAt));

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  createInventoryMovement: defineAction({
    input: InventoryMovementSchema.omit({
      id: true,
      createdAt: true,
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        const id = crypto.randomUUID();

        let orderId = input.orderId;
        if (!orderId && input.refOrderNo) {
          const order = await tx.select().from(orders).where(eq(orders.orderNo, input.refOrderNo)).get();
          if (order) orderId = order.id;
        }

        // 1. Insert movement record
        await tx.insert(inventoryMovements).values({
          id,
          productId: input.productId,
          type: input.type,
          qty: input.qty,
          notes: input.notes,
          orderId: orderId ?? null,
          refOrderNo: input.refOrderNo,
          createdAt: now,
        });

        // 2. Update product stock
        const product = await tx
          .select({
            id: products.id,
            stock: products.stock,
          })
          .from(products)
          .where(eq(products.id, input.productId))
          .get();

        if (!product) {
          tx.rollback();
          throw new Error("Product not found");
        }

        let newStock = product.stock || 0;
        if (input.type === "in") newStock += input.qty;
        else if (input.type === "out") newStock -= input.qty;
        else if (input.type === "adjustment") newStock = input.qty;

        await tx.update(products).set({ stock: newStock, updatedAt: now }).where(eq(products.id, input.productId));
      });

      await logAudit(apiCtx, "create_inventory_movement", "inventory_movement", input.productId, {
        type: input.type,
        qty: input.qty,
        notes: input.notes,
      });

      return { success: true };
    },
  }),

  // --- INVOICES ---
  listInvoices: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;

      const where = q ? or(like(invoices.invoiceNo, `%${q}%`), like(orders.orderNo, `%${q}%`)) : undefined;

      const rows = await db
        .select({
          id: invoices.id,
          invoiceNo: invoices.invoiceNo,
          status: invoices.status,
          issuedAt: invoices.issuedAt,
          dueAt: invoices.dueAt,
          orderNo: orders.orderNo,
          total: orders.total,
        })
        .from(invoices)
        .innerJoin(orders, eq(orders.id, invoices.orderId))
        .where(where)
        .orderBy(desc(invoices.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .innerJoin(orders, eq(orders.id, invoices.orderId))
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  createInvoice: defineAction({
    input: z.object({
      orderNo: z.string(),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      const order = await db.select().from(orders).where(eq(orders.orderNo, input.orderNo)).get();

      if (!order) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const invoiceNo = `INV-${Date.now()}`;
      const id = crypto.randomUUID();

      await db.insert(invoices).values({
        id,
        orderId: order.id,
        invoiceNo,
        status: "issued",
        issuedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(apiCtx, "create_invoice", "invoice", id, {
        orderNo: input.orderNo,
        invoiceNo,
      });

      return { success: true, invoiceNo };
    },
  }),

  updateInvoice: defineAction({
    input: z.object({
      id: z.string(),
      data: InvoiceSchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      await db
        .update(invoices)
        .set({
          ...input.data,
          updatedAt: now,
        })
        .where(eq(invoices.id, input.id));

      await logAudit(apiCtx, "update_invoice", "invoice", input.id, input.data);

      return { success: true };
    },
  }),

  // --- SHIPMENTS ---
  listShipments: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;

      const where = q ? or(like(shipments.orderNo, `%${q}%`), like(shipments.trackingNo, `%${q}%`)) : undefined;

      const rows = await db
        .select()
        .from(shipments)
        .where(where)
        .orderBy(desc(shipments.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(shipments)
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  createShipment: defineAction({
    input: ShipmentSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }).extend({
      orderId: z.string().uuid().optional(),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      let orderId = input.orderId;
      if (!orderId) {
        const order = await db.select().from(orders).where(eq(orders.orderNo, input.orderNo)).get();
        if (!order) throw new Error("Order not found");
        orderId = order.id;
      }

      const id = crypto.randomUUID();
      await db.insert(shipments).values({
        id,
        ...input,
        orderId: orderId!,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(apiCtx, "create_shipment", "shipment", id, input);

      return { success: true, id };
    },
  }),

  updateShipment: defineAction({
    input: z.object({
      id: z.string(),
      data: ShipmentSchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      await db
        .update(shipments)
        .set({ ...input.data, updatedAt: now })
        .where(eq(shipments.id, input.id));

      await logAudit(apiCtx, "update_shipment", "shipment", input.id, input.data);

      return { success: true };
    },
  }),

  deleteShipment: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      await db.delete(shipments).where(eq(shipments.id, id));
      await logAudit(apiCtx, "delete_shipment", "shipment", id);

      return { success: true };
    },
  }),

  // --- SHIPPING RULES ---
  listShippingRules: defineAction({
    handler: async (_, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      return await db.select().from(shippingRules).orderBy(desc(shippingRules.priority));
    },
  }),

  createShippingRule: defineAction({
    input: ShippingRuleSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.insert(shippingRules).values({
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(apiCtx, "create_shipping_rule", "shipping_rule", id, input);

      return { success: true, id };
    },
  }),

  updateShippingRule: defineAction({
    input: z.object({
      id: z.string(),
      data: ShippingRuleSchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      await db
        .update(shippingRules)
        .set({ ...input.data, updatedAt: now })
        .where(eq(shippingRules.id, input.id));

      await logAudit(apiCtx, "update_shipping_rule", "shipping_rule", input.id, input.data);

      return { success: true };
    },
  }),

  deleteShippingRule: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      await db.delete(shippingRules).where(eq(shippingRules.id, id));
      await logAudit(apiCtx, "delete_shipping_rule", "shipping_rule", id);

      return { success: true };
    },
  }),

  simulateShipping: defineAction({
    input: z.object({
      subtotal: z.number(),
      province: z.string(),
      city: z.string(),
      district: z.string().optional(),
      freeShipping: z.boolean().default(false),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const result = await calculateShipping(
        apiCtx,
        input.subtotal,
        {
          province: input.province,
          city: input.city,
          district: input.district,
        },
        input.freeShipping,
      );
      return result;
    },
  }),

  // --- REFUNDS ---
  listRefunds: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;

      const where = q ? or(like(refunds.orderNo, `%${q}%`), like(refunds.reason, `%${q}%`)) : undefined;

      const rows = await db
        .select()
        .from(refunds)
        .where(where)
        .orderBy(desc(refunds.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(refunds)
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  createRefund: defineAction({
    input: RefundSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }).extend({
      orderId: z.string().uuid().optional(),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      let orderId = input.orderId;
      if (!orderId) {
        const order = await db.select().from(orders).where(eq(orders.orderNo, input.orderNo)).get();
        if (!order) throw new Error("Order not found");
        orderId = order.id;
      }

      const id = crypto.randomUUID();
      await db.insert(refunds).values({
        id,
        ...input,
        orderId: orderId!,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(apiCtx, "create_refund", "refund", id, input);

      return { success: true, id };
    },
  }),

  updateRefund: defineAction({
    input: z.object({
      id: z.string(),
      data: RefundSchema.partial().omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      await db
        .update(refunds)
        .set({ ...input.data, updatedAt: now })
        .where(eq(refunds.id, input.id));

      await logAudit(apiCtx, "update_refund", "refund", input.id, input.data);

      return { success: true };
    },
  }),

  deleteRefund: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);

      await db.delete(refunds).where(eq(refunds.id, id));
      await logAudit(apiCtx, "delete_refund", "refund", id);

      return { success: true };
    },
  }),

  // --- CUSTOMERS ---
  listCustomers: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;
      const where = q
        ? or(like(customers.name, `%${q}%`), like(customers.phone, `%${q}%`), like(customers.email, `%${q}%`))
        : undefined;

      const rows = await db
        .select()
        .from(customers)
        .where(where)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  createCustomer: defineAction({
    input: CustomerSchema.omit({ id: true, createdAt: true, updatedAt: true }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const newCustomer = {
        id,
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(customers).values(newCustomer);
      await logAudit(apiCtx, "create_customer", "customer", id, input);
      return newCustomer;
    },
  }),

  updateCustomer: defineAction({
    input: z.object({
      id: z.string(),
      data: CustomerSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }).partial(),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();
      await db
        .update(customers)
        .set({ ...(input.data as any), updatedAt: now })
        .where(eq(customers.id, input.id));
      await logAudit(apiCtx, "update_customer", "customer", input.id, input.data);
      return { ok: true };
    },
  }),

  deleteCustomer: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      await db.delete(customers).where(eq(customers.id, id));
      await logAudit(apiCtx, "delete_customer", "customer", id);
      return { ok: true };
    },
  }),

  // --- NOTIFICATIONS ---
  listNotifications: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().default(30),
      offset: z.number().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;
      const where = q ? or(like(notifications.recipient, `%${q}%`), like(notifications.template, `%${q}%`)) : undefined;

      const rows = await db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(where);

      return { rows, total: Number(totalRows[0]?.count || 0) };
    },
  }),

  createNotification: defineAction({
    input: z.object({
      channel: z.string().min(1),
      recipient: z.string().min(1),
      template: z.string().optional(),
      payloadJson: z.string().optional(),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      await db.insert(notifications).values({
        id,
        channel: input.channel,
        recipient: input.recipient,
        template: input.template || null,
        payloadJson: input.payloadJson || null,
        status: "pending",
        createdAt: now,
        sentAt: null,
        updatedAt: now,
      });
      await logAudit(apiCtx, "create_notification", "notification", id, input);
      return { ok: true, id };
    },
  }),

  updateNotification: defineAction({
    input: z.object({
      id: z.string(),
      data: z.object({
        channel: z.string().min(1),
        recipient: z.string().min(1),
        status: z.string().default("pending"),
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      await db
        .update(notifications)
        .set({
          channel: input.data.channel,
          recipient: input.data.recipient,
          status: input.data.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(notifications.id, input.id));
      await logAudit(apiCtx, "update_notification", "notification", input.id, input.data);
      return { ok: true };
    },
  }),

  sendNotification: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();
      await db
        .update(notifications)
        .set({ status: "sent", sentAt: now, updatedAt: now })
        .where(eq(notifications.id, id));
      await logAudit(apiCtx, "send_notification", "notification", id);
      return { ok: true };
    },
  }),

  deleteNotification: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      await db.delete(notifications).where(eq(notifications.id, id));
      await logAudit(apiCtx, "delete_notification", "notification", id);
      return { ok: true };
    },
  }),

  // --- ADMIN USERS ---
  listAdminUsers: defineAction({
    handler: async (_, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await requireAdmin(apiCtx);
      if (!admin || admin.role !== "owner") throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      return db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
    },
  }),

  createAdminUser: defineAction({
    input: z.object({
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["owner", "admin", "editor"]),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await requireAdmin(apiCtx);
      if (!admin || admin.role !== "owner") throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const { hashPassword } = await import("../lib/auth");
      const passwordHash = await hashPassword(input.password);

      await db.insert(adminUsers).values({
        id,
        email: normalizeEmail(input.email),
        passwordHash,
        role: input.role,
        createdAt: now,
      });

      await logAudit(apiCtx, "create_admin_user", "admin_user", id, {
        email: input.email,
      });
      return { ok: true, id };
    },
  }),

  deleteAdminUser: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await requireAdmin(apiCtx);
      if (!admin || admin.role !== "owner") throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      await db.delete(adminUsers).where(eq(adminUsers.id, id));
      await logAudit(apiCtx, "delete_admin_user", "admin_user", id);
      return { ok: true };
    },
  }),

  updateAdminUser: defineAction({
    input: z.object({
      id: z.string(),
      data: z.object({
        role: z.enum(["owner", "admin", "editor"]).optional(),
        password: z.string().min(6).optional(),
      }),
    }),
    handler: async ({ id, data }, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await requireAdmin(apiCtx);
      if (!admin || admin.role !== "owner") throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const updateData: any = {};

      if (data.role) updateData.role = data.role;
      if (data.password) {
        const { hashPassword } = await import("../lib/auth");
        updateData.passwordHash = await hashPassword(data.password);
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(adminUsers).set(updateData).where(eq(adminUsers.id, id));
        await logAudit(apiCtx, "update_admin_user", "admin_user", id, { fields: Object.keys(updateData) });
      }
      return { ok: true };
    },
  }),

  // --- SETTINGS ---
  getSettings: defineAction({
    handler: async (_, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const rows = await db.select().from(settings);
      const res: any = {};
      for (const r of rows) {
        try {
          res[r.key] = JSON.parse(r.valueJson);
        } catch {
          res[r.key] = r.valueJson;
        }
      }
      return res;
    },
  }),

  updateSettings: defineAction({
    input: z.object({
      orderSettings: OrderSettingsSchema.partial().optional(),
      deliverySettings: DeliverySettingsSchema.partial().optional(),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      if (input.orderSettings) {
        await db
          .insert(settings)
          .values({
            key: "order_settings",
            valueJson: JSON.stringify(input.orderSettings),
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: settings.key,
            set: {
              valueJson: JSON.stringify(input.orderSettings),
              updatedAt: now,
            },
          });
      }

      if (input.deliverySettings) {
        await db
          .insert(settings)
          .values({
            key: "delivery_settings",
            valueJson: JSON.stringify(input.deliverySettings),
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: settings.key,
            set: {
              valueJson: JSON.stringify(input.deliverySettings),
              updatedAt: now,
            },
          });
      }

      await logAudit(apiCtx, "update_settings", "settings", "global", input);
      return { ok: true };
    },
  }),

  // --- CMS ---
  listCmsPages: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().default(30),
      offset: z.number().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;
      const where = q ? or(like(cmsPages.title, `%${q}%`), like(cmsPages.slug, `%${q}%`)) : undefined;

      const rows = await db
        .select()
        .from(cmsPages)
        .where(where)
        .orderBy(desc(cmsPages.updatedAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(cmsPages)
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  createCmsPage: defineAction({
    input: z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      contentMd: z.string().default(""),
      isActive: z.boolean().default(true),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.insert(cmsPages).values({
        id,
        title: input.title,
        slug: input.slug,
        contentMd: input.contentMd,
        isActive: input.isActive ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit(apiCtx, "create_cms_page", "cms_page", id, { slug: input.slug });
      return { ok: true, id };
    },
  }),

  getCmsPage: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const rows = await db.select().from(cmsPages).where(eq(cmsPages.id, id)).limit(1);

      return rows[0] || null;
    },
  }),

  updateCmsPage: defineAction({
    input: z.object({
      id: z.string(),
      data: z.object({
        title: z.string().optional(),
        slug: z.string().optional(),
        contentMd: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const now = new Date().toISOString();

      const updateData: any = { ...input.data, updatedAt: now };
      if (typeof input.data.isActive === "boolean") {
        updateData.isActive = input.data.isActive ? 1 : 0;
      }

      await db.update(cmsPages).set(updateData).where(eq(cmsPages.id, input.id));

      await logAudit(apiCtx, "update_cms_page", "cms_page", input.id, input.data);
      return { ok: true };
    },
  }),

  deleteCmsPage: defineAction({
    input: z.string(),
    handler: async (id, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      await db.delete(cmsPages).where(eq(cmsPages.id, id));
      await logAudit(apiCtx, "delete_cms_page", "cms_page", id);
      return { ok: true };
    },
  }),

  // --- AUDIT LOGS ---
  listAuditLogs: defineAction({
    input: z.object({
      q: z.string().optional(),
      limit: z.number().default(30),
      offset: z.number().default(0),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      const admin = await getAdminSession(apiCtx);
      if (!admin) throw new ActionError({ code: "UNAUTHORIZED" });

      await initDb(apiCtx);
      const db = getDrizzle(apiCtx);
      const { q, limit, offset } = input;
      const where = q
        ? or(
            like(auditLogs.actorEmail, `%${q}%`),
            like(auditLogs.action, `%${q}%`),
            like(auditLogs.entityType, `%${q}%`),
          )
        : undefined;

      const rows = await db
        .select()
        .from(auditLogs)
        .where(where)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(where);

      return { rows, total: totalRes[0]?.count || 0 };
    },
  }),

  // --- I18N ---
  setLanguage: defineAction({
    input: z.object({
      lang: z.enum(["id", "en", "ja"]),
    }),
    handler: async (input, ctx) => {
      const apiCtx = ctx as unknown as APIContext;
      apiCtx.cookies.set("rs_lang", input.lang, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: false, // Allow client-side access for hydration
        sameSite: "lax",
      });
      return { success: true };
    },
  }),
};
