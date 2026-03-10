"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, refreshTokens, authFetch } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [cities, setCities] = useState([]);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

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

    const fetchData = async () => {
      try {
        const [profileRes, citiesRes] = await Promise.all([
          authFetch("/api/profile"),
          fetch("/api/cities"),
        ]);
        const profileData = await profileRes.json();
        const citiesData = await citiesRes.json();

        if (profileData.success) {
          setProfile(profileData.profile);
        }
        if (citiesData.success) {
          setCities(citiesData.cities);
        }
      } catch (err) {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const res = await authFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zip: profile.zip,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage("Profile updated successfully");
      } else {
        setMessage(data.message || "Failed to update profile");
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-800 mb-6">My Profile</h1>

        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-lg shadow-md">
          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-zinc-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-zinc-700">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 border border-zinc-200 rounded-md bg-zinc-50 text-zinc-500 cursor-not-allowed"
            />
          </div>

          <h2 className="text-lg font-semibold text-zinc-800 mb-4">Delivery Details</h2>

          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium mb-2 text-zinc-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium mb-2 text-zinc-700">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={profile.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="city" className="block text-sm font-medium mb-2 text-zinc-700">
              City
            </label>
            {cities.length > 0 ? (
              <select
                id="city"
                name="city"
                value={profile.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="city"
                name="city"
                value={profile.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-2 text-zinc-700">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={profile.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label htmlFor="zip" className="block text-sm font-medium mb-2 text-zinc-700">
                ZIP
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={profile.zip}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-zinc-700 text-white rounded-md font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
