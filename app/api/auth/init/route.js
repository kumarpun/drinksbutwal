import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";
import OrderItem from "@/models/OrderItem";

export async function GET() {
  try {
    await User.sync();
    await Product.sync();
    await Order.sync();
    await OrderItem.sync();

    return Response.json({
      success: true,
      message: "All tables created successfully",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to create tables",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
