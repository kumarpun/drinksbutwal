import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Product.sync();
    const products = await Product.findAll();

    return Response.json({ success: true, products });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch products", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Product.sync();
    const { name, description, price, stock, images, category, isFeatured } =
      await request.json();

    if (!name || !price) {
      return Response.json(
        { success: false, message: "Name and price are required" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      description: description || null,
      price,
      stock: parseInt(stock) || 0,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
      category: category || null,
      isActive: true,
      isFeatured: isFeatured || false,
    });

    return Response.json(
      { success: true, message: "Product created successfully", product },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to create product", error: error.message },
      { status: 500 }
    );
  }
}
