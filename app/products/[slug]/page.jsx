"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../nopage/context/CartContext";
import Checkout from "../../nopage/checkout/checkout";
import { XMarkIcon, HeartIcon as HeartOutline, ShareIcon, ShoppingBagIcon, CheckIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useGoogleAuth } from "../../nopage/components/useGoogleAuth";
import Link from "next/link";

/* ---------- DISCOUNT CONFIG ---------- */
const DISCOUNT_PERCENT = 15;
const getDiscountedPrice = (price) => Math.round((Number(price) || 0) * (1 - DISCOUNT_PERCENT / 100));

/* ---------- MEDIA HELPERS (image vs video) ---------- */
// img1 / img2 / img3 can each hold either an image URL or a video URL (e.g. .mp4).
// This detects which one we're dealing with purely from the file extension, so
// no backend/schema change is required — just drop a video URL into any img field.
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?(#.*)?$/i;
const isVideoFile = (url) => !!url && VIDEO_EXTENSIONS.test(url);

/* ---------- PRICE HELPERS (INR only — for breakdown) ---------- */
const getPurityMultiplier = (metal, purity) => {
  const goldMap = { "24K": 1, "22K": 0.916, "20K": 0.833, "18K": 0.78, "14K": 0.615, "9K": 0.415 };
  const silverMap = { "999 Silver": 1, "950 Silver": 0.95, "925 Silver": 0.925, "900 Silver": 0.9, "800 Silver": 0.8 };
  if (metal === "gold") return goldMap[purity] || 1;
  if (metal === "silver") return silverMap[purity] || 1;
  return 1;
};

const calculateTotalPriceINR = (product) => {
  if (!product) return 0;
  try {
    if (product.metal === "silver") return Number(product.metalPrice) || 0;
    const netWeight = Number(product.netWeight) || 0;
    const metalPrice = Number(product.metalPrice) || 0;
    const makingCharges = Number(product.makingCharges) || 0;
    const diamondPrice = Number(product.diamondPrice) || 0;
    const purityMultiplier = getPurityMultiplier(product.metal, product.purity);
    return Math.ceil(netWeight * metalPrice * purityMultiplier + makingCharges + diamondPrice);
  } catch { return product.originalPrice || product.totalPrice || 0; }
};

/* ---------- SIZE MAPS ---------- */
const RING_SIZE_MM = {
  8: "46.8mm", 9: "47.8mm", 10: "48.7mm", 11: "49.7mm", 12: "50.6mm",
  13: "51.5mm", 14: "52.5mm", 15: "53.4mm", 16: "54.4mm", 17: "55.3mm",
  18: "56.3mm", 19: "57.2mm", 20: "58.2mm",
};
const BANGLE_SIZE_MM = {
  "2.2": "55.9mm", "2.3": "58.4mm", "2.4": "61.0mm", "2.5": "63.5mm",
  "2.6": "66.0mm", "2.7": "68.6mm", "2.8": "71.1mm", "2.9": "73.7mm", "2.10": "76.2mm",
};
const BRACELET_SIZE_IN = {
  "6in": "XS",
  "6.5in": "S",
  "7in": "M",
  "7.5in": "L",
  "8in": "XL",
};

/* ---------- categories that require size ---------- */
const SIZED_CATEGORIES = ["rings", "bangles", "bracelets"];

const requiresSize = (category) => SIZED_CATEGORIES.includes(category?.toLowerCase());

const getSizeConfig = (category) => {
  const cat = category?.toLowerCase();
  if (cat === "rings") return {
    label: "Ring Size",
    sizes: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    sizeMap: RING_SIZE_MM,
    subtitle: "Indian ring sizes with circumference",
  };
  if (cat === "bangles") return {
    label: "Bangle Size",
    sizes: ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10"],
    sizeMap: BANGLE_SIZE_MM,
    subtitle: "Standard bangle sizes in inches",
  };
 
if (cat === "bracelets") return {
  label: "Bracelet Size",
  sizes: ["6in", "6.5in", "7in", "7.5in", "8in"],
  sizeMap: BRACELET_SIZE_IN,
  subtitle: "Bracelet sizes in inches (standard fit)",
};
  return null;
};

/* ---------- DIAMOND TYPE SELECTOR ---------- */
const DiamondTypeSelector = ({ selectedDiamondType, onSelectDiamondType, metal }) => {
  const allTypes = [
    {
    id: "natural",
    label: "Natural Diamond",
    icon: "💎",
    desc: "Mined from the earth, each stone unique",
    badge: "Classic",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    id: "lab_grown",
    label: "Lab Grown Diamond",
    icon: "⚗️",
    desc: "Same chemical properties, eco-friendly",
    badge: "Sustainable",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "moissanite",
    label: "Moissanite",
    icon: "✨",
    desc: "Near-diamond brilliance, exceptional value",
    badge: "Premium",
    badgeColor: "bg-violet-100 text-violet-800",
  },
  ];
  const types = metal === "silver" ? allTypes : allTypes.filter(t => t.id !== "moissanite");

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">Diamond Type</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map((type) => {
          const isSelected = selectedDiamondType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelectDiamondType(type.id)}
              className={`relative flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-black bg-black text-white shadow-lg"
                  : "border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400 hover:bg-white"
              }`}
            >
              {/* Badge */}
              <span className={`absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                isSelected ? "bg-white/20 text-white" : type.badgeColor
              }`}>
                {type.badge}
              </span>

              {/* <span className="text-xl leading-none">{type.icon}</span> */}
              <span className={`text-sm font-semibold leading-tight ${isSelected ? "text-white" : "text-gray-900"}`}>
                {type.label}
              </span>
              <span className={`text-xs leading-snug ${isSelected ? "text-white/70" : "text-gray-500"}`}>
                {type.desc}
              </span>

              {isSelected && (
                <span className="absolute top-2 left-2">
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!selectedDiamondType && (
        <p className="text-xs text-gray-400 mt-1">
          Please select a diamond type to proceed with your WhatsApp order.
        </p>
      )}
    </div>
  );
};

