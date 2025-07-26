"use client";

import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white font-sans">
      <div className="w-full max-w-md bg-white rounded-[10px] border border-[#DEDEDE] px-4 py-10 text-center flex flex-col justify-between">
        <div className="space-y-8">
          <Image
            src="/images/logo.png"
            alt="Logo Track Detail"
            width={170}
            height={170}
            className="mx-auto"
          />

          <h1 className="text-lg text-black font-medium">¡Bienvenido nuevamente!</h1>

          <form className="">
            <input
              type="email"
              placeholder="Correo electrónico o usuario"
              className="mb-5 text-sm w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4  focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                className="w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500"
              >
                {showPassword ? <EyeOff stroke='#0040B8' size={20} /> : <Eye stroke='#0040B8' size={20} />}
              </button>
            </div>

            <button
              type="submit"
              className="mt-8 w-full bg-[#0040B8] text-white text-lg font-semibold rounded-[4px] py-3.5 hover:bg-[#0040B8] transition"
            >
              Ingresar
            </button>
          </form>
        </div>

        <a href="#" className="text-sm mt-7 text-[#0040B8] hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </main>
  )
}
