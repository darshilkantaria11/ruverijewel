"use client";

import { useState, useEffect, useRef } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { LiaGripLinesSolid } from "react-icons/lia";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef(null);

    const navLinks = [
        { href: "/rings", label: "RINGS" },
        { href: "/bangles", label: "BANGLES" },
        { href: "/bracelets", label: "BRACELETS" },
        { href: "/chains", label: "CHAINS" },
        { href: "/earrings", label: "EARRINGS" },
        { href: "/necklace", label: "NECKLACE" },
        { href: "/pendents", label: "PENDENTS" },
        { href: "/mencollections", label: "MEN COLLECTION" },
        { href: "/kidscollections", label: "KIDS COLLECTION" },
    ];

    /* 🔹 Animation Variants */

    // Desktop
    const desktopContainer = {
        hidden: {},
        show: {
            transition: {
                delayChildren: 1,        // ⏳ 2 seconds delay
                staggerChildren: 0.1,
            },
        },
    };

    const desktopItem = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 18,
            },
        },
    };

    // Mobile
    const mobileContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                delayChildren: 0,        // ⏳ 2 seconds delay
                staggerChildren: 0.12,
            },
        },
    };

    const mobileItem = {
        hidden: { opacity: 0, y: 40 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 18,
            },
        },
    };

    // Close search on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="w-full z-50 bg-back text-black ci ">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center h-0 md:h-16">

                    {/* 🔸 Desktop Menu */}
                    <div className="hidden md:flex items-center justify-center w-full">
                        <motion.div
                            animate={{ x: showSearch ? -130 : 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 140,
                                damping: 20,
                            }}
                        >
                            {/* INITIAL STAGGER ANIMATION */}
                            <motion.div
                                variants={desktopContainer}
                                initial="hidden"
                                animate="show"
                                className="flex items-center space-x-16"
                            >
                                {navLinks.map((item) => (
                                    <motion.div key={item.href} variants={desktopItem}>
                                        <Link
                                            href={item.href}
                                            className="hover:scale-110 transform transition font-medium uppercase tracking-wide"
                                        >
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* 🔍 Search */}
                        <div ref={searchRef} className="absolute right-4">
                            <div className="relative">
                                <button
                                    onClick={() => setShowSearch(!showSearch)}
                                    className="hover:scale-110 transform transition p-1"
                                >
                                    {/* <FiSearch className="w-5 h-5 text-black" /> */}
                                </button>

                                <AnimatePresence>
                                    {showSearch && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow-lg overflow-hidden border border-gray-300"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                className="px-4 py-2 w-58 text-gray-800 focus:outline-none"
                                                autoFocus
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* 📱 Mobile Hamburger */}
                    <div className="md:hidden fixed bottom-4 right-4 z-50">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-4 bg-blue-50 text-black rounded-full shadow-lg border border-gray-300"
                            aria-label="Toggle Menu"
                        >
                            {isOpen ? <FiX className="w-5 h-5" /> : <LiaGripLinesSolid className="w-5 h-5" />}
                        </button>
                    </div>

                </div>
            </div>

            {/* 📱 Mobile Expanded Menu */}
           <AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-40 bg-white flex flex-col md:hidden"
    >
      {/* 📱 Search Bar – Properly Placed */}
      {/* <div className="w-full px-5 pt-6">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full px-5 py-3 rounded-full border border-gray-300 shadow-sm
                     focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div> */}

      {/* 📱 Nav Links – KEEP EXACT PLACEMENT */}
      <motion.div
        variants={mobileContainer}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col justify-center items-center
                   text-center space-y-6"
      >
        {navLinks.map((item) => (
          <motion.div key={item.href} variants={mobileItem}>
            <Link
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-3xl font-medium tracking-wide
                         hover:text-gray-700 transition"
            >
              {item.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

        </nav>
    );
}
