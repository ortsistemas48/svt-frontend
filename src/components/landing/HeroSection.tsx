"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

export default function HeroSection() {
  return (
    <main id="hero" className="w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-12 lg:pb-16">
      {/* Small button above heading */}
      <div className="flex justify-center mb-8 sm:mb-10 mt-2 sm:mt-3">
        <div className="relative">
          <button
            onClick={() => {
              const element = document.getElementById("what-is-checkrto");
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="relative px-3 py-1.5 rounded-[10px] bg-white border border-transparent ring-1 ring-inset ring-[#DEDEDE] hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors duration-200 overflow-hidden"
          >
            <span className="relative z-30 flex items-center gap-1.5">
              ¿Cómo funciona CheckRTO?
              <ArrowRight size={14} />
            </span>

            <BorderBeam
              duration={4}
              colorFrom="#0040B8"
              colorTo="#0040B833"
              borderWidth={2}
              className="pointer-events-none absolute -inset-[0.5px] z-20"
            />
          </button>
        </div>
      </div>

      {/* Main Heading */}
      <div className="text-center mb-5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-gray-900 leading-tight">
          Gestioná tu taller con un flujo claro.
        </h1>
      </div>

      {/* Description */}
      <div className="text-center mb-6 sm:mb-8 max-w-2xl mx-auto">
        <p className="text-xs sm:text-sm lg:text-base text-[#808080] leading-relaxed">
          Desde el ingreso del vehículo hasta la entrega, nos encargamos del flujo completo y agilizamos cada paso para que tu taller trabaje más rápido, ordenado y sin errores.
        </p>
      </div>

      {/* CTA Buttons - uno al lado del otro en todos los tamaños */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12 sm:mb-16 lg:mb-20">
        <Link
          href="#contact"
          className="px-4 py-2 sm:px-5 rounded-[10px] bg-[#0040B8] hover:bg-[#0035a0] text-white text-sm font-medium transition-colors duration-200 text-center"
        >
          Contactanos
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 sm:px-5 rounded-[10px] bg-white border border-[#DEDEDE] hover:bg-gray-50 text-[#808080] text-sm font-medium transition-colors duration-200 text-center"
        >
          Iniciar sesión
        </Link>
      </div>

      {/* Image Section */}
      <div className="w-full flex justify-center mt-2 sm:mt-3">
        <div className="relative w-full max-w-[1064px] aspect-[1064/599] bg-gray-100 rounded-t-[20px] overflow-hidden">
          <Image
            src="/images/Statistics.png"
            alt="Check RTO Demo"
            width={1064}
            height={599}
            className="w-full h-full object-cover"
            priority
          />
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 100%)'
            }}
          />
        </div>
      </div>
    </main>
  );
}
