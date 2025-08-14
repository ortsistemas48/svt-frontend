"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Spinner from "@/components/Spinner"; // 👈 importa el spinner
import Link from "next/link";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrDni, setEmailOrDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false); // 👈 nuevo
  const { user } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user === null) setChecking(false);
    else if (user) router.push("/select-workshop");
  }, [user, router]);

  if (checking || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // evita doble submit
    setError("");

    if (!emailOrDni.trim() || !password.trim()) {
      setError("Por favor completá todos los campos");
      return;
    }

    try {
      setSubmitting(true); // 👈 empieza loading
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailOrDni, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      await res.json();

      const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!sessionRes.ok) {
        setError("Error al obtener datos del usuario");
        return;
      }

      const session = await sessionRes.json();
      const workshops = session.workshops || [];
      const isAdmin = session.user.is_admin;

      if (isAdmin) return router.push("/admin-dashboard");

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
    } finally {
      setSubmitting(false); // 👈 termina loading (si no hubo redirect)
    }
  };

  return (
      <div className="w-full max-w-md bg-white rounded-[10px] border border-[#DEDEDE] px-4 py-10 text-center
                      flex flex-col justify-between
                      max-h-[calc(100dvh-2rem)] overflow-auto"> {/* 👈 scroll interno, no en body */}
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
              disabled={submitting}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                className="w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500"
                disabled={submitting}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff stroke="#0040B8" size={20} /> : <Eye stroke="#0040B8" size={20} />}
              </button>
            </div>

            {error && <p className="text-sm text-red-600 mt-5">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={`mt-5 w-full bg-[#0040B8] text-white text-lg font-semibold rounded-[4px] py-3.5 transition
                ${submitting ? "cursor-not-allowed" : "hover:bg-[#0038a6]"}`}
            >
              {submitting ? <Spinner size={22} className="mx-auto text-white" /> : "Ingresar"}
            </button>
          </form>
        </div>
        <Link href="#" className="text-sm mt-6 text-[#0040B8] hover:underline">
          ¿No Tienes Cuenta? Regístrate
        </Link>

        <Link href="#" className="text-sm mt-2 text-[#0040B8] hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    
);

}
