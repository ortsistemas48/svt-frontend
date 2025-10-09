"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

/** Card reutilizable con el mismo diseño del login */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-md bg-white rounded-[10px] border border-[#DEDEDE] px-4 py-10 text-center
                 flex flex-col justify-between
                 max-h-[calc(100dvh-2rem)] overflow-auto"
    >
      {children}
    </div>
  );
}

export default function ResetPasswordTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [valid, setValid] = useState<null | boolean>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificación del token, hasta que no termine no mostramos el form
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(
          `/api/auth/password-reset/verify?token=${encodeURIComponent(String(token))}`
        );
        const json = await res.json();
        if (!mounted) return;
        if (res.ok && json.ok) {
          setValid(true);
          setEmail(json.email || "");
        } else {
          setValid(false);
        }
      } catch {
        if (mounted) setValid(false);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo restablecer");
      setDone(true);
      setTimeout(() => router.push("/"), 1800);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading, evita el re render que te saca el foco
  if (valid === null) {
    return (
      <div className="min-h-full grid place-items-center bg-white">
        <Card>
          <div className="space-y-8">
            <Image
              src="/images/logo.svg"
              alt="Logo Track Detail"
              width={170}
              height={180}
              className="mx-auto"
            />
            <div className="flex items-center justify-center">
              <Spinner size={24} className="text-[#0040B8]" />
            </div>
            <p className="text-sm text-[#00000099]">Verificando enlace</p>
          </div>
        </Card>
      </div>
    );
  }

  if (valid === false) {
    return (
      <div className="min-h-full grid place-items-center bg-white">
        <Card>
          <div className="space-y-8">
            <Image
              src="/images/logo.svg"
              alt="Logo Track Detail"
              width={170}
              height={180}
              className="mx-auto"
            />
            <div className="flex items-center justify-center gap-2 text-[#B45309]">
              <AlertTriangle className="w-6 h-6" />
              <h1 className="text-lg text-black font-medium">Enlace inválido o vencido</h1>
            </div>
            <Link href="/forgot-password" className="text-sm text-[#0040B8] hover:underline">
              Solicitar uno nuevo
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-full grid place-items-center bg-white">
        <Card>
          <div className="space-y-8">
            <Image
              src="/images/logo.svg"
              alt="Logo Track Detail"
              width={170}
              height={180}
              className="mx-auto"
            />
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
              <h1 className="text-lg text-black font-medium">Contraseña actualizada</h1>
            </div>
            <p className="text-sm text-[#00000099]">Redirigiendo al login</p>
            <Link href="/" className="text-sm text-[#0040B8] hover:underline">
              Ir al login
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full grid place-items-center bg-white">
      <Card>
        <div className="space-y-6">
          <Image
            src="/images/logo.svg"
            alt="Logo Track Detail"
            width={170}
            height={180}
            className="mx-auto"
          />
          <h1 className="text-lg text-black font-medium">Crear nueva contraseña</h1>

          <form onSubmit={submit} className="text-left">
            <label className="block text-left text-sm mb-2">Nueva contraseña</label>
            <div className="relative mb-5">
              <input
                type={show ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className="w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500"
                disabled={submitting}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? <EyeOff stroke="#0040B8" size={20} /> : <Eye stroke="#0040B8" size={20} />}
              </button>
            </div>

            <label className="block text-left text-sm mb-2">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirmá la contraseña"
                className="w-full border border-[#DEDEDE] rounded-[10px] px-5 py-4 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500"
                disabled={submitting}
                aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
              >
                {showConfirm ? <EyeOff stroke="#0040B8" size={20} /> : <Eye stroke="#0040B8" size={20} />}
              </button>
            </div>

            {error && <p className="text-sm text-red-600 mt-5">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className={`mt-5 w-full bg-[#0040B8] text-white text-md font-semibold rounded-[4px] py-3.5 transition
                ${submitting ? "cursor-not-allowed" : "hover:bg-[#0038a6]"}`}
            >
              {submitting ? <Spinner size={22} className="mx-auto text-white" /> : "Guardar nueva contraseña"}
            </button>
          </form>

          <div>
            <Link href="/" className="text-sm text-[#0040B8] hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
