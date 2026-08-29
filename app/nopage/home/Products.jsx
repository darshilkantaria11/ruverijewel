"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGoogleAuth } from "../components/useGoogleAuth";

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`bg-gray-200 rounded-lg relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
  </div>
);

const ProductSkeleton = () => (
  <div className="overflow-hidden">
    <Skeleton className="w-full aspect-square" />
    <div className="py-4 px-1 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
    </div>
  </div>
);

const imageCache = new Set();

const CachedImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(() => imageCache.has(src));

  const handleLoad = useCallback(() => {
    imageCache.add(src);
    setLoaded(true);
  }, [src]);

  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 w-full h-full" />}
      <img
        src={src}
        alt={alt}
        className={className}
        data-loaded={loaded ? "true" : "false"}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
      />
    </>
  );
};

// Square container on every screen size — width drives the height via
// aspect-square, so square source images are shown in full with no crop.
const HoverImageContainer = ({ img1, img2, alt }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative w-full aspect-square overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute inset-0 w-full h-full"
        style={{ opacity: hovered ? 0 : 1, transition: "opacity 0.5s ease" }}
      >
        <CachedImage src={img1} alt={alt} className="w-full h-full object-cover" />
      </div>
      <div
        className="absolute inset-0 w-full h-full"
        style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <CachedImage src={img2} alt={`${alt} alt`} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

// ─── Filter persistence helpers ─────────────────────────────────────────────
// Filters are saved to sessionStorage keyed by category, so navigating to a
// product detail page and hitting back restores exactly what was selected —
// they clear naturally when the tab is closed.
const getFilterStorageKey = (category) => `ruveri_product_filters_${category}`;

const loadSavedFilters = (category) => {
  if (typeof window === "undefined") return { purities: [], sort: null };
  try {
    const raw = sessionStorage.getItem(getFilterStorageKey(category));
    if (!raw) return { purities: [], sort: null };
    const parsed = JSON.parse(raw);
    return {
      purities: Array.isArray(parsed.purities) ? parsed.purities : [],
      sort: parsed.sort ?? null,
    };
  } catch {
    return { purities: [], sort: null };
  }
};

const saveFilters = (category, purities, sort) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      getFilterStorageKey(category),
      JSON.stringify({ purities, sort })
    );
  } catch {
    // sessionStorage unavailable (private mode, etc.) — fail silently
  }
};

export default function Products({ category, title }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limit = 26;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const { loginWithGoogle, getLoggedInUser } = useGoogleAuth();

  // Initialize from sessionStorage (if this category has saved filters) so a
  // fresh mount — e.g. coming back from a product detail page — restores them.
  const [selectedFilter, setSelectedFilter] = useState(() => loadSavedFilters(category).sort);
  const [selectedPurities, setSelectedPurities] = useState(() => loadSavedFilters(category).purities);

  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  const purityOptions = ["9K", "14K", "18K", "925 Silver"];

  // Re-sync filters whenever the category itself changes (component instance
  // reused across category pages), since the lazy useState initializer above
  // only runs once per mount.
  const prevCategoryRef = useRef(category);
  useEffect(() => {
    if (prevCategoryRef.current === category) return;
    prevCategoryRef.current = category;
    const saved = loadSavedFilters(category);
    setSelectedPurities(saved.purities);
    setSelectedFilter(saved.sort);
  }, [category]);

  // Persist filters any time they change, per category.
  useEffect(() => {
    saveFilters(category, selectedPurities, selectedFilter);
  }, [category, selectedPurities, selectedFilter]);

  // ─── Active purity sent to API ─────────────────────────────────────────────
  // This is the key fix: purity filtering is done by the API/database,
  // NOT by filtering the already-fetched client-side array.
  //
  // Rules:
  //   • User selected purities       → send those purities to API
  //   • Price sort + nothing selected → send nothing (fetch all purities)
  //   • Default (no selection, no price sort) → send "14K" to API
  const activePurityParam = useMemo(() => {
    const isPriceSort = selectedFilter === "price_low_high" || selectedFilter === "price_high_low";
    if (selectedPurities.length > 0) return selectedPurities.join(",");
    if (isPriceSort) return ""; // all purities — let price sort work across them
    return "925 Silver";               // default: only show 14K
  }, [selectedPurities, selectedFilter]);

  const togglePurity = (purity) => {
    setSelectedPurities(prev =>
      prev.includes(purity) ? prev.filter(p => p !== purity) : [...prev, purity]
    );
  };

  // ─── Wishlist ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const initWishlist = async () => {
      const user = getLoggedInUser();
      if (user?.email) {
        const cached = localStorage.getItem("wishlist");
        if (cached) {
          try { setWishlist(JSON.parse(cached).map(id => String(id))); } catch { }
        }
        await fetchWishlist(user.email);
      } else {
        setWishlist([]);
        setWishlistLoading(false);
        localStorage.removeItem("wishlist");
      }
    };
    initWishlist();
    window.addEventListener("storage", initWishlist);
    return () => window.removeEventListener("storage", initWishlist);
  }, []);

  const fetchWishlist = async (userEmail, { silent = false } = {}) => {
    if (!silent) setWishlistLoading(true);
    try {
      if (!userEmail) { setWishlist([]); localStorage.removeItem("wishlist"); return; }
      const res = await fetch(`/api/wishlist?userEmail=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      const data = await res.json();
      const ids = Array.isArray(data.wishlist) ? data.wishlist.map(item => String(item.productId)) : [];
      setWishlist(ids);
      localStorage.setItem("wishlist", JSON.stringify(ids));
    } catch (error) {
      console.error("Wishlist fetch error:", error);
    } finally {
      if (!silent) setWishlistLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    let user = getLoggedInUser();
    if (!user?.email) {
      try {
        user = await loginWithGoogle();
        if (!user?.email) return;
      } catch { return; }
    }
    const idStr = String(productId);
    const currentlyIn = wishlist.includes(idStr);
    const prevWishlist = [...wishlist];
    const nextWishlist = currentlyIn ? prevWishlist.filter(id => id !== idStr) : [...prevWishlist, idStr];
    setWishlist(nextWishlist);
    localStorage.setItem("wishlist", JSON.stringify(nextWishlist));
    try {
      const res = await fetch("/api/wishlist", {
        method: currentlyIn ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email, productId }),
      });
      if (!res.ok) {
        setWishlist(prevWishlist);
        localStorage.setItem("wishlist", JSON.stringify(prevWishlist));
      }
    } catch {
      setWishlist(prevWishlist);
      localStorage.setItem("wishlist", JSON.stringify(prevWishlist));
    }
  };

  // ─── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Reset + re-fetch when category or active purity param changes ─────────
  // Changing purity pill or sort resets to page 1 and hits the API fresh —
  // never relies on filtering already-loaded client data.
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [category, activePurityParam]);

  // ─── Fetch from API with purity baked into query ───────────────────────────
  useEffect(() => {
    if (category) fetchProducts();
  }, [page, category, activePurityParam]);

  const fetchProducts = async () => {
    try {
      const currency = localStorage.getItem("currency") || "INR";
      let url = `/api/products?page=${page}&limit=${limit}&category=${encodeURIComponent(category)}&currency=${currency}`;
      if (activePurityParam) url += `&purity=${encodeURIComponent(activePurityParam)}`;

      const res = await fetch(url, {
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY },
      });
      const data = await res.json();
      if (data.length < limit) setHasMore(false);
      setProducts(prev => {
        const seen = new Set(prev.map(p => p._id));
        return [...prev, ...data.filter(p => !seen.has(p._id))];
      });
    } catch (e) {
      console.error("Error loading products:", e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Client-side sort only (filtering is now server-side) ─────────────────
  const displayProducts = useMemo(() => {
    const result = [...products];
    if (selectedFilter === "price_low_high") {
      result.sort((a, b) => (a.totalPrice ?? 0) - (b.totalPrice ?? 0));
    } else if (selectedFilter === "price_high_low") {
      result.sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0));
    } else if (selectedFilter === "alphabetical") {
      result.sort((a, b) => (a.productName ?? "").localeCompare(b.productName ?? ""));
    }
    return result;
  }, [products, selectedFilter]);

  const loadMore = () => { if (hasMore && !loading) setPage(prev => prev + 1); };

  return (
    <div className="bg-back ci my-6">
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <div className="container mx-auto px-6">

        {/* ── Header ── */}
        <div className="mb-8">
          {title && (
            <motion.h1
              className="hidden md:flex text-2xl md:text-4xl font-bold justify-left items-center text-black tracking-wide"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {title}
            </motion.h1>
          )}

          <div className="flex flex-row justify-between items-center mb-4">
            {title && (
              <motion.h1
                className="md:hidden text-2xl md:text-4xl font-bold text-black tracking-wide"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {title}
              </motion.h1>
            )}

            {/* Purity pills — desktop */}
            {!loading && (
              <div className="hidden md:flex mt-4 md:mt-0">
                <div className="flex flex-wrap gap-2">
                  {purityOptions.map(purity => (
                    <button
                      key={purity}
                      onClick={() => togglePurity(purity)}
                      className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${selectedPurities.includes(purity)
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-gray-300 hover:border-black"
                        }`}
                    >
                      {purity}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort filter dropdown */}
            {!loading && (
              <div className="flex justify-end md:justify-normal">
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <span>
                      {selectedFilter === "price_low_high" ? "Price: Low → High"
                        : selectedFilter === "price_high_low" ? "Price: High → Low"
                          : selectedFilter === "alphabetical" ? "A → Z"
                            : "Filter"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10 border border-gray-200 overflow-hidden"
                    >
                      {[
                        { key: "price_low_high", label: "Price: Low to High" },
                        { key: "price_high_low", label: "Price: High to Low" },
                        { key: "alphabetical", label: "Alphabetical Order" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => { setSelectedFilter(key); setIsFilterOpen(false); }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedFilter === key ? "bg-gray-50 font-medium" : ""
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                      {selectedFilter && (
                        <button
                          onClick={() => { setSelectedFilter(null); setIsFilterOpen(false); }}
                          className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-200"
                        >
                          Clear Filter
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Purity pills — mobile */}
          {!loading && (
            <div className="md:hidden mt-4">
              <div className="flex flex-wrap gap-2">
                {purityOptions.map(purity => (
                  <button
                    key={purity}
                    onClick={() => togglePurity(purity)}
                    className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${selectedPurities.includes(purity)
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300 hover:border-black"
                      }`}
                  >
                    {purity}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Empty state ── */}
        {!loading && displayProducts.length === 0 && (
          <div className="text-center py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-md mx-auto"
            >
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">No Products Available</h3>
              <p className="text-gray-500 mb-6">
                {selectedPurities.length > 0
                  ? `No products found with ${selectedPurities.join(", ")} purity`
                  : "No products found in this category"}
              </p>
              <Link href="/" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Home
              </Link>
            </motion.div>
          </div>
        )}

        {/* ── Initial skeleton ── */}
        {loading && products.length === 0 && (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        )}

        {/* ── Product grid ── */}
        {displayProducts.length > 0 && (
          <motion.div
            className="grid gap-6 grid-cols-2 md:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {displayProducts.map((product, index) => {
              if (wishlistLoading) return <ProductSkeleton key={product._id} />;

              const isInWishlist = wishlist.includes(String(product._id));

              return (
                <motion.div
                  key={product._id}
                  className="relative overflow-hidden hover:shadow-2xl transition-shadow duration-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index % 20, 7) * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product._id); }}
                    className="absolute top-2 right-2 z-10 p-2 bg-back rounded-full backdrop-blur-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 transition-colors ${isInWishlist ? "text-red-500 fill-current" : "text-black stroke-current fill-none"}`}
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>

                  <Link href={`/products/${product._id}`}>
                    <div>
                      <HoverImageContainer
                        img1={product.img1}
                        img2={product.img2}
                        alt={product.productName}
                      />
                      <div className="py-4 px-1 text-start">
                        <h2 className="text-sm lg:text-lg font-semibold text-black">{product.productName}</h2>
                        <div className="flex justify-start items-center gap-2 flex-wrap">
                          <p className="text-xs lg:text-sm text-gray-400 line-through">
                            {product.currencySymbol || "₹"}{(product.totalPrice ?? 0).toLocaleString()}
                          </p>
                          <p className="text-md lg:text-xl text-black font-semibold">
                            {product.currencySymbol || "₹"}
                            {Math.round((product.totalPrice ?? 0) * 0.85).toLocaleString()}
                          </p>
                          <span className="text-[10px] lg:text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            15% OFF
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {loading && [...Array(4)].map((_, i) => <ProductSkeleton key={`skel-${i}`} />)}
          </motion.div>
        )}

        {/* Load more */}
        {hasMore && !loading && displayProducts.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-black/90 transition-all"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}