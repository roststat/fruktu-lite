import { pgTable, text, integer, numeric, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const orders = pgTable("fruktu_lite_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  items: jsonb("items").notNull(),
  itemsCount: integer("items_count").notNull(),
  estimatedTotal: numeric("estimated_total", { precision: 10, scale: 2 }).notNull(),
  finalWeight: numeric("final_weight", { precision: 8, scale: 3 }),
  finalTotal: numeric("final_total", { precision: 10, scale: 2 }),
  factItems: jsonb("fact_items"),
  paymentStatus: text("payment_status").default("pending"),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  comment: text("comment"),
  status: text("status").notNull().default("new"),
  adminChanges: jsonb("admin_changes"),
  linkedOrderId: uuid("linked_order_id"),
  messengerPlatform: text("messenger_platform"),
  messengerChatId: text("messenger_chat_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
