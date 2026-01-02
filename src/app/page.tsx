"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Image
            src="/images/logo.svg"
            alt="CheckRTO Logo"
            width={160}
            height={32}
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register-owner"
              className="text-sm bg-[#0040B8] text-white px-4 py-2 rounded-[14px] hover:bg-[#0038a6] transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Gestioná tu taller de manera
          <span className="text-[#0040B8]"> más eficiente</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          CheckRTO te ayuda a organizar, gestionar y optimizar todas las operaciones de tu taller de revisión técnica.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register-owner"
            className="bg-[#0040B8] text-white px-8 py-4 rounded-[14px] text-lg font-medium hover:bg-[#0038a6] transition-colors"
          >
            Comenzar ahora
          </Link>
          <Link
            href="/login"
            className="border-2 border-[#0040B8] text-[#0040B8] px-8 py-4 rounded-[14px] text-lg font-medium hover:bg-[#0040B8] hover:text-white transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Características principales
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-gray-200 rounded-[14px] hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#0040B8] rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestión de revisiones</h3>
            <p className="text-gray-600">
              Administrá todas tus revisiones técnicas de manera centralizada y eficiente.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-[14px] hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#0040B8] rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Control de obleas</h3>
            <p className="text-gray-600">
              Gestioná el inventario y asignación de obleas de forma simple y rápida.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-[14px] hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#0040B8] rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes y estadísticas</h3>
            <p className="text-gray-600">
              Accedé a reportes detallados y estadísticas de tu taller en tiempo real.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Unite a los talleres que ya están usando CheckRTO para optimizar su gestión.
          </p>
          <Link
            href="/register-owner"
            className="inline-block bg-[#0040B8] text-white px-8 py-4 rounded-[14px] text-lg font-medium hover:bg-[#0038a6] transition-colors"
          >
            Crear cuenta gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 mb-4 md:mb-0">
            © 2025 CheckRTO. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/terminos" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Términos y condiciones
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
