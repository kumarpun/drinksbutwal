"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUser, refreshTokens, authFetch } from "@/lib/auth-client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ImageLightbox from "@/app/components/ImageLightbox";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-orange-100 text-orange-700",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [markingReceived, setMarkingReceived] = useState(false);
  const [returnImageData, setReturnImageData] = useState(null);
  const [returnImagePreview, setReturnImagePreview] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [notifyingPayment, setNotifyingPayment] = useState(false);
  const [paymentScreenshotData, setPaymentScreenshotData] = useState(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState("");

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

    const fetchOrder = async () => {
      try {
        const res = await authFetch(`/api/orders/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
          setItems(data.items);
        }
      } catch (err) {
        // Order will remain null
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [authLoading, params.id]);

  const handleReturnImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReturnImageData(reader.result);
      setReturnImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) return;
    setSubmittingReturn(true);
    try {
      let returnImage = null;
      if (returnImageData) {
        const uploadRes = await authFetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: returnImageData }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          returnImage = uploadData.url;
        }
      }

      const res = await authFetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnReason, returnImage }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, status: "returned", returnReason, returnImage });
        setShowReturnForm(false);
        setReturnReason("");
        setReturnImageData(null);
        setReturnImagePreview("");
      } else {
        alert(data.message || "Failed to submit return request");
      }
    } catch (err) {
      alert("Failed to submit return request");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const res = await authFetch(`/api/orders/${params.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/orders");
      } else {
        alert(data.message || "Failed to cancel order");
      }
    } catch (err) {
      alert("Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleReceived = async () => {
    setMarkingReceived(true);
    try {
      const res = await authFetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "received" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, status: "received", receivedAt: new Date().toISOString() });
      } else {
        alert(data.message || "Failed to mark as received");
      }
    } catch (err) {
      alert("Failed to mark as received");
    } finally {
      setMarkingReceived(false);
    }
  };

  const handlePaymentScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshotData(reader.result);
      setPaymentScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleNotifyFullPayment = async () => {
    if (!paymentScreenshotData) {
      alert("Please upload a payment screenshot");
      return;
    }
    setNotifyingPayment(true);
    try {
      const uploadRes = await authFetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: paymentScreenshotData }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        alert("Failed to upload screenshot");
        return;
      }

      const res = await authFetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notifyFullPayment", paymentScreenshot: uploadData.url }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, fullPaymentNotified: 1, fullPaymentScreenshot: uploadData.url });
        setPaymentScreenshotData(null);
        setPaymentScreenshotPreview("");
      } else {
        alert(data.message || "Failed to notify");
      }
    } catch (err) {
      alert("Failed to notify");
    } finally {
      setNotifyingPayment(false);
    }
  };

  const canRequestReturn = order && (
    order.status === "delivered" ||
    (order.status === "received" && order.receivedAt &&
      (Date.now() - new Date(order.receivedAt).getTime()) < 24 * 60 * 60 * 1000)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Order not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/orders"
          className="text-sm text-zinc-500 hover:text-zinc-800 mb-6 inline-block transition-colors"
        >
          &larr; Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-800">
            Order #{order.id}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                statusColors[order.status] || ""
              }`}
            >
              {order.status}
            </span>
            {order.status === "pending" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
            {order.status === "delivered" && (
              <button
                onClick={handleReceived}
                disabled={markingReceived}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {markingReceived ? "Updating..." : "Mark as Received"}
              </button>
            )}
            {canRequestReturn && !showReturnForm && (
              <button
                onClick={() => setShowReturnForm(true)}
                className="px-4 py-2 border border-orange-500 text-orange-500 rounded-md text-sm font-medium hover:bg-orange-50 transition-colors"
              >
                Request Return
              </button>
            )}
          </div>
        </div>

        {showReturnForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">
              Return Request
            </h2>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={3}
              placeholder="Describe the reason for return (e.g. wrong item, damaged product)..."
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 mb-4"
            />
            <div className="mb-4">
              <label className="block text-sm text-zinc-600 mb-1">
                Upload Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleReturnImageChange}
                className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
              />
              {returnImagePreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={returnImagePreview}
                    alt="Return preview"
                    className="w-32 h-32 object-cover rounded-md border border-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={() => { setReturnImageData(null); setReturnImagePreview(""); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    x
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReturn}
                disabled={submittingReturn || !returnReason.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {submittingReturn ? "Submitting..." : "Submit Return"}
              </button>
              <button
                onClick={() => { setShowReturnForm(false); setReturnReason(""); }}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {order.cancellationReason && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
            <h2 className="text-sm font-semibold text-red-800 mb-2">
              Cancellation Reason
            </h2>
            <p className="text-sm text-red-700">{order.cancellationReason}</p>
          </div>
        )}

        {order.returnReason && (
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg mb-6">
            <h2 className="text-sm font-semibold text-orange-800 mb-2">
              Return Reason
            </h2>
            <p className="text-sm text-orange-700">{order.returnReason}</p>
            {order.returnImage && (
              <img
                src={order.returnImage}
                alt="Return evidence"
                onClick={() => setLightboxImage(order.returnImage)}
                className="mt-3 w-32 h-32 object-cover rounded-md border border-orange-200 cursor-pointer hover:opacity-80 transition-opacity"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">
              Order Info
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-zinc-500">Date:</span>{" "}
                <span className="text-zinc-800">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </p>
              {Number(order.deliveryCharge || 0) > 0 && (
                <>
                  <p>
                    <span className="text-zinc-500">Subtotal:</span>{" "}
                    <span className="text-zinc-800">
                      Rs {(Number(order.total) - Number(order.deliveryCharge))}
                    </span>
                  </p>
                  <p>
                    <span className="text-zinc-500">Delivery:</span>{" "}
                    <span className="text-zinc-800">
                      Rs {Number(order.deliveryCharge)}
                    </span>
                  </p>
                </>
              )}
              <p>
                <span className="text-zinc-500">Total:</span>{" "}
                <span className="text-zinc-800 font-semibold">
                  Rs {Number(order.total)}
                </span>
              </p>
              <p>
                <span className="text-zinc-500">Payment:</span>{" "}
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${order.paymentMethod === "online" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-700"}`}>
                  {order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
                </span>
              </p>
              {Number(order.paidAmount || 0) > 0 && (
                <>
                  {order.paymentStatus === "pre_confirmed" || order.paymentStatus === "full_confirmed" ? (
                    <>
                      <p>
                        <span className="text-zinc-500">Paid:</span>{" "}
                        <span className="text-green-700 font-semibold">Rs {Number(order.paidAmount)}</span>
                      </p>
                      <p>
                        <span className="text-zinc-500">Remaining:</span>{" "}
                        <span className="text-red-600 font-semibold">
                          Rs {Math.max(0, Number(order.total) - Number(order.paidAmount))}
                        </span>
                      </p>
                      <p>
                        <span className="text-zinc-500">Payment:</span>{" "}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === "full_confirmed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {order.paymentStatus === "full_confirmed" ? "Full Payment Confirmed" : "Pre-Payment Confirmed"}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p>
                      <span className="text-zinc-500">Payment:</span>{" "}
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        In Review
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
            {order.paymentStatus !== "full_confirmed" && (
              <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-md">
                <p className="text-sm text-zinc-600 mb-3">Scan the QR code below to make payment:</p>
                <img
                  src="/qr.jpg"
                  alt="Payment QR Code"
                  className="w-48 h-48 mx-auto object-contain border border-zinc-200 rounded-md"
                />
                {order.fullPaymentNotified ? (
                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <span className="text-zinc-500">Paid:</span>{" "}
                      <span className="text-green-700 font-semibold">Rs {Number(order.total)}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500">Full Payment:</span>{" "}
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        In Review
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2 text-zinc-700">
                      Upload Payment Screenshot *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentScreenshotChange}
                      className="w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                    />
                    {paymentScreenshotPreview && (
                      <img
                        src={paymentScreenshotPreview}
                        alt="Payment screenshot preview"
                        className="mt-3 w-full max-h-48 object-contain border border-zinc-200 rounded-md"
                      />
                    )}
                    <button
                      onClick={handleNotifyFullPayment}
                      disabled={notifyingPayment || !paymentScreenshotData}
                      className="mt-3 w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {notifyingPayment ? "Submitting..." : "Submit Full Payment"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-sm font-semibold text-zinc-800 mb-3">
              Delivery Address
            </h2>
            <div className="text-sm text-zinc-800 space-y-1">
              <p>{order.shippingName}</p>
              <p className="text-zinc-500">{order.shippingPhone}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ""}{order.shippingZip ? ` ${order.shippingZip}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-sm font-semibold text-zinc-800 p-6 pb-0">
            Items
          </h2>
          <table className="w-full mt-4">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 text-sm font-medium">
                <th className="text-left px-6 py-3">Product</th>
                <th className="text-left px-6 py-3">Price</th>
                <th className="text-left px-6 py-3">Qty</th>
                <th className="text-right px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  <td className="px-6 py-4 text-sm text-zinc-800">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-800">
                    Rs {Number(item.price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-800">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-800 text-right">
                    Rs {(Number(item.price) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {lightboxImage && (
        <ImageLightbox
          images={[lightboxImage]}
          initialIndex={0}
          onClose={() => setLightboxImage(null)}
        />
      )}
      <Footer />
    </div>
  );
}
