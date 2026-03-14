CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`industry` text NOT NULL,
	`logo_url` text,
	`onboarding_completed` integer DEFAULT false NOT NULL,
	`settings_json` text DEFAULT '{}',
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
DROP INDEX `categories_slug_unique`;--> statement-breakpoint
ALTER TABLE `categories` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
DROP INDEX `cms_pages_slug_unique`;--> statement-breakpoint
ALTER TABLE `cms_pages` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
DROP INDEX `coupons_code_unique`;--> statement-breakpoint
ALTER TABLE `coupons` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
DROP INDEX `orders_order_no_unique`;--> statement-breakpoint
ALTER TABLE `orders` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_id` text REFERENCES customers(id);--> statement-breakpoint
DROP INDEX `products_slug_unique`;--> statement-breakpoint
ALTER TABLE `products` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_users` ADD `tenant_id` text;--> statement-breakpoint
ALTER TABLE `ads_campaigns` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `coupon_usages` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory_movements` ADD `order_id` text REFERENCES orders(id);--> statement-breakpoint
ALTER TABLE `invoices` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `order_status_history` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `product_reviews` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `refunds` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `refunds` ADD `order_id` text NOT NULL REFERENCES orders(id);--> statement-breakpoint
ALTER TABLE `settings` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `tenant_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `order_id` text NOT NULL REFERENCES orders(id);--> statement-breakpoint
ALTER TABLE `shipping_rules` ADD `tenant_id` text NOT NULL;