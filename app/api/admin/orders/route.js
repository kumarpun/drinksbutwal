import { query } from "@/lib/db";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Order.sync();

    const orders = await query(
      `SELECT orders.*, users.name as userName, users.email as userEmail
       FROM orders
       LEFT JOIN users ON orders.userId = users.id
       ORDER BY orders.created_at DESC`
    );

    return Response.json({ success: true, orders });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch orders", error: error.message },
      { status: 500 }
    );
  }
}
