import { Model } from "@/lib/model";

const productSchema = {
  name: {
    type: "VARCHAR(255)",
    required: true,
  },
  description: {
    type: "TEXT",
    default: null,
  },
  price: {
    type: "DECIMAL(10,2)",
    required: true,
  },
  images: {
    type: "TEXT",
    default: null,
  },
  category: {
    type: "VARCHAR(100)",
    default: null,
  },
  stock: {
    type: "INT",
    default: 0,
  },
  sizes: {
    type: "TEXT",
    default: null,
  },
  isActive: {
    type: "BOOLEAN",
    default: true,
  },
  isFeatured: {
    type: "BOOLEAN",
    default: false,
  },
};

const Product = new Model("products", productSchema);

export default Product;
