import { requireAuth } from "@/lib/auth";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const { user: authUser, error } = requireAuth(request);
  if (error) return error;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { success: false, message: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser.id);
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return Response.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update(user.id, { password: hashedPassword });

    return Response.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    return Response.json(
      { success: false, message: "Failed to change password", error: err.message },
      { status: 500 }
    );
  }
}
