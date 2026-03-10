import { Model } from "@/lib/model";

const orderSchema = {
  userId: {
    type: "INT",
  },
  status: {
    type: "ENUM('pending', 'confirmed', 'shipped', 'delivered', 'received', 'cancelled', 'returned')",
    default: "pending",
  },
  total: {
    type: "DECIMAL(10,2)",
    required: true,
  },
  shippingName: {
    type: "VARCHAR(255)",
    required: true,
  },
  shippingPhone: {
    type: "VARCHAR(30)",
    required: true,
  },
  shippingAddress: {
    type: "TEXT",
    required: true,
  },
  shippingCity: {
    type: "VARCHAR(100)",
    required: true,
  },
  shippingState: {
    type: "VARCHAR(100)",
  },
  shippingZip: {
    type: "VARCHAR(20)",
  },
  receivedAt: {
    type: "DATETIME",
    default: null,
  },
  cancellationReason: {
    type: "VARCHAR(500)",
  },
  returnReason: {
    type: "VARCHAR(500)",
  },
  returnImage: {
    type: "VARCHAR(500)",
    default: null,
  },
  paymentMethod: {
    type: "ENUM('cod', 'online')",
    default: "cod",
  },
  paymentScreenshot: {
    type: "VARCHAR(500)",
  },
  deliveryCharge: {
    type: "DECIMAL(10,2)",
    default: 0,
  },
  paidAmount: {
    type: "DECIMAL(10,2)",
    default: 0,
  },
  paymentStatus: {
    type: "ENUM('review', 'pre_confirmed', 'full_confirmed')",
    default: "review",
  },
  fullPaymentScreenshot: {
    type: "VARCHAR(500)",
  },
  fullPaymentNotified: {
    type: "TINYINT(1)",
    default: 0,
  },
};

const Order = new Model("orders", orderSchema);

export default Order;
