"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth-client";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  returned: "bg-orange-100 text-orange-700",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [updatingPaidAmount, setUpdatingPaidAmount] = useState(false);
  const [message, setMessage] = useState("");
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await authFetch(`/api/admin/orders/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
          setItems(data.items);
          setStatus(data.order.status);
          setEditPaidAmount(String(Number(data.order.paidAmount || 0)));
        }
      } catch (err) {
        // Order will remain null
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    setMessage("");

    try {
      const res = await authFetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "cancelled" ? { cancellationReason: cancelReason } : {}),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOrder({
          ...order,
          status,
          cancellationReason: status === "cancelled" ? cancelReason : null,
        });
        setCancelReason("");
        setMessage("Status updated successfully");
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this order? Stock will be restored.")) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/orders/${params.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/orders");
      } else {
        alert(data.message || "Failed to delete order");
      }
    } catch (err) {
      alert("Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  const handlePaymentConfirm = async (paymentStatus) => {
    setConfirmingPayment(true);
    try {
      const res = await authFetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...order, paymentStatus };
        if (paymentStatus === "full_confirmed") {
          updated.paidAmount = Number(order.total);
          setEditPaidAmount(String(Number(order.total)));
          await authFetch(`/api/admin/orders/${params.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paidAmount: Number(order.total) }),
          });
        }
        setOrder(updated);
      } else {
        alert(data.message || "Failed to update payment status");
      }
    } catch (err) {
      alert("Failed to update payment status");
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handlePaidAmountUpdate = async () => {
    const amount = parseFloat(editPaidAmount);
    if (isNaN(amount) || amount < 0) return;
    setUpdatingPaidAmount(true);
    try {
      const res = await authFetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: amount }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder({ ...order, paidAmount: amount });
      }
    } catch (err) {
      // keep current
    } finally {
      setUpdatingPaidAmount(false);
    }
  };

  if (loading) return <p className="text-zinc-500">Loading order...</p>;
  if (!order) return <p className="text-zinc-500">Order not found.</p>;

  return (
    <div>
      {viewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewImage(null)}
        >
          <button
            onClick={() => setViewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={viewImage}
            alt="Screenshot"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-zinc-800">
          Order #{order.id}
        </h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          {deleting ? "Deleting..." : "Delete Order"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            Order Info
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-zinc-500">Customer:</span>{" "}
              <span className="text-zinc-800">{order.userName || order.shippingName || "Guest"}</span>
            </p>
            <p>
              <span className="text-zinc-500">Email:</span>{" "}
              <span className="text-zinc-800 break-all">{order.userEmail || "N/A"}</span>
            </p>
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
                    रु {(Number(order.total) - Number(order.deliveryCharge))}
                  </span>
                </p>
                <p>
                  <span className="text-zinc-500">Delivery:</span>{" "}
                  <span className="text-zinc-800">
                    रु {Number(order.deliveryCharge)}
                  </span>
                </p>
              </>
            )}
            <p>
              <span className="text-zinc-500">Total:</span>{" "}
              <span className="text-zinc-800 font-semibold">
                रु {Number(order.total)}
              </span>
            </p>
            <p>
              <span className="text-zinc-500">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs capitalize ${
                  statusColors[order.status] || ""
                }`}
              >
                {order.status}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            Shipping Address
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

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">
          Update Status
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={updating || (status === "cancelled" && !cancelReason.trim())}
            className="px-4 py-2 bg-zinc-700 text-white rounded-md text-sm font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            {updating ? "Updating..." : "Update"}
          </button>
          {message && (
            <span className="text-sm text-green-700">{message}</span>
          )}
        </div>
        {status === "cancelled" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Cancellation Reason *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for cancellation..."
              className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        )}
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">
          Payment Info
        </h2>
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-zinc-500">Method:</span>{" "}
            <span className={`px-2 py-1 rounded-full text-xs capitalize ${order.paymentMethod === "online" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-700"}`}>
              {order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
            </span>
          </p>
          <div className="pt-1">
            <label className="text-zinc-500 text-sm block mb-1">Amount Paid (रु):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editPaidAmount}
                onChange={(e) => setEditPaidAmount(e.target.value)}
                min="0"
                step="0.01"
                className="w-36 px-3 py-1.5 border border-zinc-300 rounded-md bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <button
                onClick={handlePaidAmountUpdate}
                disabled={updatingPaidAmount || Number(editPaidAmount) === Number(order.paidAmount || 0)}
                className="px-3 py-1.5 bg-zinc-700 text-white rounded-md text-xs font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                {updatingPaidAmount ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
          {Number(order.paidAmount || 0) > 0 && (
            <p>
              <span className="text-zinc-500">Remaining:</span>{" "}
              <span className="text-red-600 font-semibold">
                रु {Math.max(0, Number(order.total) - Number(order.paidAmount))}
              </span>
            </p>
          )}
          <p>
            <span className="text-zinc-500">Payment Status:</span>{" "}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              order.paymentStatus === "full_confirmed" ? "bg-green-100 text-green-700" :
              order.paymentStatus === "pre_confirmed" ? "bg-blue-100 text-blue-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {order.paymentStatus === "full_confirmed" ? "Full Payment Confirmed" :
               order.paymentStatus === "pre_confirmed" ? "Pre-Payment Confirmed" :
               "In Review"}
            </span>
          </p>

          {order.fullPaymentNotified === 1 && order.paymentStatus !== "full_confirmed" && (
            <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm font-medium text-green-700">Customer has notified full payment completion</span>
            </div>
          )}

          {/* Confirm payment buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {order.paymentStatus !== "pre_confirmed" && order.paymentStatus !== "full_confirmed" && (
              <button
                onClick={() => handlePaymentConfirm("pre_confirmed")}
                disabled={confirmingPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {confirmingPayment ? "Updating..." : "Confirm Pre-Payment"}
              </button>
            )}
            {order.paymentStatus !== "full_confirmed" && (
              <button
                onClick={() => handlePaymentConfirm("full_confirmed")}
                disabled={confirmingPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {confirmingPayment ? "Updating..." : "Confirm Full Payment"}
              </button>
            )}
            {order.paymentStatus !== "review" && (
              <button
                onClick={() => handlePaymentConfirm("review")}
                disabled={confirmingPayment}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md text-xs font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {confirmingPayment ? "Updating..." : "Reset to Review"}
              </button>
            )}
          </div>
          {(order.paymentScreenshot || order.fullPaymentScreenshot) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {order.paymentScreenshot && (
                <div>
                  <p className="text-zinc-500 mb-2">Pre-Payment Screenshot:</p>
                  <img
                    src={order.paymentScreenshot}
                    alt="Pre-payment screenshot"
                    className="w-full max-h-72 object-contain border border-zinc-200 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setViewImage(order.paymentScreenshot)}
                  />
                </div>
              )}
              {order.fullPaymentScreenshot && (
                <div>
                  <p className="text-zinc-500 mb-2">Full Payment Screenshot:</p>
                  <img
                    src={order.fullPaymentScreenshot}
                    alt="Full payment screenshot"
                    className="w-full max-h-72 object-contain border border-zinc-200 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setViewImage(order.fullPaymentScreenshot)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {order.cancellationReason && (
        <div className="bg-red-50 border border-red-200 p-4 sm:p-6 rounded-lg mb-6">
          <h2 className="text-sm font-semibold text-red-800 mb-2">
            Cancellation Reason
          </h2>
          <p className="text-sm text-red-700">{order.cancellationReason}</p>
        </div>
      )}

      {order.returnReason && (
        <div className="bg-orange-50 border border-orange-200 p-4 sm:p-6 rounded-lg mb-6">
          <h2 className="text-sm font-semibold text-orange-800 mb-2">
            Return Reason
          </h2>
          <p className="text-sm text-orange-700">{order.returnReason}</p>
          {order.returnImage && (
            <img
              src={order.returnImage}
              alt="Return evidence"
              className="mt-3 max-w-full sm:max-w-md max-h-96 object-contain border border-orange-200 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setViewImage(order.returnImage)}
            />
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-lg font-semibold text-zinc-800 p-4 sm:p-6 pb-0">
          Order Items
        </h2>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full mt-4">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 text-sm font-medium">
                <th className="text-left px-6 py-3">Product</th>
                <th className="text-left px-6 py-3">Size</th>
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
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {item.size || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-800">
                    रु {Number(item.price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-800">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-800 text-right">
                    रु {(Number(item.price) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden p-4 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-zinc-800">{item.productName}</p>
              <div className="flex items-center justify-between mt-1 text-sm">
                <div className="text-zinc-500">
                  {item.size && <span>Size: {item.size} &middot; </span>}
                  <span>Qty: {item.quantity}</span>
                </div>
                <span className="text-zinc-800 font-medium">
                  रु {(Number(item.price) * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
