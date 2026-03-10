"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, clearTokens, refreshTokens, authFetch } from "@/lib/auth-client";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      let currentUser = getUser();

      if (currentUser) {
        const refreshed = await refreshTokens();
        if (!refreshed) {
          currentUser = null;
        } else if (refreshed.user) {
          currentUser = refreshed.user;
        }
      }

      if (!currentUser || currentUser.role !== "admin") {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const fetchOrderCount = async () => {
      try {
        const res = await authFetch("/api/admin/orders");
        const data = await res.json();
        if (data.success) {
          const active = data.orders.filter(
            (o) => !["delivered", "cancelled", "returned"].includes(o.status)
          ).length;
          setNewOrderCount(active);
        }
      } catch (err) {
        // Count will remain unchanged
      }
    };

    fetchOrderCount();
  }, [loading, pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearTokens();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/payment-mode", label: "Payment Mode" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-zinc-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-bold text-zinc-800">DrinksButwal Admin</span>
        <div className="w-10" />
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed h-full z-50 w-64 bg-white shadow-md flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-800">DrinksButwal</h1>
            <p className="text-sm text-zinc-500">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-md mb-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 text-zinc-800"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800"
                }`}
              >
                {item.label}
                {item.label === "Orders" && newOrderCount > 0 && (
                  <span className="bg-yellow-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {newOrderCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <Link
            href="/"
            className="block px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 mb-2"
          >
            Back to Store
          </Link>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md text-left"
          >
            Log Out
          </button>
        </div>
      </aside>

      <main className="md:ml-64 flex-1 bg-zinc-50 min-h-screen p-4 pt-18 md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
