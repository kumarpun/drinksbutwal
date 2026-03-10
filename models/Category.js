import { Model } from "@/lib/model";

const categorySchema = {
  name: {
    type: "VARCHAR(100)",
    required: true,
    unique: true,
  },
};

const Category = new Model("categories", categorySchema);

export default Category;
