import { router } from "./trpc";
import { productRouter } from "./routers/products";
import { categoryRouter } from "./routers/categories";
import { orderRouter } from "./routers/orders";
import { shipmentRouter } from "./routers/shipments";
import { invoiceRouter } from "./routers/invoices";
import { refundRouter } from "./routers/refunds";
import { shippingRuleRouter } from "./routers/shippingRules";
import { customerRouter } from "./routers/customers";
import { couponRouter } from "./routers/coupons";
import { adsRouter } from "./routers/ads";
import { inventoryRouter } from "./routers/inventory";
import { settingsRouter } from "./routers/settings";

export const appRouter = router({
    products: productRouter,
    categories: categoryRouter,
    orders: orderRouter,
    shipments: shipmentRouter,
    invoices: invoiceRouter,
    refunds: refundRouter,
    shippingRules: shippingRuleRouter,
    customers: customerRouter,
    coupons: couponRouter,
    ads: adsRouter,
    inventory: inventoryRouter,
    settings: settingsRouter,
});








export type AppRouter = typeof appRouter;


