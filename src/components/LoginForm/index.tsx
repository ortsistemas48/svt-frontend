"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrDni, setEmailOrDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const {user} = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user === null) {
      setChecking(false); 
    } else if (user) {
      router.push("/select-workshop"); 
    }
  }, [user]);

  if (checking || user) return null; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Validación simple antes de enviar
    if (!emailOrDni.trim() || !password.trim()) {
      setError("Por favor completá todos los campos");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailOrDni,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      const data = await res.json();
      
      const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "GET",
        credentials: "include"
      });

      if (!sessionRes.ok) {
        setError("Error al obtener datos del usuario");
        return;
      }

      const session = await sessionRes.json();
      const workshops = session.workshops || [];
      const isAdmin = session.user.is_admin;

      if (isAdmin) {
        router.push("/admin-dashboard");
        return;
      }

      const isGarageOwner = workshops.some((w: any) => w.user_type_id === 2);

      if (isGarageOwner || workshops.length > 1) {
        
        router.push("/select-workshop");
        router.refresh();

      } else if (workshops.length === 1) {
        router.push(`/dashboard/${workshops[0].workshop_id}`);
      } else {
        setError("No se encontraron talleres asociados");
      }
    } catch (err) {
      console.error("❌ Error de red:", err);
      setError("Ocurrió un error. Intentá de nuevo.");
    }
  };

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

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Correo electrónico o DNI"
              className="mb-5 text-sm w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              value={emailOrDni}
              onChange={(e) => setEmailOrDni(e.target.value)}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                className="w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500"
              >
                {showPassword ? <EyeOff stroke="#0040B8" size={20} /> : <Eye stroke="#0040B8" size={20} />}
              </button>
            </div>

            {error && <p className="text-sm text-red-600 mt-5">{error}</p>}

            <button
              type="submit"
              className="mt-5 w-full bg-[#0040B8] text-white text-lg font-semibold rounded-[4px] py-3.5 hover:bg-[#0038a6] transition"
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
  );
}
