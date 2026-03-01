import { z } from "astro:schema";

// Base common fields
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Admin User
export const AdminUserSchema = BaseEntitySchema.extend({
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(["owner", "admin", "editor"]),
}).omit({ updatedAt: true });

export type AdminUser = z.infer<typeof AdminUserSchema>;

// Category
export const CategorySchema = BaseEntitySchema.extend({
  name: z.string().min(1, "Nama wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  sortOrder: z.number().int().default(0),
  isActive: z
    .union([z.boolean(), z.number()])
    .transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v)),
});

export type Category = z.infer<typeof CategorySchema>;

// Product
export const ProductSchema = BaseEntitySchema.extend({
  sku: z.string().optional().nullable(),
  name: z.string().min(1, "Nama wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  price: z.number().int().min(0),
  cost: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().optional().nullable(),
  isActive: z
    .union([z.boolean(), z.number()])
    .transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v)),
  imagesJson: z.string().optional().nullable(),
  metadataJson: z.string().optional().nullable(),
});

export type Product = z.infer<typeof ProductSchema>;

// Order
export const OrderSchema = BaseEntitySchema.extend({
  orderNo: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().min(1),
  shippingAddressJson: z.string(),
  itemsJson: z.string(),
  subtotal: z.number().int(),
  discountTotal: z.number().int(),
  deliveryFee: z.number().int(),
  total: z.number().int(),
  couponCode: z.string().optional().nullable(),
  promoJson: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  midtransToken: z.string().optional().nullable(),
  midtransOrderId: z.string().optional().nullable(),
});

export type Order = z.infer<typeof OrderSchema>;

// Coupon
export const CouponSchema = BaseEntitySchema.extend({
  code: z.string().min(1),
  type: z.string(),
  value: z.number().int(),
  minOrder: z.number().int().optional().nullable(),
  maxDiscount: z.number().int().optional().nullable(),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  usageLimit: z.number().int().optional().nullable(),
  perUserLimit: z.number().int().optional().nullable(),
  isActive: z
    .union([z.boolean(), z.number()])
    .transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v)),
});

export type Coupon = z.infer<typeof CouponSchema>;

// Customer
export const CustomerSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email().nullish(),
  phone: z.string().min(1, "No. telepon wajib diisi"),
  notes: z.string().optional().nullable(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// Notification
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  channel: z.string(),
  recipient: z.string(),
  template: z.string().optional().nullable(),
  payloadJson: z.string().optional().nullable(),
  status: z.string(),
  createdAt: z.string(),
  sentAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Ads Campaign
export const AdsCampaignSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "Nama wajib diisi"),
  channel: z.string().min(1, "Channel wajib diisi"),
  budget: z.number().int().min(0),
  spend: z.number().int().min(0).default(0),
  status: z.enum(["draft", "active", "paused", "completed"]),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AdsCampaign = z.infer<typeof AdsCampaignSchema>;

// Inventory Movement
export const InventoryMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  type: z.enum(["in", "out", "adjustment"]),
  qty: z.number(),
  notes: z.string().optional().nullable(),
  refOrderNo: z.string().optional().nullable(),
  createdAt: z.string(),
});

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

// Shipment / Fulfillment
export const ShipmentStatusSchema = z.enum(["packing", "shipped", "delivered", "cancelled"]);
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;

export const ShipmentSchema = BaseEntitySchema.extend({
  orderNo: z.string(),
  status: ShipmentStatusSchema,
  carrier: z.string().optional().nullable(),
  trackingNo: z.string().optional().nullable(),
  shippedAt: z.string().optional().nullable(),
  deliveredAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type Shipment = z.infer<typeof ShipmentSchema>;

// Inventory Product View
export const InventoryProductSchema = z.object({
  id: z.string(),
  sku: z.string().optional().nullable(),
  name: z.string(),
  stock: z.number().int(),
  price: z.number().int(),
});

export type InventoryProduct = z.infer<typeof InventoryProductSchema>;

// Settings
export const OrderSettingsSchema = z.object({
  preorderOnly: z.boolean().default(false),
  minimumLeadTimeHours: z.number().default(0),
  cutoffTime: z.string().default(""),
  sameDayEnabled: z.boolean().default(false),
  availableDays: z.array(z.string()).default([]),
});

export type OrderSettings = z.infer<typeof OrderSettingsSchema>;

export const DeliverySettingsSchema = z.object({
  deliveryProvince: z.string().default("DI Yogyakarta"),
  freeDeliveryThreshold: z.number().default(0),
});

export type DeliverySettings = z.infer<typeof DeliverySettingsSchema>;

// Audit Log
export const AuditLogSchema = z.object({
  id: z.string(),
  actorEmail: z.string().optional().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional().nullable(),
  dataJson: z.string().optional().nullable(),
  createdAt: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// Invoice
export const InvoiceSchema = BaseEntitySchema.extend({
  orderId: z.string(),
  invoiceNo: z.string(),
  status: z.string(),
  issuedAt: z.string(),
  dueAt: z.string().optional().nullable(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// Refund
export const RefundSchema = BaseEntitySchema.extend({
  orderNo: z.string(),
  amount: z.number().int(),
  reason: z.string().optional().nullable(),
  status: z.string(),
  providerStatus: z.string().optional().nullable(),
  providerResponseJson: z.string().optional().nullable(),
});

export type Refund = z.infer<typeof RefundSchema>;

// Shipping Rule
export const ShippingRuleSchema = BaseEntitySchema.extend({
  name: z.string(),
  type: z.string(),
  priority: z.number().int().default(100),
  isActive: z
    .union([z.boolean(), z.number()])
    .transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v)),
  configJson: z.string(),
});

export type ShippingRule = z.infer<typeof ShippingRuleSchema>;
