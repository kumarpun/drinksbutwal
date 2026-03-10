"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await authFetch("/api/admin/products");
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      // Products will remain empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      const res = await authFetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const getSizeVariants = (product) => {
    if (!product.sizes) return "-";
    try {
      const sizes = JSON.parse(product.sizes);
      return sizes.map((s) => s.size).filter(Boolean).join(", ") || "-";
    } catch {
      return "-";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-800">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-zinc-700 text-white rounded-md text-sm font-medium hover:bg-zinc-600 transition-colors"
        >
          Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-zinc-500">No products yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 text-sm font-medium">
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-left px-6 py-3">Category</th>
                  <th className="text-left px-6 py-3">Price</th>
                  <th className="text-left px-6 py-3">Sizes</th>
                  <th className="text-left px-6 py-3">Stock</th>
                  <th className="text-left px-6 py-3">Active</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-800">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {product.category || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-800">
                      रु {Number(product.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {getSizeVariants(product)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-800">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-zinc-600 hover:text-zinc-800 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{product.name}</p>
                    <p className="text-xs text-zinc-500">{product.category || "No category"}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      product.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-800 mb-1">
                  <span className="font-medium">रु {Number(product.price)}</span>
                  <span className="text-zinc-500">Stock: {product.stock}</span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">Sizes: {getSizeVariants(product)}</p>
                <div className="flex gap-4 text-sm">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-zinc-600 hover:text-zinc-800 font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
