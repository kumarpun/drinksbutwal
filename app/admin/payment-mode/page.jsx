"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function PaymentModePage() {
  const [codEnabled, setCodEnabled] = useState(true);
  const [prePaymentEnabled, setPrePaymentEnabled] = useState(true);
  const [prePaymentPercent, setPrePaymentPercent] = useState("30");
  const [savedPercent, setSavedPercent] = useState("30");
  const [savingPercent, setSavingPercent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) {
          setCodEnabled(data.settings.codEnabled !== "0");
          setPrePaymentEnabled(data.settings.prePaymentEnabled !== "0");
          if (data.settings.prePaymentPercent) {
            setPrePaymentPercent(data.settings.prePaymentPercent);
            setSavedPercent(data.settings.prePaymentPercent);
          }
        }
      } catch (err) {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggleCod = async () => {
    const newValue = !codEnabled;
    setCodEnabled(newValue);
    try {
      await authFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codEnabled: newValue }),
      });
    } catch (err) {
      setCodEnabled(!newValue);
    }
  };

  const handleTogglePrePayment = async () => {
    const newValue = !prePaymentEnabled;
    setPrePaymentEnabled(newValue);
    try {
      await authFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prePaymentEnabled: newValue }),
      });
    } catch (err) {
      setPrePaymentEnabled(!newValue);
    }
  };

  const handleSavePercent = async () => {
    const num = Number(prePaymentPercent);
    if (isNaN(num) || num < 1 || num > 100) return;
    setSavingPercent(true);
    try {
      await authFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prePaymentPercent: num }),
      });
      setSavedPercent(String(num));
    } catch (err) {
      // keep current
    } finally {
      setSavingPercent(false);
    }
  };

  if (loading) return <p className="text-zinc-500">Loading settings...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-800 mb-6">Payment Mode</h1>

      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md space-y-6">
        {/* COD Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">Cash on Delivery</p>
            <p className="text-xs text-zinc-500 mt-0.5">Allow customers to pay cash on delivery</p>
          </div>
          <button
            type="button"
            onClick={handleToggleCod}
            className={`relative w-11 h-6 rounded-full transition-colors ${codEnabled ? "bg-green-500" : "bg-zinc-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${codEnabled ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div className="border-t border-zinc-200" />

        {/* Pre-Payment Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">Pre-Payment Required</p>
            <p className="text-xs text-zinc-500 mt-0.5">Require advance payment before confirming orders</p>
          </div>
          <button
            type="button"
            onClick={handleTogglePrePayment}
            className={`relative w-11 h-6 rounded-full transition-colors ${prePaymentEnabled ? "bg-green-500" : "bg-zinc-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prePaymentEnabled ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Pre-Payment Percentage */}
        {prePaymentEnabled && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Pre-Payment Percentage (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={prePaymentPercent}
                onChange={(e) => setPrePaymentPercent(e.target.value)}
                min="1"
                max="100"
                className="w-32 px-3 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <button
                onClick={handleSavePercent}
                disabled={savingPercent || prePaymentPercent === savedPercent}
                className="px-3 py-2 bg-zinc-700 text-white rounded-md text-xs font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                {savingPercent ? "Saving..." : "Save"}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Customers must pay at least {prePaymentPercent}% of product price as advance
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
