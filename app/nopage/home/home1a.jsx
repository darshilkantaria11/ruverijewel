'use client';

import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[50vh] md:min-h-screen bg-[url('/bg.webp')]  text-center px-6 overflow-hidden">
      {/* Background silk texture (optional if you have one) */}
      <div className="absolute inset-0 bg-cover bg-center opacity-20"></div>

      {/* Content */}
      <div className="relative z-10 ">
        <p className="text-sm tracking-[0.25em] text-[#d7c2a3] font-poppins uppercase mb-4">
          Exquisite Craftsmanship
        </p>

        <h1 className="text-4xl playfair lg:text-7xl font-playfair font-medium text-[#f4e9d5] leading-tight">
          <span className="block"><span className='italic' >Unleash</span> the</span>
          <span className="block">
            shining{''}
            <span className="inline-block align-middle">
              <Image
                src="/ring.png"
                alt="Ring"
                width={80}
                height={80}
                className="inline-block mx-2"
              />
            </span>{''}
            beauty
          </span>
        </h1>

        {/* CTA Button */}
        <div className="mt-10 flex justify-center">
  <button
    className="group flex items-center gap-3 shine-button
      bg-[url('/bgl.webp')] bg-cover bg-center bg-no-repeat 
      border border-[#d7c2a3]/40 text-white font-semibold 
      rounded-full px-6 py-3 text-sm font-poppins 
      backdrop-blur-sm hover:bg-[#d7c2a3] 
      transition-all duration-300"
    style={{ backgroundSize: '100% auto' }}
  >
    Find a Store
    <ArrowUpRight className="w-5 h-5" />
  </button>
</div>


      </div>
    </section>
  );
}
