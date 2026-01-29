"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="relative w-full py-20 sm:py-28 lg:py-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main Card */}
        <div className="relative rounded-[32px] overflow-hidden">
          {/* Card background with gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0040B8]/5 via-transparent to-[#0040B8]/10" />
          <div className="absolute inset-[1px] rounded-[31px] bg-gradient-to-b from-white via-gray-50/80 to-white" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#0040B8]/8 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-blue-100/60 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(#0040B8 1px, transparent 1px), linear-gradient(90deg, #0040B8 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Gradient Sweep Border */}
          <div 
            className="absolute -inset-[2px] rounded-[34px] z-20 pointer-events-none"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 160deg, #0040B8 180deg, #60a5fa 200deg, #0040B8 220deg, transparent 240deg, transparent 360deg)`,
              mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              maskComposite: `exclude`,
              WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              WebkitMaskComposite: `xor`,
              padding: `2px`,
              animation: `gradient-sweep 8s linear infinite`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-14 sm:py-16 lg:py-20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-16">
              {/* Left side - Text */}
              <div className="lg:max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0040B8]/5 border border-[#0040B8]/20 mb-6 animate-neon-glow">
                  <Sparkles className="w-3.5 h-3.5 text-[#0040B8]" />
                  <span className="text-xs text-[#0040B8] font-medium tracking-wide">DISPONIBLE AHORA</span>
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
                  ¿Listo para transformar{" "}
                  <span className="bg-gradient-to-r from-[#0040B8] to-blue-500 bg-clip-text text-transparent">tu taller?</span>
                </h2>

                {/* Description */}
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
                  Unite a los talleres que ya optimizaron su gestión con CheckRTO. 
                  Implementación rápida, soporte dedicado, sin costo de setup.
                </p>
              </div>

              {/* Right side - CTA */}
              <div className="flex flex-col gap-4 lg:items-end w-full lg:w-auto">
                <Link
                  href="#contact"
                  className="group relative px-8 py-4 rounded-2xl bg-[#0040B8] text-white text-base font-semibold hover:bg-[#0035a0] transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] w-full lg:w-[200px]"
                >
                  <span>Contactanos</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl bg-white border border-gray-200 text-gray-600 text-base font-semibold hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-300 flex items-center justify-center w-full lg:w-[200px]"
                >
                  Iniciar sesión
                </Link>

                {/* Mini stats */}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>50+ talleres activos</span>
                  </div>
                  <div className="w-px h-3 bg-gray-200" />
                  <span>99.9% uptime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#0040B8]/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
