import Category from "@/models/Category";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Category.sync();
    const categories = await Category.findAll();

    return Response.json({ success: true, categories });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch categories", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Category.sync();
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return Response.json(
        { success: false, message: "Category already exists" },
        { status: 400 }
      );
    }

    const category = await Category.create({ name: name.trim() });

    return Response.json(
      { success: true, message: "Category created successfully", category },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to create category", error: error.message },
      { status: 500 }
    );
  }
}
