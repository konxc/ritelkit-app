import type { APIContext } from "astro";
import { getDb } from "@/lib/db";
import { asInt } from "@/lib/utils";

type ShippingRule = {
  id: string;
  name: string;
  type: string;
  priority: number;
  is_active: number;
  config_json: string;
};

type Address = {
  province: string;
  city: string;
  district?: string;
};

type ShippingZone = {
  province?: string;
  city?: string;
  district?: string;
  fee?: number;
};

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order?: number | null;
  max_discount?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  usage_limit?: number | null;
  per_user_limit?: number | null;
};

export async function calculateShipping(
  ctx: APIContext,
  subtotal: number,
  address: Address,
  couponFreeShipping: boolean,
) {
  if (couponFreeShipping) {
    return { fee: 0, rule: "coupon-free-shipping" };
  }
  const db = getDb(ctx);
  const rules = await db.execute(
    "SELECT * FROM shipping_rules WHERE is_active = 1 ORDER BY priority ASC, created_at DESC",
  );
  for (const row of rules.rows as unknown as ShippingRule[]) {
    const config = JSON.parse(row.config_json || "{}");
    if (row.type === "flat") {
      return { fee: asInt(config.fee, 0), rule: row.name };
    }
    if (row.type === "free_threshold") {
      const threshold = asInt(config.threshold, 0);
      const fee = asInt(config.fee, 0);
      return { fee: subtotal >= threshold ? 0 : fee, rule: row.name };
    }
    if (row.type === "zone") {
      const zones = Array.isArray(config.zones) ? config.zones : [];
      const matched = (zones as ShippingZone[]).find((zone) => {
        const provinceOk = zone.province ? zone.province === address.province : true;
        const cityOk = zone.city ? zone.city === address.city : true;
        const districtOk = zone.district ? zone.district === address.district : true;
        return provinceOk && cityOk && districtOk;
      });
      if (matched) {
        return { fee: asInt(matched.fee, 0), rule: row.name };
      }
    }
  }
  return { fee: 0, rule: "default" };
}

export async function applyCoupon(ctx: APIContext, code: string | null, subtotal: number, customerPhone?: string) {
  if (!code) return { discount: 0, freeShipping: false, coupon: null };
  const db = getDb(ctx);
  const result = await db.execute({
    sql: "SELECT * FROM coupons WHERE code = ? AND is_active = 1",
    args: [code.toUpperCase()],
  });
  const coupon = result.rows[0] as unknown as CouponRow | undefined;
  if (!coupon) return { discount: 0, freeShipping: false, coupon: null };
  const now = Date.now();
  if (coupon.start_at && now < Date.parse(String(coupon.start_at))) {
    return { discount: 0, freeShipping: false, coupon: null };
  }
  if (coupon.end_at && now > Date.parse(String(coupon.end_at))) {
    return { discount: 0, freeShipping: false, coupon: null };
  }
  if (coupon.min_order && subtotal < Number(coupon.min_order)) {
    return { discount: 0, freeShipping: false, coupon: null };
  }
  if (coupon.usage_limit) {
    const usage = await db.execute({
      sql: "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ?",
      args: [coupon.id],
    });
    const count = Number(usage.rows[0]?.count || 0);
    if (count >= Number(coupon.usage_limit)) {
      return { discount: 0, freeShipping: false, coupon: null };
    }
  }
  if (coupon.per_user_limit && customerPhone) {
    const usage = await db.execute({
      sql: "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ? AND customer_phone = ?",
      args: [coupon.id, customerPhone],
    });
    const count = Number(usage.rows[0]?.count || 0);
    if (count >= Number(coupon.per_user_limit)) {
      return { discount: 0, freeShipping: false, coupon: null };
    }
  }
  if (coupon.type === "free_shipping") {
    return { discount: 0, freeShipping: true, coupon };
  }
  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.round((subtotal * Number(coupon.value)) / 100);
  } else if (coupon.type === "fixed") {
    discount = Number(coupon.value);
  }
  if (coupon.max_discount) {
    discount = Math.min(discount, Number(coupon.max_discount));
  }
  return { discount, freeShipping: false, coupon };
}
