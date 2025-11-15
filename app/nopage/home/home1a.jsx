'use client';

import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import Side1 from "./home1b"
import Side2 from "./home1c"
import Side3 from "./homedown"

export default function HeroSection() {
  return (
    <section
      className="flex flex-col lg:flex-row justify-around min-h-[50vh] md:min-h-screen bg-[url('/bgr1.webp')] bg-no-repeat bg-cover bg-top text-center px-6 overflow-hidden"
    >

      {/* Background silk texture (optional if you have one) */}
      {/* <div className="absolute inset-0 bg-cover bg-center opacity-20"></div> */}

      {/* Content */}
      <div className="flex flex-col justify-between z-10 lg:w-2/3 mt-16 lg:mt-28 min-h-[50vh] md:min-h-screen mr-4">
        <div className="flex flex-col mb-8">
          <p className="text-xs md:text-sm tracking-[0.25em] text-[#d7c2a3] font-poppins uppercase mb-4">
            Exquisite Craftsmanship
          </p>

          <h1 className="text-3xl playfair lg:text-8xl font-playfair font-medium text-[#f4e9d5] leading-tight">
            <span className="block"><span className='italic' >Unleash</span> the</span>
            <span className="block">
              shining{''}
              <span className="inline-block align-middle ">
                <Image
                  src="/ring.png"
                  alt="Ring"
                  width={80}
                  height={80}
                  className="inline-block mx-2 w-12 md:w-24"
                />
              </span>{''}
              beauty
            </span>
          </h1>

          {/* CTA Button */}
          <div className="mt-4 lg:mt-10 flex justify-center">
            <button
              className="group flex items-center gap-3 shine-button bg-[url('/bgr2.webp')] bg-cover bg-center bg-no-repeat   border border-[#d7c2a3]/40 text-white font-semibold  rounded-full px-6 py-3 text-sm font-poppins  backdrop-blur-sm hover:bg-[#d7c2a3]  transition-all duration-300"
              style={{ backgroundSize: '100% auto' }}
            >
              Find a Store
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Side3 />


      </div>
      <div className="flex flex-col lg:w-1/3 mt-20">
        <Side1 />
        <Side2 />
      </div>
    </section>
  );
}
