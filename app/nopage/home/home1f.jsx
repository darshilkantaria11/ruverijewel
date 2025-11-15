"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DesignerCard() {
    return (
        <div className="w-full h-[350px] lg:h-[450px] mt-10  bg-red-200/20 overflow-hidden relative p-8 playfair">

            {/* TOP CONTENT */}
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <h3 className="text-lg md:text-3xl font-light text-b3 leading-snug text-left">
                        Bracelets
                    </h3>
                </div>

                <Link
                    href="/products"
                    className="w-16 h-16 border border-b3 rounded-full 
                     flex items-center justify-center text-b3
                     hover:bg-b3 hover:text-red-800 transition"
                >
                    <ArrowUpRight className="w-8 h-8" />
                </Link>
            </div>

            {/* IMAGE FIXED WITHOUT CROPPING */}
            <div className="absolute bottom-0 left-0 w-full flex justify-center z-0">
                <Image
                    src="/ringmodel1.webp"
                    alt="Jewellery Gift"
                    width={600}
                    height={600}
                    className="max-h-[250px] md:max-h-[330px] object-contain"
                />
            </div>
        </div>
    );
}
