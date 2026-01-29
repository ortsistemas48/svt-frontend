"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingHeader() {
  return (
    <header className="w-full h-16 sm:h-18 lg:h-20 py-0 sm:py-0 lg:py-0 mt-[-12px] sm:mt-[-16px] lg:mt-[-20px] flex items-center justify-between sticky top-0 z-20 bg-white/90 backdrop-blur-sm">
      {/* Logo */}
      <button
        onClick={() => {
          const element = document.getElementById("hero");
          if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset arriba
            
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }}
        className="flex items-center ml-20 sm:ml-28 lg:ml-36 cursor-pointer"
      >
        <Image
          src="/images/Group 8.svg"
          alt="Check RTO Logo"
          width={140}
          height={140}
          className="w-[6.5rem] h-[6.5rem] sm:w-[7.5rem] sm:h-[7.5rem]"
        />
      </button>

      {/* Header Buttons */}
      <div className="flex items-center gap-3 sm:gap-4 mr-20 sm:mr-28 lg:mr-36">
        <Link
          href="/login"
          className="px-3 py-1.5 rounded-[10px] bg-white border border-[#DEDEDE] hover:bg-gray-50 text-[#808080] text-sm font-medium transition-colors duration-200"
        >
          Iniciar sesión
        </Link>
        <Link
          href="#contact"
          className="px-3 py-1.5 rounded-[10px] bg-[#0040B8] hover:bg-[#0035a0] text-white text-sm font-medium transition-colors duration-200"
        >
          Contactanos
        </Link>
      </div>
    </header>
  );
}
