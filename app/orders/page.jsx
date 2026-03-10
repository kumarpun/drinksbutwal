"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens, authFetch } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-orange-100 text-orange-700",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      let currentUser = getUser();
      if (currentUser) {
        const refreshed = await refreshTokens();
        if (!refreshed) currentUser = null;
      }
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setAuthLoading(false);
    };
    initAuth();
  }, [router]);

  useEffect(() => {
    if (authLoading) return;

    const fetchOrders = async () => {
      try {
        const res = await authFetch("/api/orders");
        const data = await res.json();
        if (data.success) setOrders(data.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (err) {
        // Orders will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <h1 className="text-2xl font-bold text-zinc-800 mb-6">Your Orders</h1>

        {!loading && orders.some((o) => o.status === "shipped" && o.paymentStatus !== "full_confirmed") && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-indigo-800">
              <span className="font-semibold">Your order has arrived!</span> Please pay the remaining amount before delivery proceeds.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-zinc-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-zinc-500 mb-4">No orders yet.</p>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-800 font-medium"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-800">
                    Order #{order.id}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs capitalize ${
                      statusColors[order.status] || ""
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-zinc-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-zinc-800 font-medium">
                    Rs {Number(order.total)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
