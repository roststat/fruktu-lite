import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  sendTelegramMessage,
  buildStatusMessage,
  buildItemsAddedMessage,
  STATUS_LABELS,
} from "@/lib/telegram";
import { getCartProductById } from "@/data/catalog";

type OrderItem = { productId: string; quantity: number };

export type AdminChangeEntry = {
  kind: "added" | "removed" | "qty_changed";
  productId: string;
  productName: string;
  unit: string;
  from?: number;
  to?: number;
};

export type AdminChangeEvent = {
  ts: string;
  prevTotal: number;
  newTotal: number;
  entries: AdminChangeEntry[];
};

function computeTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const entry = getCartProductById(item.productId);
    return entry ? sum + Math.round(entry.price * item.quantity) : sum;
  }, 0);
}

function computeDiff(prev: OrderItem[], next: OrderItem[]): AdminChangeEntry[] {
  const entries: AdminChangeEntry[] = [];
  const prevMap = new Map(prev.map((i) => [i.productId, i.quantity]));
  const nextMap = new Map(next.map((i) => [i.productId, i.quantity]));

  for (const [productId, nextQty] of nextMap) {
    const catalog = getCartProductById(productId);
    const name = catalog?.product.name ?? productId;
    const unit = catalog?.product.unit ?? "";
    if (!prevMap.has(productId)) {
      entries.push({ kind: "added", productId, productName: name, unit, to: nextQty });
    } else {
      const prevQty = prevMap.get(productId)!;
      if (Math.abs(prevQty - nextQty) > 0.001) {
        entries.push({ kind: "qty_changed", productId, productName: name, unit, from: prevQty, to: nextQty });
      }
    }
  }
  for (const [productId, prevQty] of prevMap) {
    if (!nextMap.has(productId)) {
      const catalog = getCartProductById(productId);
      const name = catalog?.product.name ?? productId;
      const unit = catalog?.product.unit ?? "";
      entries.push({ kind: "removed", productId, productName: name, unit, from: prevQty });
    }
  }
  return entries;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "items", "itemsCount", "estimatedTotal",
    "phone", "address", "comment", "status",
    "finalWeight", "finalTotal", "factItems", "paymentStatus",
  ] as const;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (!(key in body)) continue;
    if (key === "estimatedTotal" || key === "finalTotal" || key === "finalWeight") {
      patch[key] = body[key] != null ? String(body[key]) : null;
    } else {
      patch[key] = body[key];
    }
  }

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Compute and append admin change event when items are modified
  if (body.items && Array.isArray(body.items)) {
    const prevItems = (existing.items as OrderItem[]) ?? [];
    const nextItems = body.items as OrderItem[];
    const entries = computeDiff(prevItems, nextItems);
    if (entries.length > 0) {
      const prevTotal = computeTotal(prevItems);
      const newTotal = computeTotal(nextItems);
      const event: AdminChangeEvent = {
        ts: new Date().toISOString(),
        prevTotal,
        newTotal,
        entries,
      };
      const existing_changes = (existing.adminChanges as AdminChangeEvent[] | null) ?? [];
      patch.adminChanges = [...existing_changes, event];
    }
  }

  const [order] = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();

  const hasTelegram = order.messengerPlatform === "telegram" && order.messengerChatId;

  // Уведомление при смене статуса
  if (
    typeof body.status === "string" &&
    body.status !== existing.status &&
    hasTelegram
  ) {
    const label = STATUS_LABELS[order.status];
    if (label) {
      const { text, buttons } = buildStatusMessage(
        order.id,
        order.status,
        order.items as { productId: string; quantity: number }[],
        order.estimatedTotal,
        order.finalWeight,
        order.finalTotal
      );
      await sendTelegramMessage(order.messengerChatId!, text, buttons);
    }
  }

  // Уведомление при добавлении товаров (items изменились, статус не менялся)
  if (body.items && !body.status && hasTelegram) {
    const prevIds = new Set((existing.items as { productId: string }[]).map((i) => i.productId));
    const addedItems = (body.items as { productId: string; quantity: number }[]).filter(
      (i) => !prevIds.has(i.productId)
    );
    if (addedItems.length > 0) {
      const newTotal = Math.round(Number(order.estimatedTotal));
      const { text, buttons } = buildItemsAddedMessage(
        order.id,
        addedItems,
        order.items as { productId: string; quantity: number }[],
        newTotal
      );
      await sendTelegramMessage(order.messengerChatId!, text, buttons);
    }
  }

  return NextResponse.json(order);
}
