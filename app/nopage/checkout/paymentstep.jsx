"use client";
import { useEffect, useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { loadRazorpay } from "../../lib/razorpay";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentStep({ userData }) {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const cartItems = Object.values(cart);

  const [loadingText, setLoadingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [productPrices, setProductPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [priceError, setPriceError] = useState(null);

  // ── Fetch real-time prices with selected currency ────────────────────────
  const fetchProductPrices = async () => {
    if (!cartItems.length) { setPricesLoading(false); return; }
    setPricesLoading(true);
    setPriceError(null);
    try {
      const currency = localStorage.getItem("currency") || "INR";
      const pricePromises = cartItems.map(async (item) => {
        const res = await fetch(`/api/products/fetch/${item.id}?currency=${currency}`, {
          headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
        });
        if (!res.ok) throw new Error(`Failed to fetch price for ${item.productName}`);
        const data = await res.json();
        return { id: item.id, totalPrice: data.totalPrice, productData: data };
      });

      const prices = await Promise.all(pricePromises);
      const priceMap = {};
      prices.forEach(({ id, totalPrice, productData }) => {
        priceMap[id] = { totalPrice, productData };
      });
      setProductPrices(priceMap);
    } catch (err) {
      console.error("Error fetching product prices:", err);
      setPriceError(err.message);
    } finally {
      setPricesLoading(false);
    }
  };

  useEffect(() => {
    fetchProductPrices();
  }, [cartItems.length]);

  // Re-fetch when currency changes from navbar
  useEffect(() => {
    const handler = () => fetchProductPrices();
    window.addEventListener("currencyChange", handler);
    return () => window.removeEventListener("currencyChange", handler);
  }, [cartItems.length]);

  useEffect(() => { loadRazorpay(); }, []);

  // ── Currency info (from first fetched product) ───────────────────────────
  const firstProductData = useMemo(
    () => Object.values(productPrices)[0]?.productData,
    [productPrices]
  );
  const currencySymbol = firstProductData?.currencySymbol || "₹";
  const currencyCode   = firstProductData?.currencyCode   || "INR";
  const isINR          = currencyCode === "INR";

  // Format a number in selected currency
  const fmt = (amount) =>
    isINR
      ? Math.ceil(amount).toLocaleString()
      : (Math.round(amount * 100) / 100).toLocaleString();

  // ── Totals (always in converted currency for display) ────────────────────
  // For display: use converted prices
  const displaySubtotal = useMemo(() =>
    cartItems.reduce((sum, item) => {
      const price = productPrices[item.id]?.totalPrice ?? item.price;
      return sum + price * item.quantity;
    }, 0),
    [cartItems, productPrices]
  );

  // For Razorpay: ALWAYS in INR — re-derive from raw DB values
  // The API stores metalPrice/makingCharges etc. in INR.
  // We re-fetch the INR price by calling without currency param (defaults to INR)
  // BUT: simpler approach — we know the rate from API response:
  // inrPrice = convertedPrice / (convertedTotal / inrTotal) = convertedPrice * (inrTotal / convertedTotal)
  // Even simpler: just pass items to /api/pay which recalculates from DB — this is already safe ✓
  // So grandTotalINR is only needed for the Razorpay amount display on payment buttons
  // The actual INR charge comes from /api/pay server-side recalculation

  const shippingCharge = userData?.shippingCharge || 0;

  // Shipping in display currency: convert using same rate as products
  // Rate = displayPrice / inrPrice for first product
  const displayShipping = useMemo(() => {
    if (shippingCharge === 0) return 0;
    if (isINR) return shippingCharge;
    // Derive rate from first product
    const firstItem = cartItems[0];
    if (!firstItem) return shippingCharge;
    const convertedPrice = productPrices[firstItem.id]?.totalPrice;
    const inrPrice = firstItem.price; // cart always stores INR
    if (!convertedPrice || !inrPrice) return shippingCharge;
    const rate = convertedPrice / inrPrice;
    return Math.round(shippingCharge * rate * 100) / 100;
  }, [shippingCharge, isINR, cartItems, productPrices]);

  const displayGrandTotal = displaySubtotal + displayShipping;

  // INR grand total for Razorpay button label (server recalculates independently)
  const inrGrandTotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) + shippingCharge,
    [cartItems, shippingCharge]
  );

  // ── Validation ───────────────────────────────────────────────────────────
  const validateOrder = () => {
    if (pricesLoading) throw new Error("Please wait while we load current prices.");
    if (priceError)    throw new Error("Failed to load current prices. Please refresh.");
    if (shippingCharge < 0) throw new Error("Invalid shipping charge. Please refresh.");
    if (displayGrandTotal <= 0) throw new Error("Order total cannot be zero.");
  };

  // ── Payment handler ──────────────────────────────────────────────────────
  const handlePayment = async () => {
    try {
      setLoadingText("Processing payment...");
      setLoading(true);
      setError("");
      validateOrder();

      // Items passed to /api/pay — server always recalculates INR from DB
      const orderPayload = {
        items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        address: userData.address,
        shippingCharge, // always INR
        paymentMethod: "prepaid",
      };

      const orderRes = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.message || "Failed to create order.");
      }

      const orderData = await orderRes.json();

      // Items for placeorder (includes size + display price for records)
      const itemsForOrder = cartItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price, // INR price for order record
        displayPrice: productPrices[item.id]?.totalPrice ?? item.price,
        displayCurrency: currencyCode,
        productName: item.productName,
        image: item.image,
        size: item.size || null,
      }));

      // ── Razorpay options — amount is always INR paise ──────────────────
      const razorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: inrGrandTotal * 100, // paise, always INR
        currency: "INR",
        name: "Ruveri Jewel",
        description: "Order Payment",
        image: "/logo.png",
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              await fetch("/api/placeorder", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
                },
                body: JSON.stringify({
                  name: userData.name,
                  email: userData.email,
                  address: userData.address,
                  items: itemsForOrder,
                  method: "prepaid",
                  subtotal: inrGrandTotal - shippingCharge, // INR
                  shippingCharge,
                  total: inrGrandTotal,                     // INR
                  displaySubtotal,                          // converted
                  displayTotal: displayGrandTotal,          // converted
                  displayCurrency: currencyCode,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              clearCart();
              router.push("/thank-you");
            } else {
              setError("Payment verification failed. Please contact support.");
              setLoading(false);
            }
          } catch (err) {
            console.error("Payment handler error:", err);
            setError("Payment processing failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled. Please try again.");
          },
        },
        prefill: { name: userData.name, email: userData.email },
        theme: { color: "#b71c0e" },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (err) {
      console.log("Payment Error:", err);
      setError(err.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  // ── Loading / error screens ──────────────────────────────────────────────
  if (pricesLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 text-sm">
        <div className="bg-white rounded shadow p-6 text-center">
          <div className="animate-pulse">
            <div className="text-lg font-semibold text-gray-700">Loading current prices...</div>
            <div className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest pricing</div>
          </div>
        </div>
      </div>
    );
  }

  if (priceError) {
    return (
      <div className="grid grid-cols-1 gap-4 text-sm">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="font-semibold">Failed to load current prices</div>
          <div className="text-sm mt-1">{priceError}</div>
          <button onClick={() => fetchProductPrices()} className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 gap-4 text-sm">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded shadow text-center text-base font-medium text-gray-800 animate-pulse">
            {loadingText}
          </div>
        </div>
      )}

      {/* ── Order Summary ── */}
      <div className="bg-white rounded shadow space-y-3 p-4">
        <h2 className="text-base font-semibold border-b pb-2">Order Summary</h2>

        <div className="space-y-2 max-h-56 overflow-auto pr-2">
          {cartItems.map((item) => {
            const data         = productPrices[item.id]?.productData;
            const sym          = data?.currencySymbol || "₹";
            const code         = data?.currencyCode   || "INR";
            const unitPrice    = productPrices[item.id]?.totalPrice ?? item.price;
            const lineTotal    = unitPrice * item.quantity;
            const fmtLine      = code === "INR"
              ? Math.ceil(lineTotal).toLocaleString()
              : (Math.round(lineTotal * 100) / 100).toLocaleString();
            const fmtUnit      = code === "INR"
              ? Math.ceil(unitPrice).toLocaleString()
              : (Math.round(unitPrice * 100) / 100).toLocaleString();
            // Flag if price changed from what was stored at add-to-cart time
            const priceChanged = unitPrice !== item.price && isINR;
            const sizeLabel    = item.size?.trim() || null;

            return (
              <div key={item.id} className="flex items-start gap-3 pb-2 border-b last:border-b-0">
                <div className="w-20 h-20 shrink-0 overflow-hidden rounded border bg-white">
                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 text-sm w-full">
                  <p className="font-medium text-gray-900 leading-snug">{item.productName}</p>
                  {data?.metal && (
                    <p className="text-xs text-gray-400 capitalize">{data.metal} · {data.purity}</p>
                  )}
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  <p className="text-xs text-gray-500">
                    Size:{" "}
                    <span className={sizeLabel ? "font-semibold text-gray-800" : "text-gray-400"}>
                      {sizeLabel || "N/A"}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-gray-900">
                      {sym}{fmtLine}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-gray-400">({sym}{fmtUnit} each)</span>
                    )}
                    {priceChanged && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Price updated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Totals ── */}
        <div className="border-t pt-3 space-y-1.5 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{currencySymbol}{fmt(displaySubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            {displayShipping > 0
              ? <span>{currencySymbol}{fmt(displayShipping)}</span>
              : <span className="text-green-600">Free</span>
            }
          </div>
          <div className="flex justify-between font-semibold text-base text-gray-900 pt-2 border-t">
            <span>Total</span>
            <span>{currencySymbol}{fmt(displayGrandTotal)}</span>
          </div>
          {/* Show INR equivalent when non-INR selected */}
          {/* {!isINR && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-blue-700 font-medium">
                Payment processed in INR: ₹{Math.ceil(inrGrandTotal).toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Prices displayed in {currencyCode} for reference. Razorpay charges in INR.
              </p>
            </div>
          )} */}
        </div>
      </div>

      {/* ── Payment Options ── */}
      <div className="bg-white rounded shadow p-4 space-y-4">
        <h2 className="text-base font-semibold border-b pb-2">Payment Options</h2>

        {[
          { label: "Pay via UPI",       desc: "GPay, PhonePe, Paytm" },
          { label: "Debit/Credit Cards", desc: "Visa, MasterCard, Rupay" },
          { label: "Wallets",            desc: "PhonePe, Amazon, Mobikwik" },
          { label: "Netbanking",         desc: "SBI, HDFC, ICICI, Axis" },
        ].map((method, index) => (
          <button
            key={index}
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex justify-between items-center bg-c1 text-black py-3 px-3 rounded transition text-sm hover:bg-c1/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-left">
              <p className="font-bold">{method.label}</p>
              <p className="text-xs">{method.desc}</p>
            </div>
            {/* Always show INR on the payment button — that's what Razorpay charges */}
            <div className="text-right">
              <p className="text-base font-semibold">{currencySymbol}{fmt(displayGrandTotal)} {currencyCode}</p>
              {/* {!isINR && (
                <p className="text-xs text-gray-500">
                  ≈ {currencySymbol}{fmt(displayGrandTotal)} {currencyCode}
                </p>
              )} */}
            </div>
          </button>
        ))}

        <div className="text-xs text-gray-600 pt-4 border-t mt-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-600">🔒</span>
            <p className="font-medium">100% Secure &amp; Encrypted Payments</p>
          </div>
          <p className="text-gray-500">
            Need help?{" "}
            <Link href="/contact-us" className="text-c4 font-medium underline hover:text-c4/80">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}