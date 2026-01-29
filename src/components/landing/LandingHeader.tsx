"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingHeader() {
  const scrollToHero = () => {
    const element = document.getElementById("hero");
    if (element) {
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <header className="w-full h-16 sm:h-18 lg:h-20 py-0 sm:py-0 lg:py-0 mt-[-12px] sm:mt-[-16px] lg:mt-[-20px] flex items-center justify-between sticky top-0 z-20 bg-white/90 backdrop-blur-sm px-4 sm:px-6 md:px-0">
      {/* Logo */}
      <button
        onClick={scrollToHero}
        className="flex items-center ml-4 sm:ml-8 md:ml-20 lg:ml-36 cursor-pointer"
      >
        <Image
          src="/images/Group 8.svg"
          alt="Check RTO Logo"
          width={140}
          height={140}
          className="w-[5rem] h-[5rem] sm:w-[6.5rem] sm:h-[6.5rem] md:w-[7.5rem] md:h-[7.5rem]"
        />
      </button>

      {/* Botones: ocultos en mobile, visibles desde sm */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-3 md:gap-4 mr-2 sm:mr-4 md:mr-20 lg:mr-36">
        <Link
          href="/login"
          className="px-2.5 py-1.5 sm:px-3 rounded-[10px] bg-white border border-[#DEDEDE] hover:bg-gray-50 text-[#808080] text-xs sm:text-sm font-medium transition-colors duration-200"
        >
          Iniciar sesión
        </Link>
        <Link
          href="#contact"
          className="px-2.5 py-1.5 sm:px-3 rounded-[10px] bg-[#0040B8] hover:bg-[#0035a0] text-white text-xs sm:text-sm font-medium transition-colors duration-200"
        >
          Contactanos
        </Link>
      </div>
    </header>
  );
}
