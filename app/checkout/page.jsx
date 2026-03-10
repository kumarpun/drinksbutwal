"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUser, authFetch } from "@/lib/auth-client";
import { getCheckoutItems, clearCheckoutItems, removeItemsFromCart } from "@/lib/cart";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

function getNepalTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const nepalOffset = 5 * 60 + 45;
  return new Date(utc + nepalOffset * 60000);
}

function isStoreOpen() {
  const nepal = getNepalTime();
  const hours = nepal.getHours();
  return hours >= 18 || hours < 1;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [storeOpen, setStoreOpen] = useState(isStoreOpen());
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [defaultCharge, setDefaultCharge] = useState(0);
  const [codEnabled, setCodEnabled] = useState(true);
  const [prePaymentEnabled, setPrePaymentEnabled] = useState(false);
  const [prePaymentPercent, setPrePaymentPercent] = useState(30);
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setStoreOpen(isStoreOpen());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const items = getCheckoutItems();
    if (items.length === 0) {
      router.replace("/cart");
      return;
    }
    setCart(items);

    const fetchData = async () => {
      try {
        const fetches = [
          fetch("/api/settings/delivery-charge"),
          fetch("/api/cities"),
        ];
        // Only fetch profile if user is logged in
        const currentUser = getUser();
        if (currentUser) {
          fetches.push(authFetch("/api/profile"));
        }

        const results = await Promise.all(fetches);
        const chargeData = await results[0].json();
        const citiesData = await results[1].json();

        if (chargeData.success) {
          setDefaultCharge(chargeData.deliveryCharge);
          setDeliveryCharge(chargeData.deliveryCharge);
          if (chargeData.codEnabled === false) {
            setCodEnabled(false);
            setPaymentMethod("online");
          }
          if (chargeData.prePaymentEnabled) {
            setPrePaymentEnabled(true);
            setPrePaymentPercent(chargeData.prePaymentPercent || 30);
            setPaymentMethod("online");
          }
        }
        if (citiesData.success) setCities(citiesData.cities);

        if (currentUser && results[2]) {
          const profileData = await results[2].json();
          if (profileData.success && profileData.profile) {
            const p = profileData.profile;
            if (p.phone || p.address || p.city) {
              setShipping({
                name: p.name || "",
                phone: p.phone || "",
                address: p.address || "",
                city: p.city || "",
                state: p.state || "",
                zip: p.zip || "",
              });
              if (p.city) {
                setCitySearch(p.city);
                if (citiesData.success) {
                  const selectedCity = citiesData.cities.find((c) => c.name === p.city);
                  if (selectedCity) {
                    setDeliveryCharge(Number(selectedCity.deliveryCharge));
                  }
                }
              }
            }
          }
        }
      } catch (err) {}
    };
    fetchData();
  }, [router]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal + deliveryCharge;

  const handleChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result);
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!storeOpen) {
      setToast("Sorry, we are currently closed. Orders are accepted from 6 PM to 1 AM (Nepal Time).");
      setTimeout(() => setToast(""), 4000);
      return;
    }

    setPlacing(true);

    if (paymentMethod === "online" && !paymentScreenshot) {
      setToast("Please upload your payment screenshot.");
      setTimeout(() => setToast(""), 3000);
      setPlacing(false);
      return;
    }

    try {
      let screenshotUrl = null;
      if ((paymentMethod === "online" || prePaymentEnabled) && paymentScreenshot) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: paymentScreenshot }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          setError(uploadData.message || "Failed to upload screenshot");
          setPlacing(false);
          return;
        }
        screenshotUrl = uploadData.url;
      }

      // Use authFetch if logged in, regular fetch for guests
      const fetchFn = getUser() ? authFetch : fetch;
      const res = await fetchFn("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state || null,
          shippingZip: shipping.zip || null,
          paymentMethod,
          paymentScreenshot: screenshotUrl,
          deliveryCharge,
          paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
        }),
      });

      const data = await res.json();

      if (data.success) {
        removeItemsFromCart(cart);
        clearCheckoutItems();
        if (getUser()) {
          router.push(`/orders/${data.orderId}`);
        } else {
          router.push(`/checkout/success?orderId=${data.orderId}`);
        }
      } else {
        setError(data.message || "Failed to place order");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in">
          {toast}
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/cart")}
            className="text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-zinc-900">Checkout</h1>
        </div>

        {/* Store closed warning */}
        {!storeOpen && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-4 mb-6 flex items-start gap-3">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-red-400 font-semibold">Store is currently closed</p>
              <p className="text-red-400/80 text-sm mt-1">We accept orders from 6:00 PM to 1:00 AM (Nepal Time). Please come back during operating hours to place your order.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-zinc-200 shadow-md">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Delivery Address
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-zinc-700">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={shipping.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium mb-2 text-zinc-700">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shipping.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium mb-2 text-zinc-700">
                Delivery Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={shipping.address}
                onChange={handleChange}
                required
                placeholder="e.g. Milanchowk, near XYZ"
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4 relative" ref={cityRef}>
              <label htmlFor="city" className="block text-sm font-medium mb-2 text-zinc-700">
                City *
              </label>
              {cities.length > 0 ? (
                <>
                  <input
                    type="text"
                    id="city"
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCitySearch(val);
                      setShowCityDropdown(true);
                      const match = cities.find((c) => c.name.toLowerCase() === val.toLowerCase());
                      if (match) {
                        setShipping({ ...shipping, city: match.name });
                        setDeliveryCharge(Number(match.deliveryCharge));
                      } else {
                        setShipping({ ...shipping, city: val });
                        setDeliveryCharge(defaultCharge);
                      }
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    autoComplete="off"
                    required
                    className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {showCityDropdown && (() => {
                    const filtered = cities.filter((c) =>
                      c.name.toLowerCase().includes(citySearch.toLowerCase())
                    );
                    if (filtered.length === 0) return null;
                    return (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filtered.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => {
                              setCitySearch(city.name);
                              setShipping({ ...shipping, city: city.name });
                              setDeliveryCharge(Number(city.deliveryCharge));
                              setShowCityDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 ${
                              shipping.city === city.name ? "bg-zinc-100 font-medium text-zinc-800" : "text-zinc-600"
                            }`}
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={shipping.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  value={shipping.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  value={shipping.zip}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Payment Method
            </h2>

            {prePaymentEnabled && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800 font-medium">
                  Pre-payment of {prePaymentPercent}% (रु {Math.ceil((grandTotal * prePaymentPercent) / 100)}) is required to place an order.
                </p>
              </div>
            )}

            <div className="flex gap-4 mb-4">
              {codEnabled && !prePaymentEnabled && (
                <label className={`flex-1 flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-300"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-zinc-800">Cash on Delivery</span>
                </label>
              )}
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors ${paymentMethod === "online" ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-300"}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="accent-indigo-600"
                />
                <span className="text-sm font-medium text-zinc-800">Online Payment</span>
              </label>
            </div>

            {(paymentMethod === "online" || prePaymentEnabled) && (
              <div className="mb-6">
                <div className="mb-4 p-4 bg-zinc-50 border border-zinc-200 rounded-md">
                  <p className="text-sm text-zinc-600 mb-3">Scan the QR code below to make payment:</p>
                  <img
                    src="/qr.jpg"
                    alt="Payment QR Code"
                    className="w-48 h-48 mx-auto object-contain border border-zinc-200 rounded-md"
                  />
                </div>
                <label className="block text-sm font-medium mb-2 text-zinc-700">
                  Upload Payment Screenshot *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
                {screenshotPreview && (
                  <img
                    src={screenshotPreview}
                    alt="Payment screenshot preview"
                    className="mt-3 w-full max-h-48 object-contain border border-zinc-200 rounded-md"
                  />
                )}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="paidAmount" className="block text-sm font-medium mb-2 text-zinc-700">
                Amount You Are Paying (रु)
              </label>
              <input
                type="number"
                id="paidAmount"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={prePaymentEnabled ? `Min रु ${Math.ceil((grandTotal * prePaymentPercent) / 100)}` : "Enter amount"}
                min="0"
                step="0.01"
                required={false}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {prePaymentEnabled && (
                <p className={`mt-1 text-xs ${paidAmount && Number(paidAmount) >= Math.ceil((grandTotal * prePaymentPercent) / 100) ? "text-emerald-600" : "text-amber-600"}`}>
                  Minimum required: रु {Math.ceil((grandTotal * prePaymentPercent) / 100)} ({prePaymentPercent}% of रु {grandTotal})
                </p>
              )}
              {paidAmount && Number(paidAmount) > 0 && (
                <p className="mt-1 text-xs text-zinc-400">
                  Remaining balance: रु {Math.max(0, grandTotal - Number(paidAmount))}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={placing || !storeOpen}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!storeOpen
                ? "Store Closed - Opens at 6 PM"
                : placing
                ? "Placing Order..."
                : "Place Order"}
            </button>
          </form>

          <div>
            <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-md">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                Order Summary
              </h2>
              <div className="divide-y divide-zinc-200">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-800 font-medium truncate">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-xs text-zinc-500">Qty: {item.quantity}</span>
                        {item.size && <span className="text-xs text-zinc-500">· {item.size}</span>}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-900 font-medium whitespace-nowrap shrink-0">
                      रु {(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-200 mt-4 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-zinc-800">रु {subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Delivery Charge</span>
                  <span className="text-zinc-800">रु {deliveryCharge}</span>
                </div>
              </div>
              <div className="border-t border-zinc-200 mt-3 pt-4 flex justify-between">
                <p className="text-lg font-bold text-zinc-900">Total</p>
                <p className="text-lg font-bold text-zinc-900">
                  रु {grandTotal}
                </p>
              </div>

              {/* Operating hours info */}
              <div className="mt-4 px-3 py-2.5 rounded-md bg-zinc-100 border border-zinc-200">
                <div className="flex items-center gap-2 justify-center">
                  <div className={`w-2 h-2 rounded-full ${storeOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                  <p className="text-xs text-zinc-500">
                    {storeOpen ? "Store is open" : "Store is closed"} &middot; Hours: <span className="text-zinc-800 font-medium">till 1 AM</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
