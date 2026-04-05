"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const text = "Timeless Fine Jewelry";

const CURRENCIES = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "Pound Sterling", symbol: "£" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "ISK", name: "Icelandic Krona", symbol: "kr" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
];

function CurrencyDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = CURRENCIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const current = CURRENCIES.find((c) => c.code === selected) || CURRENCIES[0];

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen((v) => !v); setSearch(""); }}
        className="
          flex items-center gap-1.5
          px-2.5 py-1.5
          border border-gray-300 rounded-full
          text-xs text-gray-600 tracking-wide
          bg-white/80 backdrop-blur-sm
          hover:border-gray-400 hover:text-gray-800
          transition-all duration-200
          select-none
        "
      >
        <span className="font-medium">{current.symbol}</span>
        <span>{current.code}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="
              absolute right-0 top-full mt-2 z-50
              w-56
              bg-white border border-gray-200 rounded-xl
              shadow-lg shadow-black/8
              overflow-hidden
            "
          >
            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                placeholder="Search currency..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full text-xs text-gray-700 placeholder-gray-400
                  bg-gray-50 border border-gray-200 rounded-lg
                  px-2.5 py-1.5 outline-none
                  focus:border-gray-400 transition-colors
                "
              />
            </div>

            {/* List */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-xs text-gray-400 text-center">No results</li>
              ) : (
                filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      onClick={() => {
                        onChange(c.code);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3.5 py-2
                        text-xs text-left transition-colors duration-100
                        ${c.code === selected
                          ? "bg-gray-50 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <span className="w-6 text-center font-medium text-gray-500 shrink-0">
                        {c.symbol}
                      </span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-gray-400 font-mono">{c.code}</span>
                      {c.code === selected && (
                        <svg className="w-3 h-3 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Page() {
  const [currency, setCurrency] = useState("INR");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("currency");
    if (saved) setCurrency(saved);
  }, []);

  // Save to localStorage and dispatch event so other components can react
  const handleCurrencyChange = (code) => {
  localStorage.setItem("currency", code);
  window.location.reload();
};

  return (
    <nav className="w-full bg-back relative">

      {/* Currency dropdown — top right corner */}
      <div className="absolute md:top-3 top-0 right-1 md:right-4 z-10">
        <CurrencyDropdown selected={currency} onChange={handleCurrencyChange} />
      </div>

      <div className="mt-4 mb-4 lg:mb-0 flex flex-col items-center justify-center gap-2 px-4">

        {/* Tagline – Letter by Letter */}
        <motion.p
          className="text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] text-gray-600 uppercase text-center flex"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.03,
              },
            },
          }}
        >
          {text.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
              }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.p>

        {/* Logo → Home */}
        <Link href="/" aria-label="Go to home">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5,
              duration: 1.2,
              ease: "easeOut",
            }}
            className="
              w-[70vw] 
              sm:w-[50vw] 
              md:w-[50vw] 
              lg:w-[30vw]
              cursor-pointer
            "
          >
            <Image
              src="/logo.webp"
              alt="Jewelry Brand Logo"
              width={400}
              height={200}
              priority
              className="w-full h-auto"
            />
          </motion.div>
        </Link>

      </div>
    </nav>
  );
}