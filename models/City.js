import { Model } from "@/lib/model";

const citySchema = {
  name: {
    type: "VARCHAR(100)",
    required: true,
    unique: true,
  },
  deliveryCharge: {
    type: "DECIMAL(10,2)",
    required: true,
    default: 0,
  },
};

const City = new Model("cities_delivery", citySchema);

export default City;
