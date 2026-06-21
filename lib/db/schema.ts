import { pgTable, text, integer, numeric, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const orders = pgTable("fruktu_lite_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  items: jsonb("items").notNull(),
  itemsCount: integer("items_count").notNull(),
  estimatedTotal: numeric("estimated_total", { precision: 10, scale: 2 }).notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  comment: text("comment"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
