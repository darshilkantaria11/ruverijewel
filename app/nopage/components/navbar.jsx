"use client";

import { useState, useEffect, useRef } from "react";
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../../public/logo.png";
import UserPopup from "./userpopup";
import Searchbar from "./searchbar";
import { ChevronRight } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", phone: "" });
  const [showSearch, setShowSearch] = useState(false);

  const userRef = useRef(null);
  const searchRef = useRef(null);

  const checkUserLogin = async () => {
    const stored = localStorage.getItem("user");

    if (!stored) return;

    const parsed = JSON.parse(stored);
    const { phone, token } = parsed;

    if (!phone || !token) return;

    try {
      const res = await fetch(`/api/verifyuser?number=${phone}&token=${token}`);
      if (!res.ok) throw new Error("Invalid user");

      const data = await res.json();

      const verifiedUser = {
        name: data.user.name,
        phone: data.user.number,
        token,
        addresses: data.user.addresses || [],
      };

      setUser({ name: verifiedUser.name, phone: verifiedUser.phone });
      setIsLoggedIn(true);
    } catch (err) {
      console.warn("Verification failed:", err);
      localStorage.removeItem("user");
      setUser({ name: "", phone: "" });
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkUserLogin();

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    // Close search when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserClick = () => {
    checkUserLogin();
    setShowUserPopup((prev) => !prev);
  };

  const handleLoginSuccess = ({ name, phone }) => {
    const userData = { name, phone };
    setUser(userData);
    setIsLoggedIn(true);
    setShowUserPopup(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser({ name: "", phone: "" });
    setShowUserPopup(false);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${isScrolled
          ? "bg-white/10 backdrop-blur-md text-b3 shadow-sm font-normal "
          : "bg-transparent text-white font-extralight"
        }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left Side */}
          <div className="flex-shrink-0 hover:scale-110 transform transition">
            <Link href="/" className="text-lg font-bold">
              <Image
                src={Logo}
                alt="Logo"
                className="h-auto lg:w-16 p-2 w-8"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links - Center */}
          <div className="hidden md:flex items-center space-x-8 mx-auto">
            <Link
              href="/rings"
              className="hover:scale-110 transform transition "
            >
              RINGS
            </Link>
            <Link
              href="/bangles"
              className="hover:scale-110 transform transition "
            >
              BANGLES
            </Link>
            <Link
              href="/bracelets"
              className="hover:scale-110 transform transition "
            >
              BRACELETS
            </Link>
            <Link
              href="/chains"
              className="hover:scale-110 transform transition "
            >
              CHAINS
            </Link>
            <Link
              href="/earrings"
              className="hover:scale-110 transform transition "
            >
              EARRINGS
            </Link>
            <Link
              href="/necklace"
              className="hover:scale-110 transform transition "
            >
              NECKLACE
            </Link>
            <Link
              href="/pendents"
              className="hover:scale-110 transform transition "
            >
              PENDENTS
            </Link>
            <Link
              href="/mencollections"
              className="hover:scale-110 transform transition "
            >
              MEN COLLECTION
            </Link>
          </div>

          {/* Right Side - Search, User, Cart */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative" ref={searchRef}>
              {/* Search Icon - Always Visible */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="hover:scale-110 transform transition p-2"
              >
                <FiSearch className={`w-5 h-5 ${isScrolled ? "text-b3" : "text-white"}`} />
              </button>

              {/* Expandable Search Bar */}
              <AnimatePresence>
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-b2 rounded-full shadow-lg overflow-hidden border-2 border-b1"
                  >
                    <input
                      type="text"
                      placeholder="Search..."
                      className="px-4 py-2 w-64 text-gray-800 focus:outline-none"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            {isLoggedIn && (
              <Link
                href="/wishlist"
                className="hover:scale-110 transform transition relative"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-5 h-5 ${isScrolled ? "text-b3" : "text-white"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </Link>
            )}

            {/* User Icon */}
            <div
              ref={userRef}
              onClick={handleUserClick}
              className="hover:scale-110 transform transition cursor-pointer relative"
            >
              <FiUser className={`w-5 h-5 ${isScrolled ? "text-b3" : "text-white"}`} />
              <AnimatePresence>
                {isLoggedIn && showUserPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-10 z-50 w-48 bg-white shadow-xl rounded-md overflow-hidden border border-gray-200"
                  >
                    <div className="px-4 py-3 text-sm font-semibold text-gray-800 border-b">
                      👋 Hi, {user.name}
                    </div>
                    <Link
                      href="/my-orders"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setShowUserPopup(false)}
                    >
                      🧾 My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-100 transition"
                    >
                      🚪 Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? (
                <FiX className={`w-5 h-5 ${isScrolled ? "text-black" : "text-white"}`} />
              ) : (
                <FiMenu className={`w-5 h-5 ${isScrolled ? "text-black" : "text-white"}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-white/20 backdrop-blur-lg border-t border-white/10 flex flex-col justify-center items-center space-y-8 md:hidden"
          >
            {/* Close Button (Top-Right) */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-b1 hover:scale-110 transition-transform"
              aria-label="Close Menu"
            >
              <FiX className="w-7 h-7" />
            </button>

            {/* Menu Links */}
            <div className="text-center space-y-6">
              {[
                { href: "/rings", label: "RINGS" },
                { href: "/bangles", label: "BANGLES" },
                { href: "/bracelets", label: "BRACELETS" },
                { href: "/chains", label: "CHAINS" },
                { href: "/earrings", label: "EARRINGS" },
                { href: "/necklace", label: "NECKLACE" },
                { href: "/pendents", label: "PENDENTS" },
                { href: "/mencollections", label: "MEN COLLECTION" },

              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center text-b1 text-3xl tracking-wide underline underline-offset-8 hover:text-white/80 transition-all group"
                >
                  {item.label}
                  <ChevronRight
                    className="ml-2 w-5 h-5 text-b1 opacity-70 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Popup */}
      {!isLoggedIn && showUserPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <UserPopup
            onClose={() => setShowUserPopup(false)}
            onSuccess={handleLoginSuccess}
          />
        </div>
      )}
    </nav>
  );
}