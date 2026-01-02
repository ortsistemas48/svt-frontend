"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Spinner from "@/components/Spinner"; 
import Link from "next/link";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrDni, setEmailOrDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false); 
  const { user } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const phrases = useMemo(
    () => ["más simple.", "más claro.", "más seguro.", "más preciso.", "más confiable.", "más consistente.", "más prolijo.", "más controlado.", "más escalable.", "más automático.", "más moderno.", "más práctico.", "más fluido.", "más estable.", "más rentable.", "más económico.", "más profesional.", "más optimizado.", "más ágil para el equipo."],
    []
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (user === null) setChecking(false);
    else if (user) router.push("/select-workshop");
  }, [user, router]);

  // Typewriter effect para el slogan
  useEffect(() => {
    const current = phrases[phraseIndex] || "";
    const isDone = typed.length === current.length;

    const timeout = setTimeout(() => {
      if (!isDone) {
        setTyped(current.slice(0, typed.length + 1));
      } else {
        const next = (phraseIndex + 1) % phrases.length;
        setPhraseIndex(next);
        setTyped("");
      }
    }, isDone ? 1300 : 110);

    return () => clearTimeout(timeout);
  }, [typed, phraseIndex, phrases]);

  if (checking || user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; 
    setError("");

    if (!emailOrDni.trim() || !password.trim()) {
      setError("Por favor completá todos los campos");
      return;
    }

    try {
      setSubmitting(true); 
      // Normalizar email a minúsculas si contiene @, de lo contrario dejarlo como está (puede ser DNI)
      const normalizedIdentifier = emailOrDni.trim().includes('@') 
        ? emailOrDni.trim().toLowerCase() 
        : emailOrDni.trim();
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedIdentifier, password: password.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      await res.json();

      const sessionRes = await fetch(`/api/auth/me`, {
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
      

      // Caso 1: es admin
      if (isAdmin) {
        router.push("/admin-dashboard");
        router.refresh();
        return;
      }
      if (workshops.length === 1) {
        router.push(`/dashboard/${workshops[0].workshop_id}`);
        router.refresh();
        return;
      }

      router.push("/select-workshop");
      router.refresh();
    } catch (err) {
      console.error("❌ Error de red:", err);
      setError("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setSubmitting(false); // x termina loading (si no hubo redirect)
    }
  };

  return (
<div className="w-full max-w-md px-6 py-14 text-center flex flex-col max-h-[calc(100dvh-2rem)] border border-[#DEDEDE] rounded-[14px]">
  {/* Header fijo (sin overflow, no se corta) */}
  <div className="shrink-0 flex flex-col items-center -mt-2">
    <Image
      src="/images/logo.svg"
      alt="CheckRTO"
      width={160}
      height={32}
      className="mx-auto"
    />
    <p className="text-lg text-gray-700 mt-5 h-8">
      Hacé tu taller {" "}
      <span className="font-medium text-[#0040B8]">
        {typed || "\u00A0"}
      </span>
      <span className="inline-block w-[6px] h-[22px] ml-1 align-middle bg-[#0040B8] animate-pulse" />
    </p>
  </div>

  {/* Contenido con scroll interno */}
  <div className="flex-1 overflow-auto -mx-1 px-1">
    <div className="space-y-8 pt-4">
      <form onSubmit={handleSubmit} className="mt-8">
        <input
          type="text"
          placeholder="Correo electrónico o DNI"
          className="mb-5 text-sm w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 focus:outline-none focus:border-[#0040B8] focus:ring-1 focus:ring-[#0040B8] focus:ring-offset-0"
          value={emailOrDni}
          onChange={(e) => setEmailOrDni(e.target.value)}
          disabled={submitting}
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            className="w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 pr-10 text-sm focus:outline-none focus:border-[#0040B8] focus:ring-1 focus:ring-[#0040B8] focus:ring-offset-0"
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
            {showPassword ? (
              <EyeOff stroke="#0040B8" size={20} />
            ) : (
              <Eye stroke="#0040B8" size={20} />
            )}
          </button>
        </div>
        <div className="mt-2 text-right">
          <Link href="/forgot-password" className="text-sm text-[#0040B8] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600 mt-5">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className={`mt-5 w-full bg-[#0040B8] text-white text-sm font-regular rounded-[14px] py-3 transition ${
            submitting ? "cursor-not-allowed" : "hover:bg-[#0038a6]"
          }`}
        >
          {submitting ? (
            <Spinner size={22} className="mx-auto text-white" />
          ) : (
            "Ingresar"
          )}
        </button>
        <div className="mt-6 border-t border-[#DEDEDE]" />
      </form>
    </div>
  </div>

  {/* Footer fijo (links abajo) */}
  <div className="shrink-0 pt-6">
    <Link
      href="/register-owner"
      className="text-sm block text-[#00000099] hover:underline"
    >
      ¿No Tienes Cuenta? <span className="text-[#0040B8] underline font-normal">Regístrate</span>
    </Link>
  </div>
</div>

    
);

}
