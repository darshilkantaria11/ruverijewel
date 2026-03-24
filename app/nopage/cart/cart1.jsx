"use client";
export const dynamic = "force-dynamic";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import Link from "next/link";
import { XMarkIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Image from "next/image";
import Checkout from "../checkout/checkout"

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

    // ✅ Safe fallback (no destructuring crash)
    const cart = cartContext?.cart || {};
    const updateQuantity = cartContext?.updateQuantity;
    const getTotalItems = cartContext?.getTotalItems;

    const cartItems = Object.values(cart);
    // chatgpt suggestion
    // useEffect(() => {
    //     if (!cartItems.length) {
    //       setLoading(false);
    //       return;
    //     }

    //     const fetchProducts = async () => {
    //       try {
    //         const productData = {};
    //         for (const item of cartItems) {
    //           const res = await fetch(`/api/products/fetch/${item.id}`);
    //           const data = await res.json();
    //           productData[item.id] = data;
    //         }
    //         setProducts(productData);
    //       } catch (err) {
    //         console.error(err);
    //       } finally {
    //         setLoading(false);
    //       }
    //     };

    //     fetchProducts();
    //   }, [cartItems]);
    // my original code 
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productData = {};
                for (const item of cartItems) {
                    const currency = localStorage.getItem("currency") || "INR";
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

        if (cartItems.length > 0) fetchProducts();
    }, [cart]);
    if (!cartContext) return null;

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cartItems.length === 0) {
        return (
            <div className="ci min-h-screen bg-back flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
                    <Link href="/" className="inline-block bg-black text-white px-6 py-2 rounded-lg 
                    hover:bg-black/90 transition-all font-medium text-sm">
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
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="relative bg-white rounded-xl shadow-sm p-4">
                                    <button
                                        onClick={() => updateQuantity(item.id, 0)}
                                        className="absolute top-2 right-2 text-red-700 bg-white rounded-full p-1 hidden md:block"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                    {/* Mobile Layout */}
                                    <div className="block sm:hidden">
                                        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                            {products[item.id]?.img1 ? (
                                                <img
                                                    src={products[item.id].img1}
                                                    alt={products[item.id]?.productName}
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
                                            {products[item.id]?.productName ? (
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {products[item.id].productName}
                                                </h3>
                                            ) : (
                                                <Skeleton className="h-6 w-3/4 mb-2" />
                                            )}

                                            {item.name ? (
                                                <p className="text-gray-500 text-sm mt-1">
                                                    Engraved Name: {item.name}
                                                    Chain:-
                                                </p>

                                            ) : (
                                                <Skeleton className="h-4 w-1/2 mt-1" />
                                            )}
                                            {item.selectedChain && (
                                                <>
                                                    <p className="text-gray-500 text-sm mt-1">
                                                        Chain:-
                                                    </p>
                                                    <img
                                                        src={item.selectedChain}
                                                        alt="Selected Chain"
                                                        className="w-24 h-20 object-cover"
                                                    />
                                                </>
                                            )}


                                            <div className="mt-4 flex justify-between items-center">
                                                {item.price ? (
                                                    <p className="text-xl font-bold text-black">{products[item.id]?.currencySymbol || "₹"}{(products[item.id]?.totalPrice || item.price) * item.quantity}</p>
                                                ) : (
                                                    <Skeleton className="h-6 w-20" />
                                                )}
                                                <div className="flex items-center gap-2 border-2 border-black rounded-lg px-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 text-black"
                                                    >
                                                        <MinusIcon className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-lg font-medium w-6 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 text-black"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden sm:flex gap-4">
                                        <div className="relative flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                                            {products[item.id]?.img1 ? (
                                                <img
                                                    src={products[item.id].img1}
                                                    alt={products[item.id]?.productName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Skeleton className="w-full h-full" />
                                            )}
                                            {/* <button
                                            onClick={() => updateQuantity(item.id, 0)}
                                            className="absolute top-2 right-2 text-red-700 bg-white rounded-full p-1"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button> */}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    {products[item.id]?.productName ? (
                                                        <h3 className="text-lg font-semibold text-gray-800">
                                                            {products[item.id].productName}
                                                        </h3>
                                                    ) : (
                                                        <Skeleton className="h-6 w-64 mb-2" />
                                                    )}



                                                    {item.selectedChain && (
                                                        <>
                                                            <p className="text-gray-500 text-sm mt-1">
                                                                Chain:-
                                                            </p>
                                                            <img
                                                                src={item.selectedChain}
                                                                alt="Selected Chain"
                                                                className="w-24 h-20 object-cover"
                                                            />
                                                        </>
                                                    )}

                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-between items-center">
                                                {item.price ? (
                                                    <p className="text-xl font-bold text-black">{products[item.id]?.currencySymbol || "₹"}{(products[item.id]?.totalPrice || item.price) * item.quantity}</p>
                                                ) : (
                                                    <Skeleton className="h-6 w-20" />
                                                )}
                                                <div className="flex items-center gap-3 border-2 border-black rounded-lg px-3">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 text-black"
                                                    >
                                                        <MinusIcon className="h-5 w-5" />
                                                    </button>
                                                    <span className="text-lg font-medium w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 text-black"
                                                    >
                                                        <PlusIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-xl shadow-sm p-4 lg:sticky lg:top-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
                            <div className="space-y-3">
                                <div className="border-t pt-3 mt-3">
                                    <div className="flex justify-between text-lg font-bold text-gray-800">
                                        <span>Estimated Total</span>
                                        <span>{Object.values(products)[0]?.currencySymbol || "₹"}{subtotal}</span>
                                    </div>
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
                                className="w-full bg-black text-white py-3 rounded-lg mt-6
        hover:bg-black transition-colors flex items-center justify-center gap-3 font-semibold text-lg tracking-wide"
                            >
                                Checkout

                                <div className="relative flex items-center ">
                                    <img
                                        src="/paytm.svg"
                                        alt="Paytm"
                                        className="w-6 h-6 bg-white rounded-full p-0 border shadow-sm z-30 relative"
                                    />
                                    <img
                                        src="/phonepe.svg"
                                        alt="PhonePe"
                                        className="w-6 h-6 bg-white rounded-full p-0 border shadow-sm -ml-2 z-20 relative"
                                    />
                                    <img
                                        src="/gpay.svg"
                                        alt="Google Pay"
                                        className="w-6 h-6 bg-white rounded-full p-0 border shadow-sm -ml-2 z-10 relative"
                                    />
                                </div>
                            </motion.button>


                            <p className="text-center text-xs text-gray-500 mt-3">Secure checkout process</p>
                        </div>
                    </div>

                    {/* Continue Shopping */}
                    <div className="mt-6 text-center">
                        <Link href="/shop" className="text-black hover:text-black/80 font-medium text-sm">
                            ← Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
            {showCheckoutPopup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-2">
                    <div className="bg-white w-full max-w-xl md:rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto md:w-[90%] sm:max-w-md sm:mx-auto sm:my-8 sm:p-6 sm:rounded-lg shadow-xl">
                        <button
                            onClick={() => setShowCheckoutPopup(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-bold ">Checkout</h2>
                        {/* You can replace this with actual CheckoutForm component */}
                        <Checkout />
                        {/* <p className="text-sm text-gray-600">Checkout form or payment options will go here...</p> */}
                    </div>
                </div>
            )}
        </>
    );
}