import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-400">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">DrinksButwal</h3>
            <p className="text-sm leading-relaxed mb-3">
              Late-night drinks delivered to your doorstep in Butwal. Your favourite beverages, available when you need them most.
            </p>
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-zinc-800 rounded-md w-fit">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-white">Open Daily till 1 AM</span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Quick Links</h4>
            <nav className="space-y-2">
              <Link href="/" className="block text-sm hover:text-white transition-colors">Home</Link>
              <Link href="/shop" className="block text-sm hover:text-white transition-colors">Shop</Link>
              <Link href="/cart" className="block text-sm hover:text-white transition-colors">Cart</Link>
              <Link href="/orders" className="block text-sm hover:text-white transition-colors">Orders</Link>
            </nav>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Customer Service</h4>
            <nav className="space-y-2">
              <Link href="/profile" className="block text-sm hover:text-white transition-colors">My Account</Link>
              <span className="block text-sm">Delivery Policy</span>
              <span className="block text-sm">Privacy Policy</span>
              <span className="block text-sm">Terms & Conditions</span>
            </nav>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Contact Us</h4>
            <div className="space-y-2 text-sm">
              <p>drinksbutwal@gmail.com</p>
              <p>+977 9800000000</p>
              <p>Butwal, Nepal</p>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} DrinksButwal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
