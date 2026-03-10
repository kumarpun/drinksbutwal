import { Model } from "@/lib/model";

const orderItemSchema = {
  orderId: {
    type: "INT",
    required: true,
  },
  productId: {
    type: "INT",
    required: true,
  },
  quantity: {
    type: "INT",
    required: true,
  },
  price: {
    type: "DECIMAL(10,2)",
    required: true,
  },
  size: {
    type: "VARCHAR(50)",
    default: null,
  },
};

const OrderItem = new Model("order_items", orderItemSchema);

export default OrderItem;
