"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  {
    title: "Premium Grade",
    subtitle: "Gold Plated Ring",
    image: "/ringbox.webp", // change this to your actual image
    link: "/rings",
  },
  {
    title: "Premium Grade",
    subtitle: "Gold Plated Bracelet",
    image: "/ringbox.webp",
    link: "/bracelets",
  },
  {
    title: "Luxury",
    subtitle: "Diamond Necklace",
    image: "/ringbox.webp",
    link: "/necklace",
  },
];

export default function HeroShowcaseSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
  className="w-full h-[350px] lg:h-[500px] flex justify-center items-center 
             bg-[radial-gradient(circle_at_center,_#9c0913_0%,_#5c0003_50%,_#4d0001_100%)]
             text-white overflow-hidden playfair border-b border-b-red-800 "
>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* TEXT */}
          <p className="text-sm text-b3 mb-1">{slides[index].title}</p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">
            {slides[index].subtitle}
          </h2>

          {/* IMAGE with link */}
          <Link href={slides[index].link}>
            <motion.img
              src={slides[index].image}
              alt={slides[index].subtitle}
              className="w-52  md:w-80 drop-shadow-xl cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </Link>

          {/* DOTS */}
          {/* <div className="flex gap-2 mt-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === index ? "bg-yellow-400" : "bg-white/30"
                }`}
              ></div>
            ))}
          </div> */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
