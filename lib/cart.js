// Client-side cart utilities (localStorage)

function getCartKey() {
  if (typeof window === "undefined") return "drinksbutwal-cart-guest";
  try {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed?.id) return `drinksbutwal-cart-${parsed.id}`;
    }
  } catch {}
  return "drinksbutwal-cart-guest";
}

export function getCart() {
  if (typeof window === "undefined") return [];
  const cart = localStorage.getItem(getCartKey());
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
}

export function getStockForSize(product, size) {
  if (!product) return 0;
  let sizesArr = [];
  if (product.sizes) {
    try {
      sizesArr = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
    } catch {}
  }
  if (Array.isArray(sizesArr) && sizesArr.length > 0) {
    const entry = sizesArr.find((s) => s.size === (size || ""));
    return entry ? Number(entry.stock) || 0 : 0;
  }
  return Number(product.stock) || 0;
}

export function addToCart(product, size = null, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(
    (item) => item.productId === product.id && item.size === size
  );

  const stock = size ? getStockForSize(product, size) : Number(product.stock) || 0;

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, stock);
    existing.stock = stock;
  } else {
    // Get first image from images JSON array
    let imageUrl = null;
    if (product.images) {
      try {
        const parsed = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
      } catch {}
    }

    cart.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl,
      size,
      quantity: Math.min(quantity, stock),
      stock,
    });
  }

  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function removeFromCart(productId, size = null) {
  const cart = getCart().filter(
    (item) => !(item.productId === productId && item.size === size)
  );
  saveCart(cart);
  window.dispatchEvent(new Event("cart-updated"));
}

export function updateCartItemQuantity(productId, size, quantity) {
  const cart = getCart();
  const item = cart.find(
    (item) => item.productId === productId && item.size === size
  );
  if (item) {
    item.quantity = Math.max(1, Math.min(quantity, item.stock || Infinity));
    saveCart(cart);
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function clearCart() {
  localStorage.removeItem(getCartKey());
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount() {
  return getCart().length;
}

// Store selected items for checkout
export function setCheckoutItems(items) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("drinksbutwal-checkout-items", JSON.stringify(items));
}

export function getCheckoutItems() {
  if (typeof window === "undefined") return [];
  const items = sessionStorage.getItem("drinksbutwal-checkout-items");
  return items ? JSON.parse(items) : [];
}

export function clearCheckoutItems() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("drinksbutwal-checkout-items");
}

// Remove specific items from cart (by productId + size)
export function removeItemsFromCart(itemsToRemove) {
  const cart = getCart();
  const updated = cart.filter(
    (item) =>
      !itemsToRemove.some(
        (r) =>
          r.productId === item.productId &&
          r.size === item.size
      )
  );
  saveCart(updated);
  window.dispatchEvent(new Event("cart-updated"));
}

// Merge guest cart into the logged-in user's cart
export function mergeGuestCart() {
  if (typeof window === "undefined") return;
  const guestKey = "drinksbutwal-cart-guest";
  const guestCart = localStorage.getItem(guestKey);
  if (!guestCart) return;

  let guestItems;
  try { guestItems = JSON.parse(guestCart); } catch { return; }
  if (!Array.isArray(guestItems) || guestItems.length === 0) return;

  const userCart = getCart();

  for (const guestItem of guestItems) {
    const existing = userCart.find(
      (item) => item.productId === guestItem.productId && item.size === guestItem.size
    );
    if (existing) {
      existing.quantity = Math.min(
        existing.quantity + guestItem.quantity,
        existing.stock || Infinity
      );
    } else {
      userCart.push(guestItem);
    }
  }

  saveCart(userCart);
  localStorage.removeItem(guestKey);
  window.dispatchEvent(new Event("cart-updated"));
}
