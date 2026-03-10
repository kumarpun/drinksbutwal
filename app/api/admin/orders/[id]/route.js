import { query, getConnection } from "@/lib/db";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const orders = await query(
      `SELECT orders.*, users.name as userName, users.email as userEmail
       FROM orders
       LEFT JOIN users ON orders.userId = users.id
       WHERE orders.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const items = await query(
      `SELECT order_items.*, products.name as productName, products.images
       FROM order_items
       JOIN products ON order_items.productId = products.id
       WHERE order_items.orderId = ?`,
      [id]
    );

    return Response.json({ success: true, order: orders[0], items });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch order", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    const { status, cancellationReason, paymentStatus, paidAmount } = await request.json();

    const existing = await Order.findById(id);
    if (!existing) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Handle paid amount update
    if (paidAmount !== undefined && paidAmount !== null) {
      const amount = Number(paidAmount);
      if (isNaN(amount) || amount < 0) {
        return Response.json(
          { success: false, message: "Invalid paid amount" },
          { status: 400 }
        );
      }
      const order = await Order.update(id, { paidAmount: amount });
      return Response.json({
        success: true,
        message: "Paid amount updated",
        order,
      });
    }

    // Handle payment status confirmation
    if (paymentStatus) {
      const validPaymentStatuses = ["review", "pre_confirmed", "full_confirmed"];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return Response.json(
          { success: false, message: "Invalid payment status" },
          { status: 400 }
        );
      }
      const order = await Order.update(id, { paymentStatus });
      return Response.json({
        success: true,
        message: "Payment status updated",
        order,
      });
    }

    // Handle order status update
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "received", "cancelled", "returned"];
    if (!validStatuses.includes(status)) {
      return Response.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    if (status === "cancelled" && !cancellationReason) {
      return Response.json(
        { success: false, message: "Cancellation reason is required" },
        { status: 400 }
      );
    }

    const updateData = { status };
    if (status === "cancelled") {
      updateData.cancellationReason = cancellationReason;
    } else if (existing.status === "cancelled") {
      updateData.cancellationReason = null;
    }

    const order = await Order.update(id, updateData);

    return Response.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update order", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const order = await Order.findById(id);
    if (!order) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const items = await query(
        "SELECT productId, quantity, size FROM order_items WHERE orderId = ?",
        [id]
      );

      for (const item of items) {
        const [rows] = await connection.execute(
          "SELECT sizes, stock FROM products WHERE id = ? FOR UPDATE",
          [item.productId]
        );
        const product = rows[0];
        let sizesArr = [];
        if (product && product.sizes) {
          try { sizesArr = JSON.parse(product.sizes); } catch {}
        }

        if (sizesArr.length > 0) {
          const sizeKey = item.size || "";
          sizesArr = sizesArr.map((s) =>
            s.size === sizeKey ? { ...s, stock: (Number(s.stock) || 0) + item.quantity } : s
          );
          const newTotal = sizesArr.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
          await connection.execute(
            "UPDATE products SET sizes = ?, stock = ? WHERE id = ?",
            [JSON.stringify(sizesArr), newTotal, item.productId]
          );
        } else {
          await connection.execute(
            "UPDATE products SET stock = stock + ? WHERE id = ?",
            [item.quantity, item.productId]
          );
        }
      }

      await connection.execute("DELETE FROM order_items WHERE orderId = ?", [id]);
      await connection.execute("DELETE FROM orders WHERE id = ?", [id]);

      await connection.commit();

      return Response.json({ success: true, message: "Order deleted" });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to delete order", error: error.message },
      { status: 500 }
    );
  }
}
