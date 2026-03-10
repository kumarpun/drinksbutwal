"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const drinkCategories = [
  { name: "Beer", icon: "\uD83C\uDF7A", href: "/shop?category=Beer" },
  { name: "Hard Drinks", icon: "\uD83C\uDF78", href: "/shop?category=Hard Drinks" },
  { name: "Soft Drinks", icon: "\uD83E\uDD64", href: "/shop?category=Soft Drinks" },
  { name: "Juices", icon: "\uD83E\uDDC3", href: "/shop?category=Juices" },
  { name: "Water", icon: "\uD83D\uDCA7", href: "/shop?category=Water" },
  { name: "Others", icon: "\uD83D\uDED2", href: "/shop?category=Others" },
];

function getNepalTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nepalOffset = 5 * 60 + 45;
  return new Date(utc + nepalOffset * 60000);
}

function isStoreOpen() {
  const nepal = getNepalTime();
  const hours = nepal.getHours();
  // Open from 6 PM (18) to 1 AM (1)
  return hours >= 18 || hours < 1;
}

function ProductCard({ product }) {
  let firstImage = null;
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
    } catch {}
  }
  if (!firstImage && product.imageUrl) firstImage = product.imageUrl;

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white">
        {firstImage ? (
          <img
            src={firstImage}
            alt={product.name}
            className="w-full h-64 object-contain"
          />
        ) : (
          <div className="w-full h-64 bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-400 text-sm">No image</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-zinc-800">{product.name}</h3>
        {product.category && (
          <p className="text-xs text-zinc-500 mt-0.5">{product.category}</p>
        )}
        <p className="text-lg font-bold text-zinc-900 mt-1">
          रु {Number(product.price)}
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeOpen, setStoreOpen] = useState(isStoreOpen());

  useEffect(() => {
    const timer = setInterval(() => {
      setStoreOpen(isStoreOpen());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?featured=true");
        const data = await res.json();
        if (data.success) {
          setFeaturedProducts(data.products.slice(0, 3));
        }
      } catch (err) {
        // Products will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[45vh] sm:h-[55vh] overflow-hidden">
        {/* Background cover image */}
        <img
          src="/tuborg.jpg"
          alt="DrinksButwal"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          {/* Store status banner */}
          <div className={`mb-6 px-5 py-2.5 rounded-full text-sm font-medium ${
            storeOpen
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {storeOpen
              ? "\uD83D\uDFE2 We're Open - Order Now!"
              : "\uD83D\uDD34 We're Closed Now"}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
            Late Night Drinks
            <br />
            <span className="text-indigo-300">Delivered to Your Door</span>
          </h1>
          <p className="text-zinc-200 text-sm sm:text-base mb-6 max-w-xl drop-shadow-md">
            Delivering in Butwal till 1 AM. Soft drinks, energy drinks, juices and more.
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors text-base"
          >
            Shop Now &rarr;
          </Link>
        </div>
      </div>

      {/* Operating Hours Banner */}
      <div className="bg-white border-y border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-zinc-500">
            Operating Hours: <span className="text-zinc-800 font-medium">till 1:00 AM</span> (Nepal Time) &middot; Delivery in Butwal only
          </p>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-zinc-800 mb-8 text-center">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {drinkCategories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-zinc-200 hover:border-indigo-500/50 hover:bg-zinc-50 transition-all shadow-sm"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium text-zinc-700">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-zinc-800">Featured Drinks</h2>
          <Link href="/shop" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            View all &rarr;
          </Link>
        </div>

        {loading ? (
          <p className="text-zinc-500">Loading products...</p>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg border border-zinc-200 text-center shadow-sm">
            <p className="text-zinc-500">No products found.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
