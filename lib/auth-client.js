// Client-side auth utilities
import { mergeGuestCart } from "@/lib/cart";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function setTokens(accessToken, refreshToken, user) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  mergeGuestCart();
  window.dispatchEvent(new Event("auth-updated"));
}

export function isAdmin() {
  const user = getUser();
  return user?.role === "admin";
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

// Check if access token is expired or about to expire (within 60s)
function isTokenExpired() {
  const token = getAccessToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now() + 60000;
  } catch {
    return true;
  }
}

export async function refreshTokens() {
  // Skip refresh if access token is still valid
  if (!isTokenExpired()) return true;

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (data.success) {
      setTokens(data.accessToken, data.refreshToken, data.user);
      return data;
    } else {
      clearTokens();
      return null;
    }
  } catch (error) {
    clearTokens();
    return null;
  }
}

// Fetch with auto token refresh
export async function authFetch(url, options = {}) {
  let accessToken = getAccessToken();

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  let res = await fetch(url, { ...options, headers });

  // If unauthorized, try to refresh token
  if (res.status === 401) {
    const refreshed = await refreshTokens();

    if (refreshed) {
      // Retry with new token
      headers.Authorization = `Bearer ${refreshed.accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}
