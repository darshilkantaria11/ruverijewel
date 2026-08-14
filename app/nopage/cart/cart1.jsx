"use client";
export const dynamic = "force-dynamic";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { XMarkIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

/* ---------- DISCOUNT CONFIG (same as product detail page) ---------- */
const DISCOUNT_PERCENT = 15;
const getDiscountedPrice = (price) => Math.round((Number(price) || 0) * (1 - DISCOUNT_PERCENT / 100));

/* ---------- WhatsApp number (same as product detail page) ---------- */
const WHATSAPP_NUMBER = "916353974557";

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
  </div>
);

export default function CartPage() {
  const cartContext = useCart();

  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

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
  const firstProduct = Object.values(products)[0];
  const currencySymbol = firstProduct?.currencySymbol || "₹";
  const currencyCode = firstProduct?.currencyCode || "INR";

  // ── Helper: format a price consistently with currency rules ─────────────
  const formatPrice = (amount, code) =>
    code === "INR"
      ? Math.ceil(amount).toLocaleString()
      : (Math.round(amount * 100) / 100).toLocaleString();

  // ── Original (pre-discount) subtotal, using CONVERTED prices from API ───
  const originalSubtotal = cartItems.reduce((sum, item) => {
    const convertedPrice = products[item.id]?.totalPrice ?? item.price;
    return sum + convertedPrice * item.quantity;
  }, 0);

  // ── Discounted subtotal (what the customer actually pays) ───────────────
  const discountedSubtotal = cartItems.reduce((sum, item) => {
    const convertedPrice = products[item.id]?.totalPrice ?? item.price;
    return sum + getDiscountedPrice(convertedPrice) * item.quantity;
  }, 0);

  const formattedOriginalSubtotal = formatPrice(originalSubtotal, currencyCode);
  const formattedDiscountedSubtotal = formatPrice(discountedSubtotal, currencyCode);

  // ── Build a single WhatsApp message listing every item in the cart ──────
  const buildCartWhatsappUrl = () => {
    const lines = cartItems.map((item, idx) => {
      const productData = products[item.id];
      const name = productData?.productName || item.productName || "Item";
      const sym = productData?.currencySymbol || "₹";
      const code = productData?.currencyCode || "INR";
      const unitPrice = productData?.totalPrice ?? item.price;
      const discountedUnit = getDiscountedPrice(unitPrice);
      const lineOriginal = unitPrice * item.quantity;
      const lineDiscounted = discountedUnit * item.quantity;

      const sizeText = item.size ? `\n  Size: ${item.size}` : "";
      const diamondText = item.diamondType
        ? `\n  Diamond: ${
            item.diamondType === "natural"
              ? "Natural Diamond"
              : item.diamondType === "lab_grown"
              ? "Lab Grown Diamond"
              : "Moissanite"
          }`
        : "";
      const priceText = `~${sym}${formatPrice(lineOriginal, code)}~ *${sym}${formatPrice(lineDiscounted, code)}* (${DISCOUNT_PERCENT}% OFF)`;

      return `${idx + 1}. *${name}*${item.quantity > 1 ? ` ×${item.quantity}` : ""}${sizeText}${diamondText}\n  Price: ${priceText}`;
    });

    const totalText = `~${currencySymbol}${formattedOriginalSubtotal}~ *${currencySymbol}${formattedDiscountedSubtotal}* (${DISCOUNT_PERCENT}% OFF Applied)`;

    const message =
      `Hi! I'd like to place an order for the following items:\n\n` +
      lines.join("\n\n") +
      `\n\n*Estimated Total:* ${totalText}\n\n` +
      `${typeof window !== "undefined" ? window.location.href : ""}\n\n` +
      `Please help me proceed with checkout.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

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
                const discountedUnit = getDiscountedPrice(unitPrice);

                const lineOriginal = unitPrice * item.quantity;
                const lineDiscounted = discountedUnit * item.quantity;

                const formattedLineOriginal = formatPrice(lineOriginal, code);
                const formattedLineDiscounted = formatPrice(lineDiscounted, code);
                const formattedUnitOriginal = formatPrice(unitPrice, code);
                const formattedUnitDiscounted = formatPrice(discountedUnit, code);

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
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm text-gray-400 line-through">
                                  {sym}{formattedLineOriginal}
                                </p>
                                <p className="text-xl font-bold text-black">
                                  {sym}{formattedLineDiscounted}
                                </p>
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                  {DISCOUNT_PERCENT}% OFF
                                </span>
                              </div>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {sym}{formattedUnitDiscounted} each (was {sym}{formattedUnitOriginal})
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm text-gray-400 line-through">
                                  {sym}{formattedLineOriginal}
                                </p>
                                <p className="text-xl font-bold text-black">
                                  {sym}{formattedLineDiscounted}
                                </p>
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                  {DISCOUNT_PERCENT}% OFF
                                </span>
                              </div>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {sym}{formattedUnitDiscounted} each (was {sym}{formattedUnitOriginal})
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
                  const discountedUnit = getDiscountedPrice(unitPrice);
                  const lineDiscounted = discountedUnit * item.quantity;
                  const formatted = formatPrice(lineDiscounted, code);

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
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Estimated Total</span>
                    <div className="text-right">
                      {loading ? (
                        "..."
                      ) : (
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <span className="text-sm text-gray-400 line-through">
                            {currencySymbol}{formattedOriginalSubtotal}
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            {currencySymbol}{formattedDiscountedSubtotal}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {!loading && (
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        {DISCOUNT_PERCENT}% OFF Applied
                      </span>
                    </div>
                  )}
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

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={buildCartWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-3 rounded-lg mt-6 hover:bg-[#1ebe5d] transition-colors flex items-center justify-center gap-3 font-semibold text-lg tracking-wide"
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Order on WhatsApp
              </motion.a>

              <p className="text-center text-xs text-gray-500 mt-3">You'll be redirected to WhatsApp to confirm your order</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/shop" className="text-black hover:text-black/80 font-medium text-sm">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}