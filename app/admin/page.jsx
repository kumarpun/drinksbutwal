"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ drinks: 0, orders: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          authFetch("/api/admin/products"),
          authFetch("/api/admin/orders"),
        ]);

        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();

        setStats({
          drinks: productsData.success ? productsData.products.length : 0,
          orders: ordersData.success ? ordersData.orders.length : 0,
          pending: ordersData.success
            ? ordersData.orders.filter((o) => o.status === "pending").length
            : 0,
        });
      } catch (err) {
        // Stats will remain at 0
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: "Total Drinks", value: stats.drinks },
    { label: "Total Orders", value: stats.orders },
    { label: "Pending Orders", value: stats.pending },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-800 mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-zinc-500">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <p className="text-sm text-zinc-500 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-zinc-800">{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
