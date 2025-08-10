"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, MoveRight } from "lucide-react";

export default function CreateWorkshopPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setError("El nombre debe tener al menos 3 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError(data.error || "Ya existe un workshop con ese nombre");
        } else if (res.status === 400) {
          setError(data.error || "Falta el nombre del workshop");
        } else if (res.status === 401) {
          setError("No autorizado, iniciá sesión");
        } else {
          setError("Ocurrió un error al crear el workshop");
        }
        return;
      }

      const data = await res.json();
      setSuccess("Workshop creado");
      // opcion A, ir al dashboard del nuevo taller
      if (data?.workshop?.id) {
        window.location.href = `/dashboard/${data.workshop.id}`;
      } else {
        // opcion B, volver al selector si no vino el id
        router.push("/select-workshop");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white font-sans">
      <section className="w-full max-w-md bg-white rounded-[10px] border border-[#DEDEDE] px-8 py-10 text-center flex flex-col justify-between">
        <article className="text-center text-xl mb-6">
          Crear taller
        </article>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <label htmlFor="name" className="text-[16px] text-[#212121]">
            Nombre del taller
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ejemplo, Taller Central"
            className="w-full rounded-[4px] border border-[#CECECE] px-3 py-3.5 outline-none focus:border-[#0040B8]"
            disabled={submitting}
            autoFocus
          />

          {error ? (
            <div className="flex items-center gap-2 text-[#B00020] text-sm">
              <Info size={18} /> <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-center gap-2 text-[#0A7A0A] text-sm">
              <Info size={18} /> <span>{success}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex justify-center items-center gap-2 bg-[#0040B8] text-white rounded-[4px] p-3 disabled:opacity-60"
            title="Crear taller"
          >
            <span>{submitting ? "Creando..." : "Crear taller"}</span>
            {!submitting && <MoveRight size={20} />}
          </button>

          <button
            type="button"
            onClick={() => router.push("/select-workshop")}
            className="text-[#0040B8] underline mt-1"
            disabled={submitting}
          >
            Volver al listado de talleres
          </button>
        </form>
      </section>
    </main>
  );
}
