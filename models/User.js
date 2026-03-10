import { Model } from "@/lib/model";

const userSchema = {
  name: {
    type: "VARCHAR(255)",
    required: true,
  },
  email: {
    type: "VARCHAR(255)",
    required: true,
    unique: true,
  },
  password: {
    type: "VARCHAR(255)",
    required: true,
  },
  role: {
    type: "ENUM('user', 'admin')",
    default: "user",
  },
  isEnabled: {
    type: "BOOLEAN",
    default: true,
  },
  resetToken: {
    type: "VARCHAR(255)",
    default: null,
  },
  resetTokenExpiry: {
    type: "DATETIME",
    default: null,
  },
  phone: {
    type: "VARCHAR(50)",
    default: null,
  },
  address: {
    type: "VARCHAR(500)",
    default: null,
  },
  city: {
    type: "VARCHAR(255)",
    default: null,
  },
  state: {
    type: "VARCHAR(255)",
    default: null,
  },
  zip: {
    type: "VARCHAR(20)",
    default: null,
  },
};

const User = new Model("users", userSchema);

export default User;
