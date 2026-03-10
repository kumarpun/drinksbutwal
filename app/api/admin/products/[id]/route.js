import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Product.sync();
    const product = await Product.findById(id);

    if (!product) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, product });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch product", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Product.sync();

    const existing = await Product.findById(id);
    if (!existing) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const data = await request.json();
    if (data.images) {
      data.images = JSON.stringify(data.images);
    }
    const product = await Product.update(id, data);

    return Response.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update product", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    await Product.sync();

    const existing = await Product.findById(id);
    if (!existing) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await Product.delete(id);

    return Response.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to delete product", error: error.message },
      { status: 500 }
    );
  }
}
