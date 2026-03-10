import City from "@/models/City";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

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

export async function POST(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await City.sync();
    const { name, deliveryCharge } = await request.json();

    if (!name || !name.trim()) {
      return Response.json(
        { success: false, message: "City name is required" },
        { status: 400 }
      );
    }

    if (deliveryCharge === undefined || isNaN(Number(deliveryCharge)) || Number(deliveryCharge) < 0) {
      return Response.json(
        { success: false, message: "Valid delivery charge is required" },
        { status: 400 }
      );
    }

    const existing = await City.findOne({ name: name.trim() });
    if (existing) {
      return Response.json(
        { success: false, message: "City already exists" },
        { status: 400 }
      );
    }

    const city = await City.create({
      name: name.trim(),
      deliveryCharge: Number(deliveryCharge).toFixed(2),
    });

    return Response.json({ success: true, city });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to add city", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await City.sync();
    const { id, name, deliveryCharge } = await request.json();

    if (!id) {
      return Response.json({ success: false, message: "City ID is required" }, { status: 400 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (deliveryCharge !== undefined) updateData.deliveryCharge = Number(deliveryCharge).toFixed(2);

    await City.update(id, updateData);

    return Response.json({ success: true, message: "City updated" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update city", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await City.sync();
    const { id } = await request.json();

    if (!id) {
      return Response.json({ success: false, message: "City ID is required" }, { status: 400 });
    }

    await City.delete(id);

    return Response.json({ success: true, message: "City deleted" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to delete city", error: error.message },
      { status: 500 }
    );
  }
}
