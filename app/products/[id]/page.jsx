"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart, getStockForSize } from "@/lib/cart";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ImageLightbox from "@/app/components/ImageLightbox";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);

          // Fetch related products from same category
          if (data.product.category) {
            try {
              const relRes = await fetch(`/api/products?category=${encodeURIComponent(data.product.category)}`);
              const relData = await relRes.json();
              if (relData.success) {
                setRelatedProducts(
                  relData.products
                    .filter((p) => p.id !== data.product.id)
                    .slice(0, 4)
                );
              }
            } catch {}
          }
        }
      } catch (err) {
        // Product will remain null
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  // Parse images from JSON string, fallback to imageUrl
  const getProductImages = () => {
    if (!product) return [];
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (product.imageUrl) return [product.imageUrl];
    return [];
  };

  const productImages = product ? getProductImages() : [];

  // Parse sizes JSON - for drinks these represent volume options (250ml, 500ml, 1L, etc.)
  const getSizesArray = () => {
    if (!product) return [];
    if (product.sizes) {
      try {
        const parsed = JSON.parse(product.sizes);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    // Fallback from legacy size + stock
    if (product.size) {
      return product.size.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ({ size: s, stock: Number(product.stock) || 0 }));
    }
    return [];
  };

  const sizesArray = product ? getSizesArray() : [];
  const hasSizes = sizesArray.length > 0 && sizesArray.some((s) => s.size !== "");

  const selectedSizeEntry = sizesArray.find((s) => s.size === selectedSize);

  const selectedStock = hasSizes
    ? (selectedSizeEntry?.stock ?? 0)
    : getStockForSize(product, null);

  // Check if different sizes have different prices
  const getSelectedPrice = () => {
    if (!product) return 0;
    if (hasSizes && selectedSizeEntry && selectedSizeEntry.price) {
      return Number(selectedSizeEntry.price);
    }
    return Number(product.price);
  };

  const displayPrice = product ? getSelectedPrice() : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, hasSizes ? selectedSize : null, quantity, null);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-zinc-500">Product not found.</p>
        </div>
      </div>
    );
  }

  const totalStock = sizesArray.length > 0
    ? sizesArray.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
    : Number(product.stock) || 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <button
          onClick={() => router.back()}
          className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800 mb-3 sm:mb-6 inline-block transition-colors"
        >
          &larr; Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <div>
            {productImages.length > 0 ? (
              <>
                {/* Desktop: thumbnails left + main image right */}
                <div className="hidden sm:flex gap-3">
                  {productImages.length > 1 && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {productImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setMainImageIndex(index)}
                          className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                            mainImageIndex === index
                              ? "border-indigo-500"
                              : "border-zinc-300 hover:border-zinc-400"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <img
                      src={productImages[mainImageIndex]}
                      alt={product.name}
                      onClick={() => setLightboxOpen(true)}
                      className="w-full max-h-[28rem] rounded-lg shadow-md object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                </div>

                {/* Mobile: compact image + thumbnails below */}
                <div className="sm:hidden">
                  <div className="w-1/2 mx-auto">
                    <img
                      src={productImages[mainImageIndex]}
                      alt={product.name}
                      onClick={() => setLightboxOpen(true)}
                      className="w-full max-h-78 rounded-lg shadow-md object-contain cursor-pointer"
                    />
                  </div>
                  {productImages.length > 1 && (
                    <div className="flex justify-center gap-2 mt-2.5">
                      {productImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setMainImageIndex(index)}
                          className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-colors ${
                            mainImageIndex === index
                              ? "border-indigo-500"
                              : "border-zinc-300"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="w-3/4 mx-auto sm:w-full aspect-square sm:aspect-auto sm:h-96 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200">
                <span className="text-zinc-500 text-sm">No image</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-zinc-900 mb-1 sm:mb-2">
              {product.name}
            </h1>
            {product.category && (
              <p className="text-xs sm:text-sm text-zinc-500 mb-2 sm:mb-4">{product.category}</p>
            )}
            <p className="text-xl sm:text-3xl font-bold text-zinc-900 mb-3 sm:mb-6">
              रु {displayPrice}
            </p>

            {product.description && (
              <div className="text-xs sm:text-sm text-zinc-600 mb-3 sm:mb-6 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            )}

            {/* Volume / Size selection */}
            {hasSizes && (
              <div className="mb-3 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-zinc-700 mb-1.5 sm:mb-2">
                  Volume / Size
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {sizesArray.filter((s) => s.size !== "").map((s) => {
                    const sizeStock = Number(s.stock) || 0;
                    const isOut = sizeStock === 0;
                    const sizePrice = s.price ? Number(s.price) : null;
                    return (
                      <button
                        key={s.size}
                        onClick={() => {
                          setSelectedSize(s.size);
                          setQuantity(1);
                        }}
                        disabled={isOut}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-md text-xs sm:text-sm font-medium transition-colors ${
                          selectedSize === s.size
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : isOut
                            ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed line-through"
                            : "bg-white text-zinc-800 border-zinc-300 hover:border-indigo-500"
                        }`}
                      >
                        {s.size}
                        {sizePrice && sizePrice !== Number(product.price) && (
                          <span className="ml-1 text-xs opacity-75">- रु {sizePrice}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-3 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-zinc-700 mb-1.5 sm:mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 sm:w-10 sm:h-10 border border-zinc-300 rounded-md text-zinc-800 hover:bg-zinc-100 text-sm sm:text-base transition-colors"
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val === "") return setQuantity(1);
                    const num = Math.max(1, Math.min(selectedStock, Number(val)));
                    setQuantity(num);
                  }}
                  className="w-10 sm:w-12 text-center text-sm sm:text-base text-zinc-800 font-medium border border-zinc-300 rounded-md py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => setQuantity(Math.min(selectedStock, quantity + 1))}
                  disabled={quantity >= selectedStock}
                  className="w-8 h-8 sm:w-10 sm:h-10 border border-zinc-300 rounded-md text-zinc-800 hover:bg-zinc-100 text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={selectedStock === 0 || (hasSizes && !selectedSize)}
              className="w-full px-4 py-2.5 sm:px-6 sm:py-3 bg-indigo-600 text-white rounded-md text-sm sm:text-base font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {totalStock === 0
                ? "Out of Stock"
                : hasSizes && !selectedSize
                ? "Select a Size"
                : selectedStock === 0
                ? "Out of Stock"
                : added
                ? "Added to Cart!"
                : "Add to Cart"}
            </button>

            <p className="text-[10px] sm:text-xs text-zinc-500 mt-2 sm:mt-3">
              {hasSizes && selectedSize
                ? `${selectedStock} in stock for ${selectedSize}`
                : totalStock > 0
                ? `${totalStock} total in stock`
                : "Currently unavailable"}
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-8 border-t border-zinc-200 mt-4 sm:mt-8">
          <h2 className="text-base sm:text-xl font-bold text-zinc-800 mb-3 sm:mb-6">Related Drinks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((rp) => {
              let firstImage = null;
              if (rp.images) {
                try {
                  const parsed = JSON.parse(rp.images);
                  if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
                } catch {}
              }
              if (!firstImage && rp.imageUrl) firstImage = rp.imageUrl;

              return (
                <Link
                  key={rp.id}
                  href={`/products/${rp.id}`}
                  className="group"
                >
                  <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={rp.name}
                        className="w-full h-32 sm:h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 sm:h-48 bg-zinc-100 flex items-center justify-center">
                        <span className="text-zinc-500 text-xs sm:text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-800">{rp.name}</h3>
                    <p className="text-sm sm:text-lg font-bold text-zinc-800 mt-0.5 sm:mt-1">
                      रु {Number(rp.price)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && productImages.length > 0 && (
        <ImageLightbox
          images={productImages}
          initialIndex={mainImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
      <Footer />
    </div>
  );
}
