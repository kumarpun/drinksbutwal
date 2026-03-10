import Category from "@/models/Category";

export async function GET() {
  try {
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
