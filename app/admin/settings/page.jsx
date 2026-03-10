"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-client";

export default function AdminSettingsPage() {
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [cities, setCities] = useState([]);
  const [newCityName, setNewCityName] = useState("");
  const [newCityCharge, setNewCityCharge] = useState("");
  const [cityMessage, setCityMessage] = useState("");
  const [addingCity, setAddingCity] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCharge, setEditCharge] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityPage, setCityPage] = useState(1);
  const CITIES_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, citiesRes] = await Promise.all([
          authFetch("/api/admin/settings"),
          authFetch("/api/admin/cities"),
        ]);
        const settingsData = await settingsRes.json();
        const citiesData = await citiesRes.json();
        if (settingsData.success) setDeliveryCharge(settingsData.settings.deliveryCharge || "0");
        if (citiesData.success) setCities(citiesData.cities);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCharge: parseFloat(deliveryCharge) }),
      });
      const data = await res.json();
      setMessage(data.success ? "Settings saved successfully" : (data.message || "Failed to save settings"));
    } catch (err) {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    setAddingCity(true);
    setCityMessage("");
    try {
      const res = await authFetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCityName, deliveryCharge: parseFloat(newCityCharge) }),
      });
      const data = await res.json();
      if (data.success) {
        setCities([...cities, data.city]);
        setNewCityName("");
        setNewCityCharge("");
        setCityMessage("City added successfully");
      } else {
        setCityMessage(data.message || "Failed to add city");
      }
    } catch (err) {
      setCityMessage("Something went wrong");
    } finally {
      setAddingCity(false);
    }
  };

  const handleUpdateCity = async (id) => {
    setCityMessage("");
    try {
      const res = await authFetch("/api/admin/cities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, deliveryCharge: parseFloat(editCharge) }),
      });
      const data = await res.json();
      if (data.success) {
        setCities(cities.map((c) => (c.id === id ? { ...c, name: editName, deliveryCharge: parseFloat(editCharge) } : c)));
        setEditingCity(null);
        setCityMessage("City updated successfully");
      } else {
        setCityMessage(data.message || "Failed to update city");
      }
    } catch (err) {
      setCityMessage("Something went wrong");
    }
  };

  const handleDeleteCity = async (id) => {
    setCityMessage("");
    try {
      const res = await authFetch("/api/admin/cities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setCities(cities.filter((c) => c.id !== id));
        setCityMessage("City deleted");
      } else {
        setCityMessage(data.message || "Failed to delete city");
      }
    } catch (err) {
      setCityMessage("Something went wrong");
    }
  };

  if (loading) return <p className="text-zinc-500">Loading settings...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-800 mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-lg shadow-md mb-8">
        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message}
          </div>
        )}
        <div className="mb-6">
          <label htmlFor="deliveryCharge" className="block text-sm font-medium mb-2 text-zinc-700">
            Default Delivery Charge (Rs)
          </label>
          <input
            type="number"
            id="deliveryCharge"
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(e.target.value)}
            min="0"
            step="0.01"
            required
            className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <p className="text-xs text-zinc-500 mt-1">Fallback charge when no city is selected. Set to 0 for free delivery.</p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">City-wise Delivery Charges</h2>
        {cityMessage && (
          <div className={`mb-4 p-3 rounded-md text-sm ${cityMessage.includes("success") || cityMessage.includes("deleted") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {cityMessage}
          </div>
        )}
        <form onSubmit={handleAddCity} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" placeholder="City name" value={newCityName} onChange={(e) => setNewCityName(e.target.value)} required className="flex-1 px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
          <input type="number" placeholder="Charge (Rs)" value={newCityCharge} onChange={(e) => setNewCityCharge(e.target.value)} min="0" step="0.01" required className="w-full sm:w-32 px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400" />
          <button type="submit" disabled={addingCity} className="px-4 py-2 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50 text-sm">
            {addingCity ? "Adding..." : "Add City"}
          </button>
        </form>
        <input type="text" placeholder="Search cities..." value={citySearch} onChange={(e) => { setCitySearch(e.target.value); setCityPage(1); }} className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 mb-4 text-sm" />

        {(() => {
          const filtered = cities.filter((c) => c.name.toLowerCase().includes(citySearch.toLowerCase()));
          const totalPages = Math.ceil(filtered.length / CITIES_PER_PAGE);
          const paginated = filtered.slice((cityPage - 1) * CITIES_PER_PAGE, cityPage * CITIES_PER_PAGE);
          if (cities.length === 0) return <p className="text-sm text-zinc-500">No cities added yet.</p>;
          if (filtered.length === 0) return <p className="text-sm text-zinc-500">No cities match your search.</p>;
          return (
            <>
              <p className="text-xs text-zinc-500 mb-3">Showing {(cityPage - 1) * CITIES_PER_PAGE + 1}-{Math.min(cityPage * CITIES_PER_PAGE, filtered.length)} of {filtered.length} cities</p>
              <div className="space-y-2">
                {paginated.map((city) => (
                  <div key={city.id} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-md">
                    {editingCity === city.id ? (
                      <>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-md bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                        <input type="number" value={editCharge} onChange={(e) => setEditCharge(e.target.value)} min="0" step="0.01" className="w-24 px-3 py-1.5 border border-zinc-300 rounded-md bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
                        <button onClick={() => handleUpdateCity(city.id)} className="text-sm text-green-600 hover:text-green-800 font-medium">Save</button>
                        <button onClick={() => setEditingCity(null)} className="text-sm text-zinc-500 hover:text-zinc-700 font-medium">Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-zinc-800">{city.name}</span>
                        <span className="text-sm text-zinc-600">Rs {Number(city.deliveryCharge)}</span>
                        <button onClick={() => { setEditingCity(city.id); setEditName(city.name); setEditCharge(String(Number(city.deliveryCharge))); }} className="text-sm text-zinc-500 hover:text-zinc-700 font-medium">Edit</button>
                        <button onClick={() => handleDeleteCity(city.id)} className="text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setCityPage((p) => Math.max(1, p - 1))} disabled={cityPage === 1} className="px-3 py-1.5 text-sm text-zinc-800 border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
                  <span className="text-sm text-zinc-600">{cityPage} / {totalPages}</span>
                  <button onClick={() => setCityPage((p) => Math.min(totalPages, p + 1))} disabled={cityPage === totalPages} className="px-3 py-1.5 text-sm text-zinc-800 border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
