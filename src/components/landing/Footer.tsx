"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const footerLinks = {
  producto: {
    title: "Producto",
    links: [
      { label: "Plataforma", href: "#plataforma" },
      { label: "Funciones", href: "#funciones" },
      { label: "Precios", href: "#precios" },
      { label: "Demo", href: "#demo" },
    ],
  },
  recursos: {
    title: "Recursos",
    links: [
      { label: "Centro de ayuda", href: "#ayuda" },
      { label: "Guías", href: "#guias" },
      { label: "Preguntas frecuentes", href: "#faq" },
    ],
  },
  empresa: {
    title: "Empresa",
    links: [
      { label: "Sobre CheckRTO", href: "#sobre" },
    ],
  },
  contacto: {
    title: "Contacto",
    links: [
      { label: "WhatsApp", href: "#whatsapp" },
      { label: "Email", href: "#email" },
      { label: "Soporte", href: "#soporte" },
      { label: "Ventas", href: "#ventas" },
    ],
  },
};

const legalLinks = [
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
  { label: "Cookies", href: "/cookies" },
];

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="relative w-full bg-[#fafafa] border-t border-gray-100">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-12">
        {/* Top Section - Logo, Tagline, Trust Badges */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-16 mb-16 lg:mb-20">
          {/* Left - Logo */}
          <div className="lg:max-w-sm">
            <Link href="/" className="inline-block -mt-10 lg:-mt-9">
              <Image
                src="/images/Group 8.svg"
                alt="CheckRTO Logo"
                width={120}
                height={120}
                className="w-24 h-24 sm:w-28 sm:h-28"
              />
            </Link>
          </div>

          {/* Right - Link Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key} className="hidden sm:block">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 tracking-tight">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="relative text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-[1px] after:bg-gray-400 after:w-0 hover:after:w-full after:transition-all after:duration-300 after:ease-out"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Mobile Accordion */}
            <div className="col-span-2 sm:hidden space-y-0">
              {Object.entries(footerLinks).map(([key, section]) => (
                <div key={key} className="border-b border-gray-100">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      {section.title}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        openSection === key ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      openSection === key ? "max-h-40 pb-4" : "max-h-0"
                    }`}
                  >
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Copyright */}
            <p className="text-xs text-gray-400 order-2 sm:order-1">
              © {currentYear} CheckRTO. Todos los derechos reservados.
            </p>

            {/* Legal Links */}
            <div className="flex items-center gap-6 order-1 sm:order-2">
              {legalLinks.map((link, index) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-gray-400 after:w-0 hover:after:w-full after:transition-all after:duration-300 after:ease-out"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
