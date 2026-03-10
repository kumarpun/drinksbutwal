import { verifyAccessToken } from "@/lib/jwt";

export function getAuthUser(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return verifyAccessToken(token);
}

export function requireAuth(request) {
  const user = getAuthUser(request);
  if (!user) {
    return {
      error: Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export function requireAdmin(request) {
  const user = getAuthUser(request);
  if (!user) {
    return {
      error: Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  if (user.role !== "admin") {
    return {
      error: Response.json(
        { success: false, message: "Forbidden: admin access required" },
        { status: 403 }
      ),
    };
  }
  return { user };
}
