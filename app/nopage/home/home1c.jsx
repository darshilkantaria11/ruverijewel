"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DesignerCard() {
    return (
        <div className="w-full h-[420px] lg:h-[500px]  bg-[url('/back.png')] overflow-hidden relative p-12 playfair min-h-[400px]">

            {/* TOP CONTENT */}
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <h3 className="text-2xl font-light text-white leading-snug text-left">
                        Perfect Gifts, <br />Crafted With Care
                    </h3>
                </div>

                {/* Arrow Button */}
                <Link
                    href="/products"
                    className="w-16 h-16 border border-[#a67c5b]/60 rounded-full 
                     flex items-center justify-center text-[#a67c5b] 
                     hover:bg-[#a67c5b] hover:text-black transition"
                >
                    <ArrowUpRight className="w-8 h-8" />
                </Link>
            </div>

            {/* ONLY ONE IMAGE AT THE BOTTOM */}
            <div className="absolute bottom-0 left-0 w-full z-0">
                <Image
                    src="/gift.png"
                    alt="Jewellery Gift"
                    width={700}
                    height={700}
                    className="w-full object-contain pointer-events-none select-none"
                />
            </div>
        </div>
    );
}
