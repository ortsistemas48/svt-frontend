"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Info, MoveRight, ChevronLeft, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const PROVINCES = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz",
  "Santa Fe","Santiago del Estero","Tierra del Fuego","Tucumán"
];

type StepKey = 1 | 2;

export default function CreateWorkshopPage() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [plantNumber, setPlantNumber] = useState<string>("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [cuit, setCuit] = useState("");

  // ui state
  const [step, setStep] = useState<StepKey>(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // stepper meta
  const steps = useMemo(() => ([
    { id: 1, title: "Datos básicos" },
    { id: 2, title: "Datos del taller" },
  ]), []);

  const goNext = () => {
    if (step === 1) {
      const trimmed = name.trim();
      if (trimmed.length < 3) {
        setError("El nombre debe tener al menos 3 caracteres");
        return;
      }
      setError(null);
      setDir(1);
      setStep(2);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setDir(-1);
      setStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const razonSocialTrim = razonSocial.trim();
    if (razonSocialTrim.length < 3) {
      setError("Ingresá una razón social válida");
      return;
    }
    if (!province) {
      setError("Seleccioná una provincia");
      return;
    }
    if (!city.trim()) {
      setError("Ingresá la localidad");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          razonSocial: razonSocialTrim,
          plantNumber: plantNumber.trim() ? Number(plantNumber.trim()) : null,
          province,
          city: city.trim(),
          phone: phone.trim(),
          cuit: cuit.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) setError(data.error || "Ya existe un workshop con esos datos");
        else if (res.status === 400) setError(data.error || "Datos inválidos");
        else if (res.status === 401) setError("No autorizado, iniciá sesión");
        else setError("Ocurrió un error al crear el workshop");
        return;
      }

      const data = await res.json();
      setSuccess("Workshop creado");
      if (data?.workshop?.id) {
        window.location.href = `/dashboard/${data.workshop.id}`;
      } else {
        router.push("/select-workshop");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  // animaciones
  const variants = {
    enter: (direction: 1 | -1) => ({ x: direction * 32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: 1 | -1) => ({ x: direction * -32, opacity: 0 }),
  };

  // progreso
  const progressPct = step === 1 ? 50 : 100;

  return (
    <main className="min-h-screen flex items-center justify-center font-sans px-4">
      <section className="w-full max-w-3xl bg-white rounded-[10px] border border-[#d3d3d3] px-6 sm:px-10 py-8 sm:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl font-semibold text-[#0F172A] tracking-tight">Crear taller</h1>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Completá los datos para registrar tu taller en el sistema.
          </p>

          {/* Stepper */}
          <div className="mt-5">
            <ol className="flex items-center gap-6">
              {steps.map((s) => {
                const isActive = step === s.id;
                const isDone = step > s.id;
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <div
                      className={[
                        "w-8 h-8 rounded-full flex items-center justify-center border transition-colors",
                        isDone ? "bg-[#0040B8] text-white border-[#0040B8]" :
                        isActive ? "bg-white text-[#0040B8] border-[#0040B8]" :
                        "bg-white text-[#94A3B8] border-[#E2E8F0]"
                      ].join(" ")}
                      aria-current={isActive ? "step" : undefined}
                    >
                      {isDone ? <CheckCircle size={16} /> : s.id}
                    </div>
                    <span className={isActive ? "text-[#0F172A] text-sm font-medium" : "text-[#64748B] text-sm"}>
                      {s.title}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* progress bar */}
            <div className="mt-3 h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0040B8] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        {/* Form card */}
        <form
          onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); goNext(); }}
          className="text-left min-h-[320px]"
        >
          <AnimatePresence mode="popLayout" custom={dir}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={dir}
                initial="enter"
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="grid grid-cols-1 gap-5"
              >
                <Field
                  id="name"
                  label="Nombre del taller"
                  placeholder="Ejemplo, Taller Central"
                  value={name}
                  onChange={setName}
                  required
                  disabled={submitting}
                  help="Este es el nombre visible, podés editarlo luego."
                />

                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                <div className="mt-2 flex items-center justify-between">
                  <GhostLink
                    onClick={() => router.push("/select-workshop")}
                    disabled={submitting}
                  >
                    Volver
                  </GhostLink>

                  <PrimaryButton
                    type="button"
                    onClick={goNext}
                    loading={submitting}
                    iconRight={<MoveRight size={20} />}
                  >
                    Continuar
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={dir}
                initial="enter"
                animate="center"
                exit="exit"
                variants={variants}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {/* Razón social y CUIT */}
                <Field
                  id="razon-social"
                  label="Razón social"
                  placeholder="Ejemplo, Talleres Central S.A."
                  value={razonSocial}
                  onChange={setRazonSocial}
                  disabled={submitting}
                  required
                />
                <Field
                  id="cuit"
                  label="CUIT"
                  placeholder="Ejemplo, 20-12345678-3"
                  value={cuit}
                  onChange={setCuit}
                  disabled={submitting}
                  inputMode="numeric"
                  required
                />

                {/* Provincia y Localidad */}
                <SelectField
                  id="province"
                  label="Provincia"
                  value={province}
                  onChange={setProvince}
                  options={PROVINCES}
                  disabled={submitting}
                  required
                />
                <Field
                  id="city"
                  label="Localidad"
                  placeholder="Ejemplo, Córdoba Capital"
                  value={city}
                  onChange={setCity}
                  disabled={submitting}
                  required
                />

                {/* Teléfono y Número de planta */}
                <Field
                  id="phone"
                  label="Teléfono"
                  placeholder="Ejemplo, 3511234567"
                  value={phone}
                  onChange={setPhone}
                  disabled={submitting}
                  inputMode="tel"
                  required
                />
                <Field
                  id="plant-number"
                  label="Número de planta"
                  placeholder="Ejemplo, 3"
                  value={plantNumber}
                  onChange={setPlantNumber}
                  disabled={submitting}
                  inputMode="numeric"
                  type="number"
                  required
                />

                <div className="md:col-span-2">
                  {error && <Alert type="error" message={error} />}
                  {success && <Alert type="success" message={success} />}
                </div>

                <div className="md:col-span-2 mt-1 flex items-center justify-between">
                  <GhostButton onClick={goBack} disabled={submitting}>
                    <ChevronLeft size={18} />
                    Volver
                  </GhostButton>

                  <div className="flex items-center gap-3">
                    <GhostLink
                      onClick={() => router.push("/select-workshop")}
                      disabled={submitting}
                    >
                      Cancelar
                    </GhostLink>

                    <PrimaryButton
                      type="submit"
                      loading={submitting}
                      iconRight={<MoveRight size={20} />}
                    >
                      Crear taller
                    </PrimaryButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </section>
    </main>
  );
}

/* ---------- UI subcomponents ---------- */

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  help,
  disabled,
  required,
  type = "text",
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-sm font-medium text-[#0F172A]">
        {label} {required ? <span className="text-[#EF4444]">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3.5 py-3 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8]
                   outline-none focus-visible:ring-4 focus-visible:ring-[#0040B8]/20 focus:border-[#0040B8] transition-shadow"
      />
      {help ? <p className="text-xs text-[#64748B] mt-1">{help}</p> : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-sm font-medium text-[#0F172A]">
        {label} {required ? <span className="text-[#EF4444]">*</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3.5 py-3 text-[15px] text-[#0F172A]
                   outline-none focus-visible:ring-4 focus-visible:ring-[#0040B8]/20 focus:border-[#0040B8] transition-shadow"
      >
        <option value="">Seleccionar</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function Alert({ type, message }: { type: "error" | "success"; message: string }) {
  const isError = type === "error";
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-[10px] px-3.5 py-3 text-sm",
        isError ? "bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]" :
                  "bg-[#F0FDF4] text-[#14532D] border border-[#BBF7D0]"
      ].join(" ")}
      role="alert"
    >
      <Info size={18} />
      <span>{message}</span>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
  loading,
  iconRight,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  loading?: boolean;
  iconRight?: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-[4px] px-5 py-3
                 bg-[#0040B8] text-white font-medium shadow-sm
                 hover:brightness-110 active:brightness-95
                 disabled:opacity-60 disabled:cursor-not-allowed
                 transition"
      title="Continuar"
    >
      <span>{loading ? "Procesando..." : children}</span>
      {!loading && iconRight}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 text-[#0F172A] rounded-[12px] px-3 py-2
                 hover:bg-[#F1F5F9] active:bg-[#E2E8F0]
                 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

function GhostLink({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-[#0040B8] underline underline-offset-4 hover:opacity-80 disabled:opacity-60 transition"
    >
      {children}
    </button>
  );
}
