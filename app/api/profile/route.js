import { requireAuth } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request) {
  try {
    const { user: authUser, error } = requireAuth(request);
    if (error) return error;

    await User.sync();
    const user = await User.findById(authUser.id);

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zip: user.zip || "",
      },
    });
  } catch (err) {
    return Response.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { user: authUser, error } = requireAuth(request);
    if (error) return error;

    await User.sync();
    const { name, phone, address, city, state, zip } = await request.json();

    await User.update(authUser.id, {
      ...(name ? { name } : {}),
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
    });

    return Response.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    return Response.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