/* ---------- SIZE SELECTOR ---------- */
const SizeSelector = ({ category, selectedSize, onSelectSize, sizeError, whatsappUrl }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [highlightWhatsapp, setHighlightWhatsapp] = useState(false);

  const triggerWhatsappHighlight = () => {
    setHighlightWhatsapp(true);
    setTimeout(() => setHighlightWhatsapp(false), 3000);
    document.getElementById("size-selector")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const handler = () => triggerWhatsappHighlight();
    window.addEventListener("highlight-whatsapp", handler);
    return () => window.removeEventListener("highlight-whatsapp", handler);
  }, []);

  const config = getSizeConfig(category);
  if (!config) return null;

  const { label, sizes, sizeMap, subtitle } = config;
  const isMakeToOrder = !!selectedSize;

  const handleSelect = (size) => {
    onSelectSize(String(size));
    setPanelOpen(false);
  };

  return (
    <>
      <div className="space-y-3">
        {category?.toLowerCase() === "bangles" && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <span className="text-amber-500 text-base mt-0.5 flex-shrink-0">ⓘ</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Price is for 1 bangle.</strong> Bangles are sold individually — not as a pair.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {selectedSize && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Selected: <strong>{selectedSize}</strong>
              {sizeMap[selectedSize] && <span className="text-gray-400 ml-1">({sizeMap[selectedSize]})</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedSize ? (
            <div className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium">
              <span>{selectedSize}</span>
              {sizeMap[selectedSize] && <span className="text-white/60 text-xs">{sizeMap[selectedSize]}</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 border-2 border-dashed border-gray-300 px-4 py-2.5 rounded-lg text-sm text-gray-400">
              No size selected
            </div>
          )}
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-black border border-black px-4 py-2.5 rounded-lg hover:bg-black hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            {selectedSize ? "Change Size" : "Select Size"}
          </button>
        </div>

        {/* MTO notice */}
        {isMakeToOrder && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id="mto-whatsapp-banner"
            className={`rounded-lg border px-4 py-3 transition-all duration-300 ${
              highlightWhatsapp
                ? "border-[#25D366] bg-[#25D366]/10 ring-2 ring-[#25D366] ring-offset-1"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className={`text-base mt-0.5 flex-shrink-0 ${highlightWhatsapp ? "text-[#25D366]" : "text-amber-500"}`}>ⓘ</span>
              <div className="flex-1">
                <p className={`text-xs font-semibold mb-1 ${highlightWhatsapp ? "text-[#25D366]" : "text-amber-800"}`}>
                  This is a Make to Order item
                </p>
                <p className={`text-xs leading-relaxed mb-2 ${highlightWhatsapp ? "text-green-800" : "text-amber-700"}`}>
                  Made-to-order items cannot be added directly to cart. Please contact us on WhatsApp to place your order for size <strong>{selectedSize}</strong>.
                </p>
                {whatsappUrl && (
                  <Link
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      highlightWhatsapp
                        ? "bg-[#25D366] text-white shadow-lg shadow-green-200 scale-105"
                        : "border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Order on WhatsApp → Size {selectedSize}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {sizeError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 flex items-center gap-1.5">
            <span>⚠</span> Please select a size before continuing.
          </motion.p>
        )}
      </div>

      {/* Slide-in panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setPanelOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="fixed left-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-semibold text-black">Select {label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                </div>
                <button onClick={() => setPanelOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mx-5 mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <span className="text-amber-500 text-base mt-0.5 flex-shrink-0">ⓘ</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>All sizes are Make to Order.</strong> Contact us on WhatsApp after selecting your size.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="grid grid-cols-3 gap-3">
                  {sizes.map((size) => {
                    const isSelected = String(selectedSize) === String(size);
                    const detail = sizeMap[size];
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSelect(size)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-black bg-black text-white shadow-lg scale-105"
                            : "border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400 hover:bg-white"
                        }`}
                      >
                        <span className="text-xl font-bold leading-none">{size}</span>
                        {detail && (
                          <span className={`text-[10px] leading-none mt-0.5 ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                            {detail}
                          </span>
                        )}
                        <span className={`text-[9px] font-medium mt-1 px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                          Make to Order
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 flex-shrink-0">
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Not sure about your size?{" "}
                  <Link href={`https://wa.me/916353974557?text=${encodeURIComponent("Hi! I need help finding my size for a Ruveri Jewel product.")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-black font-semibold underline underline-offset-2">
                    Ask our expert on WhatsApp
                  </Link>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ---------- CONNECT WITH EXPERT ---------- */
const ConnectWithExpert = ({ product }) => {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const productUrl = window.location.href;
    const message = `Hi! I would like to enquire about this product from Ruveri Jewel.\n\n*${product?.productName || "Product"}*\n${productUrl}\n\nCould you please help me with more details?`;
    setUrl(`https://wa.me/916353974557?text=${encodeURIComponent(message)}`);
  }, [product]);

  if (!url) return null;

  return (
    <Link href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 border border-[#25D366] text-[#25D366] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#25D366] hover:text-white transition-all duration-200 whitespace-nowrap flex-shrink-0">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      Connect with Expert
    </Link>
  );
};

/* ---------- PRICE BREAKDOWN ---------- */
const PriceBreakdown = ({ product }) => {
  const [openBreakdown, setOpenBreakdown] = useState(false);
  if (!product) return null;
  const isSilver = product.metal === "silver";
  const sym = product.currencySymbol || "₹";
  const currencyCode = product.currencyCode || "INR";
  const isINR = currencyCode === "INR";

  const getConversionRate = () => {
    if (isINR) return 1;
    const inrTotal = (() => {
      if (isSilver) return Number(product.metalPrice) || 0;
      const nw = Number(product.netWeight) || 0;
      const mp = Number(product.metalPrice) || 0;
      const mc = Number(product.makingCharges) || 0;
      const dp = Number(product.diamondPrice) || 0;
      const pm = getPurityMultiplier(product.metal, product.purity);
      return Math.ceil(nw * mp * pm + mc + dp);
    })();
    if (!inrTotal || !product.totalPrice) return 1;
    return product.totalPrice / inrTotal;
  };

  const rate = getConversionRate();
  const conv = (inrAmount) => {
    if (isINR) return Math.ceil(inrAmount).toLocaleString();
    return (Math.round(inrAmount * rate * 100) / 100).toLocaleString();
  };

  if (isSilver) {
    const totalINR = Number(product.metalPrice) || 0;
    const displayTotal = isINR ? Math.ceil(totalINR) : product.totalPrice;
    const discountedTotal = getDiscountedPrice(displayTotal);
    return (
      <div className="mt-4">
        <button onClick={() => setOpenBreakdown(!openBreakdown)}
          className="w-full flex justify-between items-center border-t border-b py-4 hover:bg-gray-50 transition-colors">
          <span className="text-base sm:text-lg font-medium">Price Breakdown</span>
          <span className="text-xl sm:text-2xl">{openBreakdown ? "−" : "+"}</span>
        </button>
        {openBreakdown && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <div className="py-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount ({currencyCode})</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">Silver Product Price</div>
                        <div className="text-xs text-gray-500">{product.purity} — fixed price</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{sym}{conv(totalINR)}</td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td className="px-4 py-3"><div className="text-sm font-bold text-black">Final Price</div></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-400 line-through">{sym}{displayTotal?.toLocaleString()}</span>
                          <span className="text-lg font-bold text-black">{sym}{discountedTotal.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{DISCOUNT_PERCENT}% OFF</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Price includes all charges (making, GST, etc.)</li>
                  <li>• BIS Hallmarked — {product.purity} certified silver</li>
                  <li>• {DISCOUNT_PERCENT}% discount applied to final price</li>
                  {!isINR && <li>• Prices shown in {currencyCode} — converted from INR at live rates</li>}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  const netWeight = Number(product.netWeight) || 0;
  const metalPrice = Number(product.metalPrice) || 0;
  const makingCharges = Number(product.makingCharges) || 0;
  const diamondPrice = Number(product.diamondPrice) || 0;
  const diamondWeight = Number(product.diamondWeight) || 0;
  const purityMultiplier = getPurityMultiplier(product.metal, product.purity);
  const metalCostINR = netWeight * metalPrice * purityMultiplier;
  const totalINR = Math.ceil(metalCostINR + makingCharges + diamondPrice);
  const gstRate = 0.03;
  const gstOnMakingINR = makingCharges * gstRate;
  const makingWithoutGSTINR = makingCharges - gstOnMakingINR;
  const discountedFinal = getDiscountedPrice(product.totalPrice);

  return (
    <div className="mt-4">
      <button onClick={() => setOpenBreakdown(!openBreakdown)}
        className="w-full flex justify-between items-center border-t border-b py-4 hover:bg-gray-50 transition-colors">
        <span className="text-base sm:text-lg font-medium">Price Breakdown</span>
        <span className="text-xl sm:text-2xl">{openBreakdown ? "−" : "+"}</span>
      </button>
      {openBreakdown && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
          <div className="py-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-black mb-3">How we calculate the price:</h4>
              <p className="text-sm text-gray-600 mb-2">
                Total Price = (Net Weight × Metal Price of <strong>pure metal</strong> × Purity Multiplier) + Diamond Price + Making Charges (includes GST)
              </p>
              <p className="text-xs text-gray-500"><em>Purity Multiplier converts pure metal price (24K gold) to the actual product purity</em></p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount ({currencyCode})</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">Metal Cost</div>
                      <div className="text-xs text-gray-500">
                        {product.metal.charAt(0).toUpperCase() + product.metal.slice(1)} ({product.purity})
                        <span className="block text-xs text-gray-400">Converted via Purity Multiplier ({purityMultiplier})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{netWeight}g × {sym}{conv(metalPrice)}/g × {purityMultiplier}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sym}{conv(metalCostINR)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">Diamond Price</div>
                      <div className="text-xs text-gray-500">{diamondWeight} ct diamonds</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{diamondWeight} ct</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sym}{conv(diamondPrice)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">Making Charges</div>
                      <div className="text-xs text-gray-500">Including 3% GST</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">Labour + Design + GST</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sym}{conv(makingCharges)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="px-4 py-3 text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-500">Making Charges (before GST):</span><span className="font-medium ml-1">{sym}{conv(makingWithoutGSTINR)}</span></div>
                        <div><span className="text-gray-500">GST @3%:</span><span className="font-medium ml-1">{sym}{conv(gstOnMakingINR)}</span></div>
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="px-4 py-3"><div className="text-sm font-bold text-black">Final Price</div></td>
                    <td className="px-4 py-3 text-sm text-gray-600">Metal Cost + Making Charges</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-400 line-through">{sym}{product.totalPrice?.toLocaleString()}</span>
                        <span className="text-lg font-bold text-black">{sym}{discountedFinal.toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{DISCOUNT_PERCENT}% OFF</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Metal price is based on current market rates (updated daily)</li>
                <li>• Making charges include GST as per government regulations</li>
                <li>• Hallmarking charges are included in making charges</li>
                <li>• {DISCOUNT_PERCENT}% discount applied to final price</li>
                {!isINR && <li>• Prices shown in {currencyCode} — converted from INR at live rates</li>}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* ---------- REVIEW FORM ---------- */
const UpdatedReviewForm = ({ productId }) => {
  const { loginWithGoogle, getLoggedInUser } = useGoogleAuth();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => setReviews(data?.reviews || []))
      .catch(() => setReviews([]));
  }, [productId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const user = getLoggedInUser();
    if (!user?.email) { setLoginPrompt(true); return; }
    if (!newReview.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userEmail: user.email, userName: user.name, userPhoto: user.photo, rating, comment: newReview }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews([data.review, ...reviews]);
        setNewReview(""); setRating(5);
      }
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="mt-12 space-y-8">
      <h2 className="text-2xl font-bold text-black">Customer Reviews</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-black mb-4">Write a Review</h3>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} className="text-2xl focus:outline-none">
                <span className={star <= rating ? "text-yellow-500" : "text-gray-300"}>★</span>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">{rating}.0</span>
          </div>
          <textarea value={newReview} onChange={(e) => setNewReview(e.target.value)}
            placeholder="Share your thoughts about this product..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent h-32 resize-none" maxLength={500} />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{newReview.length}/500 characters</span>
            <button type="submit" disabled={loading || !newReview.trim()}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id || review.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <img src={review.userPhoto || "/default-avatar.png"} alt={review.userName} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-black">{review.userName}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                        <span className="text-gray-300">{"★".repeat(5 - review.rating)}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8"><p className="text-gray-600">No reviews yet. Be the first to review!</p></div>
      )}
      {loginPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md p-8 relative">
            <button onClick={() => setLoginPrompt(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black"><XMarkIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to submit a review.</p>
            <button onClick={async () => { try { await loginWithGoogle(); setLoginPrompt(false); } catch { } }}
              className="w-full bg-black text-white py-4 flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export default function ProductDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const { loginWithGoogle, getLoggedInUser } = useGoogleAuth();
  const { cart, addToCart, getShippingParams } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [openInfo, setOpenInfo] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [selectedDiamondType, setSelectedDiamondType] = useState("");
  const [diamondTypeError, setDiamondTypeError] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);

  // ── ALL products are MTO — no cart needed ──────────────────────────────────
  // isMakeToOrder is always true for every product
  const isMakeToOrder = true;

  // Build WhatsApp MTO URL with size + diamond type + discounted price
  const buildMtoWhatsappUrl = () => {
    if (!product) return "";
    const hasDiamond = Number(product.diamondWeight) > 0;
    const sizeText = requiresSize(product.category) && selectedSize ? `\nSize: ${selectedSize}` : "";
    const diamondText = hasDiamond && selectedDiamondType
      ? `\nDiamond Type: ${
  selectedDiamondType === "natural"
    ? "Natural Diamond"
    : selectedDiamondType === "lab_grown"
    ? "Lab Grown Diamond"
    : "Moissanite"
}`
      : "";

    const sym = product.currencySymbol || "₹";
    const originalPrice = product.totalPrice ?? 0;
    const discountedPrice = getDiscountedPrice(originalPrice);

    // WhatsApp uses ~text~ for strikethrough formatting
    const priceText = `~${sym}${originalPrice.toLocaleString()}~ *${sym}${discountedPrice.toLocaleString()}* (${DISCOUNT_PERCENT}% OFF Applied)`;

    const message = `Hi! I'd like to place a Make to Order for:\n\n*${product.productName}*${sizeText}${diamondText}\nPrice: ${priceText}\n${typeof window !== "undefined" ? window.location.href : ""}\n\nPlease help me proceed.`;
    return `https://wa.me/916353974557?text=${encodeURIComponent(message)}`;
  };

  const mtoWhatsappUrl = buildMtoWhatsappUrl();

  // Validation before WhatsApp redirect / Add to Cart
  const validateAndOrder = () => {
    let valid = true;
    if (requiresSize(product?.category) && !selectedSize) {
      setSizeError(true);
      document.getElementById("size-selector")?.scrollIntoView({ behavior: "smooth", block: "center" });
      valid = false;
    }
    const hasDiamond = Number(product?.diamondWeight) > 0;
    if (hasDiamond && !selectedDiamondType) {
      setDiamondTypeError(true);
      document.getElementById("diamond-type-selector")?.scrollIntoView({ behavior: "smooth", block: "center" });
      valid = false;
    }
    return valid;
  };

  // Fetch product
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const currency = localStorage.getItem("currency") || "INR";
      const res = await fetch(`/api/products/fetch/${slug}?currency=${currency}`, {
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
      });
      if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
      const data = await res.json();
      setProduct(data);
      setMainImage(data.img1 || "/placeholder.jpg");
    } catch (err) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (slug) fetchProduct(); }, [slug]);

  useEffect(() => {
    const handler = () => { if (slug) fetchProduct(); };
    window.addEventListener("currencyChange", handler);
    return () => window.removeEventListener("currencyChange", handler);
  }, [slug]);

  useEffect(() => {
    const cached = localStorage.getItem("wishlist");
    if (cached) { try { setWishlist(JSON.parse(cached).map(id => String(id))); } catch { } }
  }, [slug]);

  // Reset the "just added" confirmation state whenever the product itself,
  // or the size/diamond selection, changes.
  useEffect(() => {
    setJustAddedToCart(false);
  }, [slug, selectedSize, selectedDiamondType]);

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product?.productName, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setShareSuccess(true); setTimeout(() => setShareSuccess(false), 2000); }
    } catch { }
  };

  const toggleWishlist = async () => {
    const user = getLoggedInUser();
    if (!user?.email) { try { await loginWithGoogle(); if (!getLoggedInUser()?.email) return; } catch { return; } }
    const idStr = String(slug);
    const inWl = wishlist.includes(idStr);
    const next = inWl ? wishlist.filter(id => id !== idStr) : [...wishlist, idStr];
    setWishlist(next); localStorage.setItem("wishlist", JSON.stringify(next));
    try {
      const res = await fetch("/api/wishlist", {
        method: inWl ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: getLoggedInUser().email, productId: slug }),
      });
      if (!res.ok) { setWishlist(wishlist); localStorage.setItem("wishlist", JSON.stringify(wishlist)); }
    } catch { setWishlist(wishlist); localStorage.setItem("wishlist", JSON.stringify(wishlist)); }
  };

  // ── Add to Cart ─────────────────────────────────────────────────────────
  // Re-enables the existing CartContext for this page. Requires the same
  // selections (size / diamond type) as the WhatsApp flow before adding.
  const handleAddToCart = () => {
    if (!product) return;
    if (!readyToOrder) {
      validateAndOrder();
      return;
    }
    const productId = product._id || slug;
    addToCart(productId, {
      productName: product.productName,
      price: getDiscountedPrice(product.totalPrice ?? 0),
      originalPrice: product.totalPrice ?? 0,
      image: product.img1,
      category: product.category,
      metal: product.metal,
      purity: product.purity,
      size: selectedSize || null,
      diamondType: selectedDiamondType || null,
      weight: product.grossWeight,
      dimensions: getShippingParams(),
    });
    setJustAddedToCart(true);
  };

  if (loading) return (
    <div className="bg-back min-h-screen ci">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid lg:grid-cols-2 gap-12 pt-4">
        <div className="space-y-4">
          <div className="w-full h-[400px] md:h-[520px] bg-gray-200 animate-pulse rounded-lg" />
          <div className="flex gap-3">{[...Array(3)].map((_, i) => <div key={i} className="w-24 h-24 bg-gray-200 animate-pulse rounded" />)}</div>
        </div>
        <div className="space-y-6">{[32, 48, 40, 128, 56].map((h, i) => <div key={i} className="bg-gray-200 animate-pulse rounded" style={{ height: h }} />)}</div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="bg-back min-h-screen ci flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-black mb-4">Product Not Found</h2>
        <button onClick={() => router.push("/")} className="px-6 py-3 bg-black text-white hover:bg-gray-900 transition-colors">Browse Products</button>
      </div>
    </div>
  );

  const isSilver = product.metal === "silver";
  const allImages = [product.img1, product.img2, product.img3].filter(Boolean);
  const isInWishlist = wishlist.includes(String(slug));
  const displayPrice = product.totalPrice ?? 0;
  const discountedDisplayPrice = getDiscountedPrice(displayPrice);
  const displaySymbol = product.currencySymbol || "₹";
  const productId = product._id || slug;
  const hasDiamond = Number(product.diamondWeight) > 0;
  const mainIsVideo = isVideoFile(mainImage);

  // Determine if all required selections are made for WhatsApp / Add to Cart
  const sizeReady = !requiresSize(product.category) || !!selectedSize;
  const diamondReady = !hasDiamond || !!selectedDiamondType;
  const readyToOrder = sizeReady && diamondReady;

  const isInCart = !!cart?.[productId];

  return (
    <div className="bg-back min-h-screen ci px-2 sm:px-4">
      <button onClick={() => router.back()}
        className="fixed top-4 left-2 sm:top-6 sm:left-4 z-10 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-black text-sm hover:bg-white transition-colors shadow-lg rounded-lg">
        ← Back
      </button>

      <div className="max-w-7xl mx-auto py-8 md:py-12 grid lg:grid-cols-2 gap-6 md:gap-16 pt-4 md:pt-4">

        {/* ── IMAGES / VIDEO ── */}
        <div className="relative">
          <div className="hidden lg:grid grid-cols-[3fr_1fr] gap-6">
            <div className="relative group">
              {mainIsVideo ? (
                <video
                  key={mainImage}
                  src={mainImage}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-[520px] object-cover bg-black"
                />
              ) : (
                <img src={mainImage} alt={product.productName} className="w-full h-[520px] object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex flex-col gap-4">
                {allImages.map((media, i) => {
                  const thumbIsVideo = isVideoFile(media);
                  return (
                    <button key={i} onClick={() => setMainImage(media)}
                      className={`relative h-[160px] overflow-hidden transition-all duration-300 ${mainImage === media ? 'ring-2 ring-black ring-offset-2' : 'opacity-80 hover:opacity-100'}`}>
                      {thumbIsVideo ? (
                        <>
                          <video src={media} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <svg className="w-8 h-8 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </>
                      ) : (
                        <img src={media} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="lg:hidden space-y-4">
            <div className="relative group">
              {mainIsVideo ? (
                <video
                  key={mainImage}
                  src={mainImage}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-[350px] sm:h-[400px] object-cover bg-black rounded-lg"
                />
              ) : (
                <img src={mainImage} alt={product.productName} className="w-full h-[350px] sm:h-[400px] object-cover transition-transform duration-500 group-hover:scale-105 rounded-lg" />
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 px-1">
                {allImages.map((media, i) => {
                  const thumbIsVideo = isVideoFile(media);
                  return (
                    <button key={i} onClick={() => setMainImage(media)}
                      className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 overflow-hidden transition-all duration-300 rounded-md ${mainImage === media ? 'ring-2 ring-black ring-offset-1' : 'opacity-80 hover:opacity-100'}`}>
                      {thumbIsVideo ? (
                        <>
                          <video src={media} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </>
                      ) : (
                        <img src={media} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col gap-2">
            <button onClick={toggleWishlist} className="p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
              {isInWishlist ? <HeartSolid className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-500" /> : <HeartOutline className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black" />}
            </button>
            <button onClick={handleShare} className="p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
              <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black" />
            </button>
          </div>
          {shareSuccess && <div className="absolute bottom-3 left-3 bg-black text-white px-3 py-1.5 rounded-lg text-xs">Link copied!</div>}
        </div>

        {/* ── DETAILS ── */}
        <div className="space-y-6 md:space-y-8 px-2 sm:px-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block border border-black px-3 py-1.5 text-xs tracking-wide">
              {product.category?.toUpperCase() || "JEWELRY"}
            </span>
            {/* Global MTO badge */}
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 text-xs font-semibold rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Make to Order
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-medium text-black leading-tight">
            {product.productName}
          </h1>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm sm:text-base md:text-lg text-gray-400 line-through">
                {displaySymbol}{displayPrice.toLocaleString()}
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-medium text-black">
                {displaySymbol}{discountedDisplayPrice.toLocaleString()}
              </p>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {DISCOUNT_PERCENT}% OFF
              </span>
              {product.currencyCode && product.currencyCode !== "INR" && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {product.currencyCode}
                </span>
              )}
              <ConnectWithExpert product={product} />
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {product.category === "bangles"
                ? "Price is for 1 bangle (sold individually, not as a pair)"
                : isSilver ? "Inclusive of all charges" : "Includes making charges"}
            </p>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 py-4 sm:py-6 border-y border-gray-200">
            <div><p className="text-xs sm:text-sm text-gray-500">Metal</p><p className="font-medium capitalize text-sm sm:text-base">{product.metal}</p></div>
            <div><p className="text-xs sm:text-sm text-gray-500">Purity</p><p className="font-medium text-sm sm:text-base">{product.purity}</p></div>
            {isSilver ? (
              <>
                <div><p className="text-xs sm:text-sm text-gray-500">Gross Weight</p><p className="font-medium text-sm sm:text-base">{product.grossWeight}g</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Color</p><p className="font-medium capitalize text-sm sm:text-base">{product.color || "Silver"}</p></div>
              </>
            ) : (
              <>
                <div><p className="text-xs sm:text-sm text-gray-500">Net Weight</p><p className="font-medium text-sm sm:text-base">{product.netWeight}g</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Gross Weight</p><p className="font-medium text-sm sm:text-base">{product.grossWeight}g</p></div>
              </>
            )}
          </div>

          {/* SIZE SELECTOR — rings, bangles, bracelets */}
          {requiresSize(product.category) && (
            <div id="size-selector">
              <SizeSelector
                category={product.category}
                selectedSize={selectedSize}
                onSelectSize={(size) => { setSelectedSize(size); setSizeError(false); }}
                sizeError={sizeError}
                whatsappUrl={mtoWhatsappUrl}
              />
            </div>
          )}

          {/* DIAMOND TYPE SELECTOR — shown for all products that have diamonds */}
         
{hasDiamond && (
  <div id="diamond-type-selector">
    <DiamondTypeSelector
      selectedDiamondType={selectedDiamondType}
      onSelectDiamondType={(type) => { setSelectedDiamondType(type); setDiamondTypeError(false); }}
      metal={product.metal}
    />
              {diamondTypeError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 flex items-center gap-1.5 mt-2">
                  <span>⚠</span> Please select a diamond type before continuing.
                </motion.p>
              )}
            </div>
          )}

          {/* ── ACTIONS — ALL products are MTO ── */}
          <div className="space-y-3">
            {/* Global MTO info box */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm text-amber-800 font-medium mb-0.5">
                ✦ All products are Made to Order
              </p>
              <p className="text-xs text-amber-700">
                Every piece is crafted specifically for you. Place your order via WhatsApp and our team will guide you through the process.
              </p>
            </div>

            {/* Incomplete selections warning */}
            {(!sizeReady || !diamondReady) && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <p className="text-xs text-red-700 font-medium">
                  Please complete your selection:
                </p>
                <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                  {!sizeReady && <li>• Select a {getSizeConfig(product.category)?.label?.toLowerCase()}</li>}
                  {!diamondReady && <li>• Choose a diamond type (Natural or Lab Grown)</li>}
                </ul>
              </div>
            )}

            {/* Add to Cart button — sits above the WhatsApp order button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isInCart}
              className={`w-full py-3.5 text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all duration-200 font-semibold border-2 rounded-lg ${
                isInCart
                  ? "border-green-600 bg-green-50 text-green-700 cursor-default"
                  : readyToOrder
                    ? "border-black text-black hover:bg-black hover:text-white"
                    : "border-gray-300 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isInCart ? (
                <>
                  <CheckIcon className="w-5 h-5 flex-shrink-0" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBagIcon className="w-5 h-5 flex-shrink-0" />
                  Add to Cart
                </>
              )}
            </button>
            {justAddedToCart && !isInCart && (
              <p className="text-xs text-green-700 -mt-1">✓ Added to your cart</p>
            )}

            {/* Primary WhatsApp order button */}
            <Link
              href={readyToOrder ? mtoWhatsappUrl : "#"}
              target={readyToOrder ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!readyToOrder) {
                  e.preventDefault();
                  validateAndOrder();
                }
              }}
              className={`w-full py-3.5 text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all duration-200 font-semibold ${
                readyToOrder
                  ? "bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md shadow-green-200"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {readyToOrder ? "Order on WhatsApp" : "Complete Selection to Order"}
            </Link>

            {/* Summary of selections (shown once ready) */}
            {readyToOrder && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              >
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Your order summary:</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    <span className="text-gray-400">Product:</span> {product.productName}
                  </p>
                  {selectedSize && (
                    <p className="text-xs text-gray-600">
                      <span className="text-gray-400">{getSizeConfig(product.category)?.label}:</span> {selectedSize}
                    </p>
                  )}
                  {selectedDiamondType && (
                    <p className="text-xs text-gray-600">
                      <span className="text-gray-400">Diamond:</span>{" "}
{selectedDiamondType === "natural"
  ? "💎 Natural Diamond"
  : selectedDiamondType === "lab_grown"
  ? "⚗️ Lab Grown Diamond"
  : "✨ Moissanite"}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-400">Price:</span>{" "}
                    <span className="line-through text-gray-400">{displaySymbol}{displayPrice.toLocaleString()}</span>
                    <span className="font-semibold text-black">{displaySymbol}{discountedDisplayPrice.toLocaleString()}</span>
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{DISCOUNT_PERCENT}% OFF</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="pt-4 sm:pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 text-center">
              <div><p className="text-xs sm:text-sm text-gray-500">Certified Quality</p><p className="text-xs text-gray-600">BIS Hallmarked</p></div>
              <div><p className="text-xs sm:text-sm text-gray-500">Easy Exchange</p><p className="text-xs text-gray-600">7 Day Policy</p></div>
              <div><p className="text-xs sm:text-sm text-gray-500">Authenticity</p><p className="text-xs text-gray-600">Hallmark Certified</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details accordion */}
      <div className="max-w-7xl mx-auto pb-4 md:pb-6 px-2 sm:px-4">
        <button onClick={() => setOpenInfo(!openInfo)} className="w-full flex justify-between items-center border-t border-b py-4 hover:bg-gray-50 transition-colors">
          <span className="text-base sm:text-lg font-medium">Product Details</span>
          <span className="text-xl sm:text-2xl">{openInfo ? "−" : "+"}</span>
        </button>
        {openInfo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
            <div className="py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-3">Description</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                <div><p className="text-xs sm:text-sm text-gray-500">Metal Type</p><p className="font-medium text-sm sm:text-base capitalize">{product.metal}</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Purity</p><p className="font-medium text-sm sm:text-base">{product.purity}</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Color</p><p className="font-medium text-sm sm:text-base capitalize">{product.color || "Classic"}</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Gender</p><p className="font-medium text-sm sm:text-base capitalize">{product.gender}</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Gross Weight</p><p className="font-medium text-sm sm:text-base">{product.grossWeight}g</p></div>
                <div><p className="text-xs sm:text-sm text-gray-500">Diamond Weight</p><p className="font-medium text-sm sm:text-base">{product.diamondWeight} CT</p></div>
                {!isSilver && (
                  <>
                    <div><p className="text-xs sm:text-sm text-gray-500">Net Weight</p><p className="font-medium text-sm sm:text-base">{product.netWeight}g</p></div>
                    <div><p className="text-xs sm:text-sm text-gray-500">Making Charges</p><p className="font-medium text-sm sm:text-base">₹{product.makingCharges?.toLocaleString() || 0}</p></div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4"><PriceBreakdown product={product} /></div>
      <div className="max-w-7xl mx-auto pb-8 md:pb-12 px-2 sm:px-4 mt-8"><UpdatedReviewForm productId={productId} /></div>

      {/* Login prompt */}
      {loginPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md p-6 md:p-8 relative">
            <button onClick={() => setLoginPrompt(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black"><XMarkIcon className="w-6 h-6" /></button>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to continue.</p>
            <button onClick={async () => { try { await loginWithGoogle(); setLoginPrompt(false); } catch { } }}
              className="w-full bg-black text-white py-3 md:py-4 flex items-center justify-center gap-3 hover:bg-gray-900 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}