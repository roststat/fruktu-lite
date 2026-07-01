import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return <AdminClient orders={allOrders} />;
}
