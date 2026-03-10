import Category from "@/models/Category";
import { requireAdmin } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Category.sync();
    const { id } = await params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);
    if (!category) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing && existing.id !== Number(id)) {
      return Response.json(
        { success: false, message: "Category name already exists" },
        { status: 400 }
      );
    }

    await Category.update(id, { name: name.trim() });

    return Response.json({ success: true, message: "Category updated" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update category", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Category.sync();
    const { id } = await params;

    const category = await Category.findById(id);
    if (!category) {
      return Response.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    await Category.delete(id);

    return Response.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to delete category", error: error.message },
      { status: 500 }
    );
  }
}
