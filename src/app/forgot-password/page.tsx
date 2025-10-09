"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo enviar el correo");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full grid place-items-center bg-white">
    <div
      className="w-full max-w-md bg-white rounded-[10px] border border-[#DEDEDE] px-4 py-10 text-center
                 flex flex-col justify-between
                 max-h-[calc(100dvh-2rem)] overflow-auto"
    >
      {/* Header con logo y título */}
      <div className="space-y-8">
        <Image
          src="/images/logo.svg"
          alt="Logo Track Detail"
          width={170}
          height={180}
          className="mx-auto"
        />

        <h1 className="text-lg text-black font-medium">Recuperar contraseña</h1>

        {/* Estado exitoso */}
        {done ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Revisá tu correo</span>
            </div>
            <p className="text-sm text-[#00000099]">
              Si tu email está registrado, te enviamos un enlace para restablecer la contraseña.
            </p>

            <Link href="/" className="text-sm mt-6 text-[#0040B8] hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          // Formulario
          <form onSubmit={onSubmit} className="text-left">
            <label htmlFor="email" className="block text-left text-sm mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="mb-5 text-sm w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4
                         focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />

            {error && <p className="text-sm text-red-600 mb-5">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={`w-full bg-[#0040B8] text-white text-md font-semibold rounded-[4px] py-3.5 mb-6 transition
                ${submitting ? "cursor-not-allowed" : "hover:bg-[#0038a6]"}`}
            >
              {submitting ? <Spinner size={22} className="mx-auto text-white" /> : "Enviar enlace"}
            </button>
          </form>
        )}
      </div>

      {/* Footer con enlaces */}
      {!done ? (
        <div>
          <Link href="/register-owner" className="text-sm text-[#00000099] hover:underline">
            ¿No Tienes Cuenta? Regístrate
          </Link>

          <div className="mt-3">
            <Link href="/" className="text-sm text-[#0040B8] hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      ) : null}
    </div>
    </div>

  );
}
