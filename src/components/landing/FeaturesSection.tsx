"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";

const tabs = [
  {
    id: "revisiones",
    label: "Revisiones",
  },
  {
    id: "cola_revisiones",
    label: "Cola de revisiones",
  },
  {
    id: "reimpresion_crt",
    label: "Reimpresión de CRT",
  },
  {
    id: "asignacion_obleas",
    label: "Asignación de obleas",
  },
  {
    id: "estadisticas",
    label: "Estadísticas",
  },
  {
    id: "legajos",
    label: "Legajos",
  },
];

const features: Record<string, { title: string; subtitle: string; description: string; benefits: string[]; tags: string[]; image: string }> = {
  revisiones: {
    title: "Gestión de revisiones",
    subtitle: "simple y ordenada",
    description: "Controlá todo el proceso de revisión desde un solo lugar, con estados claros y sin perder información.",
    benefits: [
      "Checklist configurable por tipo de vehículo",
      "Estados automáticos y en tiempo real",
      "Historial completo de cada revisión",
    ],
    tags: ["Automatizado", "Tiempo real", "Trazable"],
    image: "/images/revisiones.webp",
  },
  cola_revisiones: {
    title: "Cola de revisiones",
    subtitle: "organizada y eficiente",
    description: "Gestioná la fila de vehículos pendientes de revisión, asignando prioridades y técnicos.",
    benefits: [
      "Visualización clara de vehículos en espera",
      "Asignación dinámica de técnicos",
      "Alertas de tiempos de espera",
    ],
    tags: ["Prioridades", "Alertas", "Dinámico"],
    image: "/images/Cola_de_inspecciones.webp",
  },
  reimpresion_crt: {
    title: "Reimpresión de CRT",
    subtitle: "rápida y segura",
    description: "Generá reimpresiones de Certificados de Revisión Técnica de forma ágil y con control de versiones.",
    benefits: [
      "Acceso rápido a historiales de CRT",
      "Control de seguridad en reimpresiones",
      "Registro de cada reimpresión",
    ],
    tags: ["Seguro", "Versionado", "Auditable"],
    image: "/images/Reimpresion_CRT.webp",
  },
  asignacion_obleas: {
    title: "Asignación de obleas",
    subtitle: "trazable y sin errores",
    description: "Administrá la asignación de obleas a los vehículos, manteniendo un registro exacto y evitando duplicidades.",
    benefits: [
      "Control de stock de obleas",
      "Asignación automática a vehículos",
      "Reportes de uso y disponibilidad",
    ],
    tags: ["Control stock", "Sin duplicados", "Reportes"],
    image: "/images/Obleas.webp",
  },
  estadisticas: {
    title: "Estadísticas detalladas",
    subtitle: "para tomar decisiones",
    description: "Visualizá métricas clave de tu operación: tiempos, productividad, fallas recurrentes y más.",
    benefits: [
      "Dashboard con métricas en tiempo real",
      "Exportación a Excel y PDF",
      "Análisis de tendencias",
    ],
    tags: ["Dashboard", "Exportable", "Tendencias"],
    image: "/images/Statistics.webp",
  },
  legajos: {
    title: "Gestión de legajos",
    subtitle: "digital y centralizada",
    description: "Mantené todos los documentos y datos de cada vehículo en un legajo digital accesible y seguro.",
    benefits: [
      "Documentación digitalizada por vehículo",
      "Acceso rápido a información histórica",
      "Seguridad y respaldo de datos",
    ],
    tags: ["Digital", "Centralizado", "Respaldo"],
    image: "/images/Legajos.webp",
  },
};

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState("revisiones");
  const [clickedTab, setClickedTab] = useState<string | null>(null);
  const currentFeature = features[activeTab];

  const handleTabClick = (tabId: string) => {
    setClickedTab(tabId);
    setActiveTab(tabId);
    setTimeout(() => setClickedTab(null), 500);
  };

  return (
    <section id="features" className="relative w-full py-20 sm:py-28 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Todo lo que necesitás{" "}
            <span className="bg-gradient-to-r from-[#0040B8] via-blue-600 to-[#0040B8] bg-clip-text text-transparent">para tu taller</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Una plataforma completa que simplifica cada aspecto de tu operación diaria.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-50 text-[#0040B8] border border-[#0040B8]"
                  : "bg-white text-gray-600 border border-[#DEDEDE] hover:border-gray-300"
              } ${clickedTab === tab.id ? "animate-spring animate-glow" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div className="relative bg-[#f8f9fa] rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 items-center">
            {/* Left - Text Content */}
            <div key={`text-${activeTab}`} className="order-2 lg:order-1 animate-fadeIn">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-2">
                <span className="text-gray-900">{currentFeature.title},</span>
                <br />
                <span className="text-gray-400">{currentFeature.subtitle}</span>
              </h3>

              <p className="text-gray-500 text-base sm:text-lg mt-4 mb-8 leading-relaxed">
                {currentFeature.description}
              </p>

              {/* Benefits List */}
              <ul className="space-y-3">
                {currentFeature.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#0040B8] flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-gray-600">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Tags */}
              <div className="mt-8 flex flex-wrap gap-2">
                {currentFeature.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-600 shadow-sm"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#0040B8] mr-2" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - Image */}
            <div key={`image-${activeTab}`} className="order-1 lg:order-2 animate-fadeIn">
              <div className="relative aspect-video rounded-[10px] overflow-hidden bg-white shadow-lg border border-gray-200">
                <Image
                  key={activeTab}
                  src={currentFeature.image}
                  alt={currentFeature.title}
                  fill
                  className="object-contain transition-opacity duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
