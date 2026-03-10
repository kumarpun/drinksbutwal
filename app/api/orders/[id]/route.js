import { query, getConnection } from "@/lib/db";
import Order from "@/models/Order";
import { requireAuth } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { user, error } = requireAuth(request);
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

    if (order.userId !== user.id) {
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

    return Response.json({ success: true, order, items });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch order", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const order = await Order.findById(id);

    if (!order || order.userId !== user.id) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const { action, returnReason, returnImage, paymentScreenshot } = await request.json();

    // Notify full payment
    if (action === "notifyFullPayment") {
      if (order.paymentStatus === "full_confirmed") {
        return Response.json(
          { success: false, message: "Full payment is already confirmed" },
          { status: 400 }
        );
      }
      const updateData = { fullPaymentNotified: 1 };
      if (paymentScreenshot) updateData.fullPaymentScreenshot = paymentScreenshot;
      await Order.update(id, updateData);
      return Response.json({ success: true, message: "Admin has been notified of your full payment" });
    }

    // Mark as received
    if (action === "received") {
      if (order.status !== "delivered") {
        return Response.json(
          { success: false, message: "Only delivered orders can be marked as received" },
          { status: 400 }
        );
      }
      await Order.update(id, { status: "received", receivedAt: new Date() });
      return Response.json({ success: true, message: "Order marked as received" });
    }

    // Request return
    if (order.status !== "delivered" && order.status !== "received") {
      return Response.json(
        { success: false, message: "Returns can only be requested for delivered or received orders" },
        { status: 400 }
      );
    }

    if (order.status === "received" && order.receivedAt) {
      const receivedTime = new Date(order.receivedAt).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - receivedTime > oneDayMs) {
        return Response.json(
          { success: false, message: "Return window has expired (1 day after receiving)" },
          { status: 400 }
        );
      }
    }

    if (!returnReason || !returnReason.trim()) {
      return Response.json(
        { success: false, message: "Return reason is required" },
        { status: 400 }
      );
    }

    const updateData = { status: "returned", returnReason };
    if (returnImage) updateData.returnImage = returnImage;

    await Order.update(id, updateData);

    return Response.json({ success: true, message: "Return request submitted" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to submit return request", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;
    await Order.sync();

    const order = await Order.findById(id);

    if (!order || order.userId !== user.id) {
      return Response.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return Response.json(
        { success: false, message: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }

    // Restore stock and delete order in a transaction
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

      return Response.json({ success: true, message: "Order cancelled and deleted" });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to cancel order", error: error.message },
      { status: 500 }
    );
  }
}
