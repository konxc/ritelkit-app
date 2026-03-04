import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("owner"),
  createdAt: text("created_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  categoryId: text("category_id").references(() => categories.id),
  price: integer("price").notNull(),
  cost: integer("cost"),
  stock: integer("stock"),
  isActive: integer("is_active").notNull().default(1),
  imagesJson: text("images_json"),
  metadataJson: text("metadata_json"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: integer("value").notNull(),
  minOrder: integer("min_order"),
  maxDiscount: integer("max_discount"),
  startAt: text("start_at"),
  endAt: text("end_at"),
  usageLimit: integer("usage_limit"),
  perUserLimit: integer("per_user_limit"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNo: text("order_no").notNull().unique(),
  status: text("status").notNull(),
  paymentStatus: text("payment_status").notNull(),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  shippingAddressJson: text("shipping_address_json").notNull(),
  itemsJson: text("items_json").notNull(),
  subtotal: integer("subtotal").notNull(),
  discountTotal: integer("discount_total").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  total: integer("total").notNull(),
  couponCode: text("coupon_code"),
  promoJson: text("promo_json"),
  notes: text("notes"),
  midtransToken: text("midtrans_token"),
  midtransOrderId: text("midtrans_order_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});


export const inventoryMovements = sqliteTable("inventory_movements", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  type: text("type").notNull(),
  qty: integer("qty").notNull(),
  notes: text("notes"),
  orderId: text("order_id").references(() => orders.id),
  refOrderNo: text("ref_order_no"),
  createdAt: text("created_at").notNull(),
});


export const shipments = sqliteTable("shipments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  orderNo: text("order_no").notNull(),
  status: text("status").notNull(),
  carrier: text("carrier"),
  trackingNo: text("tracking_no"),
  shippedAt: text("shipped_at"),
  deliveredAt: text("delivered_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});


export const refunds = sqliteTable("refunds", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  orderNo: text("order_no").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  status: text("status").notNull(),
  providerStatus: text("provider_status"),
  providerResponseJson: text("provider_response_json"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});


export const adsCampaigns = sqliteTable("ads_campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  budget: integer("budget").notNull(),
  spend: integer("spend").notNull().default(0),
  status: text("status").notNull(),
  startAt: text("start_at"),
  endAt: text("end_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const cmsPages = sqliteTable("cms_pages", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  contentMd: text("content_md").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  dataJson: text("data_json"),
  createdAt: text("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  template: text("template"),
  payloadJson: text("payload_json"),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  sentAt: text("sent_at"),
  updatedAt: text("updated_at"),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});

export const couponUsages = sqliteTable("coupon_usages", {
  id: text("id").primaryKey(),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupons.id),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  customerPhone: text("customer_phone"),
  createdAt: text("created_at").notNull(),
});

export const shippingRules = sqliteTable("shipping_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  priority: integer("priority").notNull().default(100),
  isActive: integer("is_active").notNull().default(1),
  configJson: text("config_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  invoiceNo: text("invoice_no").notNull().unique(),
  status: text("status").notNull(),
  issuedAt: text("issued_at").notNull(),
  dueAt: text("due_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  status: text("status").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const productReviews = sqliteTable("product_reviews", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  reviews: many(productReviews),
  movements: many(inventoryMovements),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  statusHistory: many(orderStatusHistory),
  invoices: many(invoices),
  couponUsages: many(couponUsages),
  shipments: many(shipments),
  refunds: many(refunds),
  movements: many(inventoryMovements),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  usages: many(couponUsages),
}));

