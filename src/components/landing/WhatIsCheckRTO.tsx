"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const highlights = [
  {
    number: "01",
    title: "Gestión integral",
    description:
      "Administrá de forma ágil y centralizada las inspecciones, historiales de vehículos, reportes técnicos y certificaciones desde una única plataforma.",
  },
  {
    number: "02",
    title: "Cumplimiento normativo",
    description:
      "Diseñado para garantizar el cumplimiento del Decreto 196/25 y las exigencias normativas vigentes, con trazabilidad completa de cada operación.",
  },
  {
    number: "03",
    title: "Eficiencia operativa",
    description:
      "Reduce errores administrativos, agiliza la comunicación entre áreas y mejora la trazabilidad de cada vehículo inspeccionado.",
  },
];

const stats = [
  { 
    label: "TALLERES ACTIVOS",
    value: 10, 
    suffix: "+", 
    description: "Talleres de RTO ya confían en CheckRTO para gestionar sus operaciones diarias."
  },
  { 
    label: "INSPECCIONES",
    value: 10, 
    suffix: "k+", 
    description: "Revisiones técnicas procesadas con trazabilidad completa y sin errores."
  },
  { 
    label: "UPTIME",
    value: 99.9, 
    suffix: "%", 
    decimals: 1,
    description: "Disponibilidad garantizada para que tu taller nunca se detenga."
  },
  { 
    label: "SOPORTE",
    value: 24, 
    suffix: "/7", 
    description: "Asistencia técnica disponible cuando la necesites, siempre."
  },
];

function AnimatedCounter({
  value,
  suffix,
  decimals = 0,
  isVisible,
}: {
  value: number;
  suffix: string;
  decimals?: number;
  isVisible: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 3000; // 3.5 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      
      // Ease out effect
      const progress = step / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      current = value * easedProgress;

      setDisplayValue(current);

      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <span>
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}
      {suffix}
    </span>
  );
}

export default function WhatIsCheckRTO() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="what-is-checkrto" className="relative w-full pt-12 sm:pt-16 lg:pt-20 pb-24 sm:pb-32 lg:pb-40 overflow-hidden bg-white">
      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            <span className="text-gray-900">¿Qué es </span>
            <span className="bg-gradient-to-r from-[#0040B8] to-blue-500 bg-clip-text text-transparent">CheckRTO</span>
            <span className="text-gray-900">?</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400">
            La plataforma que moderniza tu taller.
          </p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-12 lg:mb-16 items-stretch">
          {/* Left Column - Main Message */}
          <div className="lg:sticky lg:top-32 lg:self-start flex flex-col justify-between">
            {/* Eyebrow */}
            <div className="flex mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0040B8]/5 border border-[#0040B8]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0040B8]" />
                <span className="text-xs font-medium text-[#0040B8] tracking-wide uppercase">
                  La plataforma
                </span>
              </span>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-gray-900 tracking-tight mb-8 space-y-0.5">
              <span className="block">Una solución tecnológica</span>
              <span className="block text-gray-400">de nueva generación</span>
            </h2>

            {/* Main Description */}
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              CheckRTO es una plataforma digital integral que simplifica y moderniza la gestión de los talleres de Revisión Técnica Obligatoria.
            </p>

            <p className="text-base text-gray-400 leading-relaxed mb-14">
              Con una interfaz clara, moderna y segura, optimiza cada etapa del proceso de verificación técnica, desde la carga de datos hasta la emisión de reportes finales, brindando control y transparencia total sobre la información.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#contact"
                className="group px-6 py-3.5 rounded-xl bg-[#0040B8] text-white text-sm font-semibold hover:bg-[#0035a0] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25"
              >
                Contactanos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <button
                onClick={() => {
                  const element = document.getElementById("features");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="px-6 py-3.5 rounded-xl text-gray-600 text-sm font-semibold hover:text-gray-900 transition-colors duration-300 flex items-center justify-center"
              >
                Ver características
              </button>
            </div>
          </div>

          {/* Right Column - Highlights */}
          <div className="space-y-0 flex flex-col">
            {highlights.map((item, index) => (
              <div
                key={item.number}
                className={`group py-10 ${
                  index !== highlights.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex gap-6">
                  {/* Number */}
                  <span className="text-sm font-medium text-gray-300 pt-0.5 tabular-nums">
                    {item.number}
                  </span>

                  <div className="flex-1">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#0040B8] transition-colors duration-300">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-base text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div ref={statsRef} className="pt-1 sm:pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`relative flex flex-col px-6 sm:px-8 py-8 transition-all duration-500
                  ${isStatsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                  ${index !== 0 ? "lg:border-l border-gray-200" : ""}
                  ${index < 2 ? "sm:border-b lg:border-b-0 border-gray-200" : ""}
                  ${index === 0 ? "sm:border-b lg:border-b-0 border-gray-200" : ""}
                  ${index === 1 ? "sm:border-b lg:border-b-0 border-gray-200" : ""}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Label */}
                <p className="text-xs font-medium text-[#0040B8] tracking-wider mb-2">
                  {stat.label}
                </p>
                
                {/* Value */}
                <p className="text-4xl sm:text-5xl font-medium text-gray-900 tracking-tight mb-8 tabular-nums leading-none">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    isVisible={isStatsVisible}
                  />
                </p>
                
                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed max-w-[155px]">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
