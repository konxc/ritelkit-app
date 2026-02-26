import { z } from "zod";

// Base common fields
export const BaseEntitySchema = z.object({
    id: z.uuid(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

// Admin User
export const AdminUserSchema = BaseEntitySchema.extend({
    email: z.email(),
    passwordHash: z.string(),
    role: z.enum(["owner", "admin", "editor"]),
}).omit({ updatedAt: true });

export type AdminUser = z.infer<typeof AdminUserSchema>;

// Category
export const CategorySchema = BaseEntitySchema.extend({
    name: z.string().min(1, "Nama wajib diisi"),
    slug: z.string().min(1, "Slug wajib diisi"),
    sortOrder: z.number().int().default(0),
    isActive: z.union([z.boolean(), z.number()]).transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v)),
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
    isActive: z.union([z.boolean(), z.number()]).transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v)),
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
    customerEmail: z.email().optional().nullable(),
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
    isActive: z.union([z.boolean(), z.number()]).transform((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v)),
});

export type Coupon = z.infer<typeof CouponSchema>;

// Notification
export const NotificationSchema = z.object({
    id: z.uuid(),
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

// Audit Log
export const AuditLogSchema = z.object({
    id: z.uuid(),
    actorEmail: z.string().optional().nullable(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().optional().nullable(),
    dataJson: z.string().optional().nullable(),
    createdAt: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
