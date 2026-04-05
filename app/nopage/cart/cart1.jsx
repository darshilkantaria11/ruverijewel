"use client";
export const dynamic = "force-dynamic";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { XMarkIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Checkout from "../checkout/checkout";

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
  </div>
);

export default function CartPage() {
  const cartContext = useCart();

  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCheckoutPopup, setShowCheckoutPopup] = useState(false);

  const cart = cartContext?.cart || {};
  const updateQuantity = cartContext?.updateQuantity;
  const getTotalItems = cartContext?.getTotalItems;

  const cartItems = Object.values(cart);

  // ── Fetch all cart products with selected currency ──────────────────────
  const fetchProducts = async () => {
    if (!cartItems.length) { setLoading(false); return; }
    try {
      const currency = localStorage.getItem("currency") || "INR";
      const productData = {};
      for (const item of cartItems) {
        const res = await fetch(`/api/products/fetch/${item.id}?currency=${currency}`, {
          headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
        });
        const data = await res.json();
        productData[item.id] = data;
      }
      setProducts(productData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [cart]);

  // Re-fetch when currency changes from navbar
  useEffect(() => {
    const handler = () => fetchProducts();
    window.addEventListener("currencyChange", handler);
    return () => window.removeEventListener("currencyChange", handler);
  }, [cart]);

  if (!cartContext) return null;

  // ── Currency from fetched product data ──────────────────────────────────
  // Use the first loaded product's currency info as the cart-wide currency
  const firstProduct = Object.values(products)[0];
  const currencySymbol = firstProduct?.currencySymbol || "₹";
  const currencyCode = firstProduct?.currencyCode || "INR";

  // ── Subtotal using CONVERTED prices from API, not stored INR cart prices ─
  const subtotal = cartItems.reduce((sum, item) => {
    const convertedPrice = products[item.id]?.totalPrice ?? item.price;
    return sum + convertedPrice * item.quantity;
  }, 0);

  const formattedSubtotal = currencyCode === "INR"
    ? Math.ceil(subtotal).toLocaleString()
    : (Math.round(subtotal * 100) / 100).toLocaleString();

  if (cartItems.length === 0) {
    return (
      <div className="ci min-h-screen bg-back flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-black/90 transition-all font-medium text-sm"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="ci min-h-screen bg-back py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-4xl font-bold text-gray-800 mb-6"
          >
            Shopping Cart ({getTotalItems()})
          </motion.h1>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Cart Items ── */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const productData = products[item.id];
                const sym = productData?.currencySymbol || "₹";
                const code = productData?.currencyCode || "INR";
                const unitPrice = productData?.totalPrice ?? item.price;
                const lineTotal = unitPrice * item.quantity;
                const formattedLineTotal = code === "INR"
                  ? Math.ceil(lineTotal).toLocaleString()
                  : (Math.round(lineTotal * 100) / 100).toLocaleString();

                return (
                  <div key={item.id} className="relative bg-white rounded-xl shadow-sm p-4">
                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="absolute top-2 right-2 text-red-700 bg-white rounded-full p-1 hidden md:block"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>

                    {/* ── Mobile Layout ── */}
                    <div className="block sm:hidden">
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        {productData?.img1 ? (
                          <img
                            src={productData.img1}
                            alt={productData?.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Skeleton className="w-full h-full" />
                        )}
                        <button
                          onClick={() => updateQuantity(item.id, 0)}
                          className="absolute top-2 right-2 text-red-700 bg-white rounded-full p-1 md:hidden"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-4">
                        {productData?.productName ? (
                          <h3 className="text-lg font-semibold text-gray-800">
                            {productData.productName}
                          </h3>
                        ) : (
                          <Skeleton className="h-6 w-3/4 mb-2" />
                        )}

                        {/* Size */}
                        {item.size && (
                          <p className="text-gray-500 text-sm mt-1">
                            Size: <span className="font-medium text-gray-700">{item.size}</span>
                          </p>
                        )}

                        {item.selectedChain && (
                          <>
                            <p className="text-gray-500 text-sm mt-1">Chain:</p>
                            <img src={item.selectedChain} alt="Selected Chain" className="w-24 h-20 object-cover" />
                          </>
                        )}

                        <div className="mt-4 flex justify-between items-center">
                          {loading ? (
                            <Skeleton className="h-6 w-20" />
                          ) : (
                            <div>
                              <p className="text-xl font-bold text-black">
                                {sym}{formattedLineTotal}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-400">
                                  {sym}{(code === "INR" ? Math.ceil(unitPrice) : Math.round(unitPrice * 100) / 100).toLocaleString()} each
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 border-2 border-black rounded-lg px-2">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-black">
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="text-lg font-medium w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-black">
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Desktop Layout ── */}
                    <div className="hidden sm:flex gap-4">
                      <div className="relative flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                        {productData?.img1 ? (
                          <img
                            src={productData.img1}
                            alt={productData?.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Skeleton className="w-full h-full" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-8">
                            {productData?.productName ? (
                              <h3 className="text-lg font-semibold text-gray-800">
                                {productData.productName}
                              </h3>
                            ) : (
                              <Skeleton className="h-6 w-64 mb-2" />
                            )}

                            {/* Metal & Purity */}
                            {productData?.metal && (
                              <p className="text-xs text-gray-500 mt-1 capitalize">
                                {productData.metal} · {productData.purity}
                              </p>
                            )}

                            {/* Size */}
                            {item.size && (
                              <p className="text-sm text-gray-500 mt-1">
                                Size: <span className="font-medium text-gray-700">{item.size}</span>
                              </p>
                            )}

                            {item.selectedChain && (
                              <>
                                <p className="text-gray-500 text-sm mt-1">Chain:</p>
                                <img src={item.selectedChain} alt="Selected Chain" className="w-24 h-20 object-cover" />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          {loading ? (
                            <Skeleton className="h-6 w-20" />
                          ) : (
                            <div>
                              <p className="text-xl font-bold text-black">
                                {sym}{formattedLineTotal}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-400">
                                  {sym}{(code === "INR" ? Math.ceil(unitPrice) : Math.round(unitPrice * 100) / 100).toLocaleString()} each
                                </p>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-3 border-2 border-black rounded-lg px-3">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-black">
                              <MinusIcon className="h-5 w-5" />
                            </button>
                            <span className="text-lg font-medium w-8 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-black">
                              <PlusIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Order Summary ── */}
            <div className="bg-white rounded-xl shadow-sm p-4 lg:sticky lg:top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

              {/* Per-item breakdown */}
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => {
                  const productData = products[item.id];
                  const sym = productData?.currencySymbol || "₹";
                  const code = productData?.currencyCode || "INR";
                  const unitPrice = productData?.totalPrice ?? item.price;
                  const lineTotal = unitPrice * item.quantity;
                  const formatted = code === "INR"
                    ? Math.ceil(lineTotal).toLocaleString()
                    : (Math.round(lineTotal * 100) / 100).toLocaleString();

                  return (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span className="flex-1 pr-2 truncate">
                        {productData?.productName || item.productName}
                        {item.quantity > 1 && (
                          <span className="text-gray-400 ml-1">×{item.quantity}</span>
                        )}
                        {item.size && (
                          <span className="text-gray-400 ml-1 text-xs">(Size {item.size})</span>
                        )}
                      </span>
                      <span className="font-medium shrink-0">
                        {loading ? "..." : `${sym}${formatted}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Estimated Total</span>
                    <span>
                      {loading
                        ? "..."
                        : `${currencySymbol}${formattedSubtotal}`
                      }
                    </span>
                  </div>
                  {currencyCode !== "INR" && (
                    <p className="text-xs text-blue-600 mt-1">
                      Displayed in {currencyCode} · Checkout processed in INR
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Taxes, discounts, and shipping calculated at checkout
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  localStorage.removeItem("hasRedirected");
                  setShowCheckoutPopup(true);
                }}
                className="w-full bg-black text-white py-3 rounded-lg mt-6 hover:bg-black transition-colors flex items-center justify-center gap-3 font-semibold text-lg tracking-wide"
              >
                Checkout
                <div className="relative flex items-center">
                  <img src="/paytm.svg" alt="Paytm" className="w-6 h-6 bg-white rounded-full p-0 border shadow-sm z-30 relative" />
                  <img src="/phonepe.svg" alt="PhonePe" className="w-6 h-6 bg-white rounded-full p-0 border shadow-sm -ml-2 z-20 relative" />
                  <img src="/gpay.svg" alt="Google Pay" className="w-6 h-6 bg-white rounded-full p-0 border shadow-sm -ml-2 z-10 relative" />
                </div>
              </motion.button>

              <p className="text-center text-xs text-gray-500 mt-3">Secure checkout process</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/shop" className="text-black hover:text-black/80 font-medium text-sm">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Checkout Popup */}
      {showCheckoutPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-2">
          <div className="bg-white w-full max-w-xl md:rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto md:w-[90%] sm:max-w-md sm:mx-auto sm:my-8 sm:p-6 sm:rounded-lg shadow-xl">
            <button
              onClick={() => setShowCheckoutPopup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold">Checkout</h2>
            <Checkout />
          </div>
        </div>
      )}
    </>
  );
}