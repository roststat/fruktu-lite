import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["items", "itemsCount", "estimatedTotal", "phone", "address", "comment", "status"] as const;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) patch[key] = key === "estimatedTotal" ? String(body[key]) : body[key];
  }

  const [order] = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}
