"use client";

import { useState, useEffect, useRef } from "react";

const stats = [
  {
    value: 10,
    suffix: "+",
    label: "Talleres activos",
  },
  {
    value: 10000,
    suffix: "+",
    label: "Inspecciones",
    formatNumber: true,
  },
  {
    value: 3,
    suffix: "x",
    label: "Más rápido",
  },
  {
    value: 99.9,
    suffix: "%",
    label: "Uptime",
    decimals: 1,
  },
];

function AnimatedCounter({
  value,
  suffix,
  decimals = 0,
  formatNumber = false,
  isVisible,
}: {
  value: number;
  suffix: string;
  decimals?: number;
  formatNumber?: boolean;
  isVisible: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
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

  const formattedValue = formatNumber
    ? Math.round(displayValue).toLocaleString()
    : decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue);

  return (
    <span>
      {formattedValue}
      {suffix}
    </span>
  );
}

export default function GrowthSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Disconnect after first trigger to prevent re-animation
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of section is visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full min-h-[500px] sm:min-h-[580px] lg:min-h-[650px] overflow-hidden bg-white"
    >
      {/* Chart - Full width, positioned absolutely behind content */}
      <div className="absolute inset-0 w-full h-full">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-full h-px bg-gray-900"
              style={{ top: `${i * 10}%` }}
            />
          ))}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute h-full w-px bg-gray-900"
              style={{ left: `${i * 8.33}%` }}
            />
          ))}
        </div>

        {/* SVG Curve */}
        <svg 
          viewBox="0 0 1200 600" 
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <style>{`
              @keyframes drawPath {
                from {
                  stroke-dashoffset: 2000;
                }
                to {
                  stroke-dashoffset: 0;
                }
              }
              .animated-path {
                stroke-dasharray: 2000;
                stroke-dashoffset: 2000;
              }
              .animated-path.animate {
                animation: drawPath 3.5s ease-out forwards;
              }
            `}</style>
          </defs>
          {/* Main exponential curve - smooth exponential */}
          <path
            d="M 0,580 
               Q 400,575 600,560 
               Q 800,540 900,470 
               Q 1000,400 1080,250 
               Q 1140,120 1200,-50"
            stroke="#0040B8"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className={`animated-path ${isVisible ? 'animate' : ''}`}
          />
        </svg>
        
        {/* Fade to white at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, white 0%, transparent 100%)'
          }}
        />
      </div>

      {/* Content - positioned on top of chart */}
      <div className="relative z-10 max-w-6xl mx-auto pl-4 sm:pl-6 lg:pl-8 pr-6 sm:pr-8 lg:pr-12 pt-16 sm:pt-20 lg:pt-24">
        {/* Header */}
        <div className="mb-12 sm:mb-14 max-w-[54rem]">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.2] tracking-tight">
            <span className="text-gray-900">Alto rendimiento, a cualquier escala. </span>
            <span className="text-gray-400">
              Más inspecciones, más velocidad. CheckRTO sostiene y mejora tu performance a medida que tu operación crece.
            </span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-md">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Vertical line */}
              <div className="w-[2px] h-14 bg-gradient-to-b from-[#0040B8] to-[#0040B8]/10 rounded-full flex-shrink-0" />
              
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight leading-none">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    formatNumber={stat.formatNumber}
                    isVisible={isVisible}
                  />
                </p>
                <p className="text-sm text-gray-400 mt-1.5">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
