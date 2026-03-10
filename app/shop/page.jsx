"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><p className="text-zinc-500">Loading...</p></div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const ITEMS_PER_PAGE = 12;
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setCategories(data.categories.map((c) => c.name));
      } catch (err) {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category) params.set("category", category);
        if (priceRange) params.set("priceRange", priceRange);
        params.set("page", page);
        params.set("limit", ITEMS_PER_PAGE);
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.products);
          setTotalProducts(data.total);
        }
      } catch (err) {
        // Products will remain empty
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category, priceRange, page]);

  const handleCategory = (cat) => {
    setCategory(cat);
    setPriceRange("");
    setPage(1);
  };

  const handleAll = () => {
    setCategory("");
    setPriceRange("");
    setPage(1);
  };

  const handlePriceRange = (range) => {
    setPriceRange(range);
    setCategory("");
    setPage(1);
  };

  const sidebarBtn = (label, active, onClick) => (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-indigo-600 text-white font-medium"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
      }`}
    >
      {label}
    </button>
  );

  const pillBtn = (label, active, onClick) => (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-white text-zinc-600 border border-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">All Drinks</h1>

        {/* Mobile: horizontal pills */}
        <div className="md:hidden flex gap-2 flex-wrap pb-4 mb-4">
          {pillBtn("All", !category && !priceRange, handleAll)}
          {pillBtn("Affordable", priceRange === "affordable", () => handlePriceRange("affordable"))}
          {pillBtn("Premium", priceRange === "premium", () => handlePriceRange("premium"))}

          {/* Categories dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMobileCatOpen(!mobileCatOpen)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-zinc-600 border border-zinc-300"
              }`}
            >
              {category || "Category"}
              <svg className={`w-3 h-3 transition-transform ${mobileCatOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileCatOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                <button onClick={() => { handleAll(); setMobileCatOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${!category ? "bg-zinc-100 font-medium text-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>All</button>
                {categories.map((cat) => (
                  <button key={`mob-${cat}`} onClick={() => { handleCategory(cat); setMobileCatOpen(false); }} className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${category === cat ? "bg-zinc-100 font-medium text-zinc-800" : "text-zinc-600 hover:bg-zinc-100"}`}>{cat}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop: left sidebar */}
          <aside className="hidden md:block w-48 flex-shrink-0">
            <nav className="space-y-1">
              {sidebarBtn("All", !category && !priceRange, handleAll)}

              {/* Categories accordion */}
              <div className="pt-3">
                <button
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  Categories
                  <svg className={`w-4 h-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoriesOpen && (
                  <div className="mt-1 space-y-0.5">
                    {categories.map((cat) => (
                      <span key={`cat-${cat}`}>
                        {sidebarBtn(cat, category === cat, () => handleCategory(cat))}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price range */}
              <div className="pt-3 border-t border-zinc-200 mt-3">
                <p className="px-3 py-2 text-sm font-semibold text-zinc-700">Price Range</p>
                <div className="space-y-0.5">
                  {sidebarBtn("Affordable", priceRange === "affordable", () => handlePriceRange("affordable"))}
                  {sidebarBtn("Premium", priceRange === "premium", () => handlePriceRange("premium"))}
                </div>
              </div>
            </nav>
          </aside>

          {/* Right: search + products */}
          <div className="flex-1 min-w-0">
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                placeholder="Search drinks..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 px-4 py-2 text-base border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Sort by</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {loading ? (
              <p className="text-zinc-500">Loading drinks...</p>
            ) : (() => {
              const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
              return products.length === 0 ? (
                <div className="bg-white p-8 rounded-lg border border-zinc-200 text-center">
                  <p className="text-zinc-500">No drinks found.</p>
                </div>
              ) : (
              <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...products].sort((a, b) => {
                  if (sortBy === "price-low") return Number(a.price) - Number(b.price);
                  if (sortBy === "price-high") return Number(b.price) - Number(a.price);
                  return 0;
                }).map((product) => {
                  let firstImage = null;
                  if (product.images) {
                    try {
                      const parsed = JSON.parse(product.images);
                      if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
                    } catch {}
                  }
                  if (!firstImage && product.imageUrl) firstImage = product.imageUrl;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group"
                    >
                      <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={product.name}
                            className="w-full h-52 sm:h-64 object-contain"
                          />
                        ) : (
                          <div className="w-full h-52 sm:h-64 bg-zinc-100 flex items-center justify-center">
                            <span className="text-zinc-500 text-xs sm:text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 sm:mt-3">
                        <h3 className="text-xs sm:text-sm font-semibold text-zinc-800">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">
                            {product.category}
                          </p>
                        )}
                        <p className="text-sm sm:text-base font-bold text-zinc-900 mt-0.5 sm:mt-1">
                          रु {Number(product.price)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-zinc-600 text-sm">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className={`px-3 py-1.5 text-sm border rounded-md ${
                            page === p
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
              </>
              );
            })()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
