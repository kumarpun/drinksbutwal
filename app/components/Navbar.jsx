"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getUser, clearTokens, isAdmin, authFetch } from "@/lib/auth-client";
import { getCartCount } from "@/lib/cart";

function getNepalTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.75 * 3600000);
}

function isStoreOpen() {
  const nepal = getNepalTime();
  const hour = nepal.getHours();
  // Open from 18:00 (6 PM) to 01:00 (1 AM next day)
  return hour >= 18 || hour < 1;
}

export default function Navbar({ transparent = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shippedCount, setShippedCount] = useState(0);
  const [storeOpen, setStoreOpen] = useState(isStoreOpen());
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const isShopPage = pathname === "/shop";

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    setAdmin(isAdmin());
    setCartCount(getCartCount());

    if (currentUser) {
      authFetch("/api/orders")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setShippedCount(data.shippedCount || 0);
        })
        .catch(() => {});
    }

    const handleCartUpdate = () => setCartCount(getCartCount());
    const handleAuthUpdate = () => {
      setUser(getUser());
      setAdmin(isAdmin());
    };
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("auth-updated", handleAuthUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("auth-updated", handleAuthUpdate);
    };
  }, []);

  // Update store open/closed status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setStoreOpen(isStoreOpen());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setAdmin(false);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event("cart-updated"));
    router.replace("/");
  };

  const navLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`text-base font-semibold transition-colors ${
          transparent
            ? active ? "text-white" : "text-white/70 hover:text-white"
            : active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  const mobileNavLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`block px-4 py-3 text-sm font-medium transition-colors ${
          active ? "text-zinc-900 bg-zinc-100" : "text-zinc-600 hover:bg-zinc-50"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav
      className={`z-50 ${
        transparent
          ? "absolute top-0 left-0 right-0 bg-transparent"
          : "bg-white border-b border-zinc-200 sticky top-0"
      }`}
      ref={searchRef}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <span className={`text-xl font-bold ${transparent ? "text-white" : "text-zinc-800"}`}>
              DrinksButwal
            </span>
          </Link>

          {/* Operating status indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${storeOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className={`text-xs font-medium ${transparent ? "text-white/70" : "text-zinc-500"}`}>
              {storeOpen ? "Open - Till 1 AM" : "Closed - Opens 6 PM"}
            </span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {!isShopPage && (
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-64 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                  transparent
                    ? "border-white/30 bg-white/10 text-white placeholder-white/50 focus:ring-white/40 focus:bg-white/20"
                    : "border-zinc-300 bg-zinc-50 text-zinc-800 placeholder-zinc-400 focus:ring-zinc-400 focus:bg-white"
                }`}
              />
            </form>
          )}
          {navLink("/", "Home")}
          {navLink("/shop", "Shop")}
          <Link
            href="/cart"
            className={`relative transition-colors ${
              transparent
                ? pathname === "/cart" ? "text-white" : "text-white/70 hover:text-white"
                : pathname === "/cart" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-zinc-700 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {user && (
            <Link
              href="/orders"
              className={`relative text-base font-semibold transition-colors ${
                transparent
                  ? pathname === "/orders" ? "text-white" : "text-white/70 hover:text-white"
                  : pathname === "/orders" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Orders
              {shippedCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {shippedCount}
                </span>
              )}
            </Link>
          )}
          {admin && navLink("/admin", "Admin")}

          {user ? (
            <div className={`relative ml-2 pl-4 border-l ${transparent ? "border-white/30" : "border-zinc-200"}`} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 text-base font-semibold transition-colors ${
                  transparent ? "text-white/70 hover:text-white" : "text-zinc-600 hover:text-zinc-800"
                }`}
              >
                {user.name}
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/change-password"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Change Password
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            navLink("/login", "Login")
          )}
        </div>

        {/* Mobile nav icons */}
        <div className="flex md:hidden items-center gap-3">
          {/* Mobile operating status dot */}
          <span
            className={`w-2 h-2 rounded-full sm:hidden ${storeOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            title={storeOpen ? "Open - Delivering till 1 AM" : "Closed - Opens at 6 PM"}
          />
          {!isShopPage && (
            <button
              onClick={() => { setSearchOpen(!searchOpen); setMobileMenuOpen(false); }}
              className={`transition-colors ${transparent ? "text-white/70 hover:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
          <Link
            href="/cart"
            className={`relative transition-colors ${transparent ? "text-white/70 hover:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-zinc-700 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {user && (
            <Link
              href="/orders"
              className={`relative transition-colors ${transparent ? "text-white/70 hover:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {shippedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {shippedCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setSearchOpen(false); }}
            className={`transition-colors ${transparent ? "text-white/70 hover:text-white" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile: search bar */}
      {!isShopPage && searchOpen && (
        <div className={`md:hidden px-4 py-3 ${transparent ? "border-t border-white/20" : "border-t border-zinc-200"}`}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search drinks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className={`w-full px-4 py-2 text-base border rounded-md focus:outline-none focus:ring-2 ${
                transparent
                  ? "border-white/30 bg-white/10 text-white placeholder-white/50 focus:ring-white/40"
                  : "border-zinc-300 bg-white text-zinc-800 focus:ring-zinc-400"
              }`}
            />
          </form>
        </div>
      )}

      {/* Mobile: menu dropdown */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t ${transparent ? "border-white/20 bg-black/60 backdrop-blur-sm" : "border-zinc-200 bg-white"}`}>
          {/* Mobile operating status banner */}
          <div className={`px-4 py-2 flex items-center gap-2 border-b ${transparent ? "border-white/10" : "border-zinc-100"}`}>
            <span className={`w-2 h-2 rounded-full ${storeOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className={`text-xs font-medium ${transparent ? "text-white/70" : "text-zinc-500"}`}>
              {storeOpen ? "Open Now - Delivering till 1 AM" : "Closed - Opens at 6 PM"}
            </span>
          </div>
          {mobileNavLink("/", "Home")}
          {mobileNavLink("/shop", "Shop")}
          {mobileNavLink("/cart", "Cart")}
          {user ? (
            <>
              {admin && mobileNavLink("/admin", "Admin")}
              <Link
                href="/profile"
                className="block px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/change-password"
                className="block px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Change Password
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-zinc-50 transition-colors"
              >
                Logout
              </button>
              <div className={`px-4 py-3 border-t text-xs ${transparent ? "border-white/20 text-white/50" : "border-zinc-100 text-zinc-400"}`}>
                Signed in as {user.email}
              </div>
            </>
          ) : (
            mobileNavLink("/login", "Login")
          )}
        </div>
      )}
    </nav>
  );
}
