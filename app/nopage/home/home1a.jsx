"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 2000); // 2 sec delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-screen h-[60vh] lg:h-[80vh] overflow-hidden bg-back">
      <AnimatePresence>
        {show && (
          <motion.div
            className="absolute inset-0"
            initial={{
              opacity: 0,
              y: "100%",
              scale: 1.25,
            }}
            animate={{
              opacity: 1,
              y: "0%",
              scale: 1,
            }}
            transition={{
              duration: 1.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Image
              src="/Sale02.png"
              alt="Full Screen Image"
              fill
              priority
              className="object-fit object-bottom" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}