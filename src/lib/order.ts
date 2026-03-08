export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "expired",
  "refunded",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "expired", "refunded"] as const;

const orderTransitions: Record<string, string[]> = {
  pending: ["processing", "cancelled", "expired"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  expired: [],
  refunded: [],
};

const paymentTransitions: Record<string, string[]> = {
  unpaid: ["paid", "failed", "expired"],
  paid: ["refunded"],
  failed: [],
  expired: [],
  refunded: [],
};

export function validateOrderUpdate(
  currentStatus: string,
  nextStatus: string,
  currentPayment: string,
  nextPayment: string,
) {
  if (!nextStatus || !nextPayment) {
    return { ok: false, message: "Order and payment status are required" };
  }
  if (currentStatus !== nextStatus) {
    const allowed = orderTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      return { ok: false, message: "Invalid order status transition" };
    }
  }
  if (currentPayment !== nextPayment) {
    const allowed = paymentTransitions[currentPayment] || [];
    if (!allowed.includes(nextPayment)) {
      return { ok: false, message: "Invalid payment status transition" };
    }
  }
  return { ok: true };
}
