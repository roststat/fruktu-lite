import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, itemsCount, estimatedTotal, phone, address, comment } = body;

  if (!items || !phone || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [order] = await db.insert(orders).values({
    items,
    itemsCount,
    estimatedTotal: String(estimatedTotal),
    phone,
    address,
    comment: comment || null,
  }).returning();

  return NextResponse.json({ id: order.id });
}
