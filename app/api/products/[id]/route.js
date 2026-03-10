import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await Product.sync();

    const product = await Product.findById(id);

    if (!product || !product.isActive) {
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
