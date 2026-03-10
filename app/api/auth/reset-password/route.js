import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "@/models/User";

export async function POST(request) {
  try {
    await User.sync();
    const { token, password } = await request.json();

    if (!token || !password) {
      return Response.json(
        { success: false, message: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({ resetToken: hashedToken });

    if (!user) {
      return Response.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (new Date(user.resetTokenExpiry) < new Date()) {
      return Response.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return Response.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Password reset failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
