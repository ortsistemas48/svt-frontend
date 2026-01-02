"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_BASE = "/api";

export default function EmailVerifiedClient() {
  const sp = useSearchParams();
  const status = sp.get("status");
  const token = sp.get("token");
  const emailParam = sp.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const RESEND_PATH = "/auth/resend-verification";

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}&mode=json`,
          { credentials: "include" }
        );
        const data = await res.json().catch(() => null);
        const s = data?.status ?? "invalid";
        const e = data?.email ? `&email=${encodeURIComponent(data.email)}` : "";
        window.location.replace(`/email-verified?status=${s}${e}`);
      } catch {
        window.location.replace(`/email-verified?status=invalid`);
      }
    })();
  }, [token]);

  const view = useMemo(() => {
    if (token && !status) {
      return {
        title: "Verificando tu email",
        desc: "Un momento por favor",
        icon: <Loader2 size={28} className="mx-auto animate-spin text-[#0040B8]" />,
        toneClass: "text-[#0040B8]",
      };
    }
    switch (status) {
      case "invalid":
        return { title: "Token inválido", desc: "El enlace no es válido, pedí un nuevo email de verificación", icon: <AlertCircle size={28} className="text-red-600 mx-auto" />, toneClass: "text-red-700" };
      case "expired":
        return { title: "Enlace vencido", desc: "El enlace de verificación venció, pedí uno nuevo", icon: <Clock size={28} className="text-yellow-600 mx-auto" />, toneClass: "text-yellow-700" };
      case "used":
        return { title: "Email ya verificado", desc: "Tu email ya fue verificado, aguardá la aprobación de tu cuenta", icon: <CheckCircle size={28} className="text-emerald-600 mx-auto" />, toneClass: "text-emerald-700" };
      case "ok":
      default:
        return { title: "Email verificado", desc: "Email verificado, inicia sesión para crear tu taller.", icon: <CheckCircle size={28} className="text-emerald-600 mx-auto" />, toneClass: "text-emerald-700" };
    }
  }, [status, token]);

  async function handleResend() {
    setResendMsg(null);
    if (!email) {
      setResendMsg("Necesitamos tu email para reenviar la verificación");
      return;
    }
    try {
      setResending(true);
      const res = await fetch(`${API_BASE}${RESEND_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setResendMsg(data?.error || "No se pudo enviar el email");
        return;
      }
      setResendMsg("Listo, te enviamos un nuevo email de verificación");
    } catch {
      setResendMsg("Error de red, intentá de nuevo");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center bg-white px-4">
      <div className="w-full max-w-md bg-white rounded-[14px] border border-[#DEDEDE] px-4 py-10 text-center flex flex-col justify-between max-h-[calc(100dvh-2rem)] overflow-auto">
        <div className="space-y-6">
          <Image src="/images/logo.svg" alt="Logo Track Detail" width={170} height={180} className="mx-auto" priority />
          <div className="space-y-2">
            <div>{view.icon}</div>
            <h1 className={`text-xl font-semibold ${view.toneClass}`}>{view.title}</h1>
            <p className="text-sm text-gray-600">{view.desc}</p>
          </div>

          {!token && !status && <p className="text-xs text-gray-500">Falta el token, volvé a abrir el enlace del email</p>}

          {!!status && (
            <div className="space-y-3">
              {status === "ok" && (
                <Link href="/login" className="block w-full bg-[#0040B8] text-white text-md rounded-[4px] py-3.5 hover:bg-[#0038a6] transition">
                  Ir a iniciar sesión
                </Link>
              )}

              {(status === "invalid" || status === "expired") && (
                <div className="flex flex-col gap-2">
                  {!email && (
                    <input
                      type="email"
                      placeholder="Tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      className="w-full px-3 py-2.5 rounded-[14px] border border-[#DEDEDE] text-sm"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="block w-full bg-[#0040B8] text-white text-md rounded-[4px] py-3.5 hover:bg-[#0038a6] transition disabled:opacity-60"
                  >
                    {resending ? "Enviando..." : "Pedir nuevo email de verificación"}
                  </button>

                  {resendMsg && <p className="text-xs text-gray-600">{resendMsg}</p>}

                  {!email && (
                    <p className="text-[11px] text-gray-500">
                      Sugerencia, abrí el enlace más reciente del email, o ingresá tu correo y reenviamos el enlace
                    </p>
                  )}
                </div>
              )}

              {status === "used" && (
                <Link href="/login" className="block w-full bg-[#0040B8] text-white text-md rounded-[4px] py-3.5 hover:bg-[#0038a6] transition">
                  Ir a iniciar sesión
                </Link>
              )}
            </div>
          )}
        </div>

        {!!status && (
          <Link href="/login" className="text-sm mt-6 text-[#0040B8] hover:underline">
            Volver al inicio
          </Link>
        )}
      </div>
    </main>
  );
}
