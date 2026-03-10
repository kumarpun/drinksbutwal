import City from "@/models/City";

export async function GET() {
  try {
    await City.sync();
    const cities = await City.findAll();

    return Response.json({ success: true, cities });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch cities", error: error.message },
      { status: 500 }
    );
  }
}
