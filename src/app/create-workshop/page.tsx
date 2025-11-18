// app/create-workshop/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Info, MoveRight, ChevronLeft, CheckCircle, Plus, UserPlus, X, Mail,
  Edit3, Check, Eye, EyeOff, Search
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getProvinces, getLocalidadesByProvincia } from "@/utils";

/** Provincias - will be loaded from API */
const PROVINCES_STATIC = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz",
  "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"
];

/** Roles fijos */
type Role = { id: number; name: string };
const FIXED_ROLES: Role[] = [
  { id: 2, name: "Titular" },
  { id: 3, name: "Ingeniero" },
  { id: 4, name: "Administrativo" },
  { id: 6, name: "Personal de planta" },
];
const ENGINEER_ROLE_ID = 3;

/** Pasos */
type StepKey = 1 | 2 | 3;
type EngineerKind = "Titular" | "Suplente";

/** Ítems pendientes de procesar en el paso 3 */
type PendingMember = {
  id: string;
  email: string;
  existingUserId?: string;
  first_name?: string;
  last_name?: string;
  dni?: string | null;
  phone_number?: string | null;
  user_type_id: number | 6;
  license_number?: string | null;
  title_name?: string | null;
  password?: string;
  confirm_password?: string;
  engineer_kind?: EngineerKind; 
};

const API_BASE = "/api";
const STOP_ON_MEMBER_ERROR = false;

export default function CreateWorkshopPage() {
  const router = useRouter();

  /** Paso 1, datos del taller */
  const [name, setName] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [plantNumber, setPlantNumber] = useState<string>("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cuit, setCuit] = useState("");
  const [dispositionNumber, setDispositionNumber] = useState<string>("");
  const [swornChecked, setSwornChecked] = useState(false);

  /** Province and city options */
  const [provinceOptions, setProvinceOptions] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityApiFailed, setCityApiFailed] = useState(false);

  /** Paso 2, lista de pendientes */
  const [pending, setPending] = useState<PendingMember[]>([]);

  // Load provinces on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const provs = await getProvinces();
        if (!cancelled) {
          setProvinceOptions(provs);
        }
      } catch (e) {
        console.error("Error cargando provincias:", e);
        // Fallback to static list
        if (!cancelled) {
          setProvinceOptions(PROVINCES_STATIC.map(p => ({ value: p, label: p })));
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load cities when province changes
  useEffect(() => {
    let cancelled = false;

    if (!province) {
      setCityOptions([]);
      setCity("");
      setCityApiFailed(false);
      return;
    }

    setLoadingCities(true);
    setCityOptions([]);
    setCity(""); // Clear city when province changes
    setCityApiFailed(false);

    (async () => {
      try {
        const locs = await getLocalidadesByProvincia(province);
        if (!cancelled) {
          setCityOptions(locs.map(loc => loc.value));
          setCityApiFailed(false);
        }
      } catch (e) {
        console.error("Error cargando localidades:", e);
        if (!cancelled) {
          setCityApiFailed(true);
        }
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    })();

    return () => { cancelled = true; };
  }, [province]);

  /** UI general */
  const [step, setStep] = useState<StepKey>(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const steps = useMemo(() => [
    { id: 1, title: "Datos del taller" },
    { id: 2, title: "Agregar personal" },
    { id: 3, title: "Confirmación" },
  ], []);

  /** Validaciones del paso 1 */
  const validateStep1 = () => {
    if (name.trim().length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (razonSocial.trim().length < 3) return "Ingresá una razón social válida";
    if (!province) return "Seleccioná una provincia";
    if (!city.trim()) return "Ingresá la localidad";
    if (!address.trim()) return "Ingresá el domicilio";
    if (!cuit.trim()) return "Ingresá el CUIT";
    if (!plantNumber.trim()) return "Ingresá el número de planta";
    if (!dispositionNumber.trim()) return "Ingresá el número de disposición";
    return null;
  };

  const goNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
      setError(null);
      setDir(1);
      setStep(2);
    } else if (step === 2) {
        const someoneWithoutRole = pending.some(m => !m.user_type_id);
        if (someoneWithoutRole) { setError("Todos los miembros deben tener un rol asignado"); return; }

        const engineers = pending.filter(m => m.user_type_id === ENGINEER_ROLE_ID);

        // NUEVO: validar que todos los ingenieros tengan tipo
        const missingKind = engineers.some(e => !e.engineer_kind);
        if (missingKind) {
          setError("Todos los ingenieros deben indicar si son Titular o Suplente");
          return;
        }

        if (engineers.length === 0) { setError("Tiene que haber al menos un Ingeniero"); return; }

        const titulares = engineers.filter(e => e.engineer_kind === "Titular").length;
        const suplentes  = engineers.filter(e => e.engineer_kind === "Suplente").length;

        if (titulares !== 1) { setError("Debe haber exactamente 1 Ingeniero Titular"); return; }
        if (!swornChecked) {
          setError("Debés aceptar la declaración jurada para continuar");
          return;
        }

        setError(null); setDir(1); setStep(3);
      }
  };

  const goBack = () => {
    if (step === 2) { setDir(-1); setStep(1); setSwornChecked(false); }
    else if (step === 3) { setDir(-1); setStep(2); }
  };


  const handleCreateOnStep3 = async () => {
    const err = validateStep1();
    if (err) return setError(err);
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // 1, crear workshop
      const rWs = await fetch(`${API_BASE}/workshops/create-unapproved`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          razonSocial: razonSocial.trim(),
          plantNumber: plantNumber.trim() ? Number(plantNumber.trim()) : null,
          province,
          city: city.trim(),
          address: address.trim(),
          phone: phone.trim(),
          cuit: cuit.trim(),
          dispositionNumber: dispositionNumber.trim(),
        }),
      });
      if (!rWs.ok) {
        const errData = await rWs.json().catch(() => null);
        throw new Error(errData?.error || "No se pudo crear el taller");
      }
      const wsData = await rWs.json();
      const workshopId: number | undefined = wsData?.workshop?.id;
      if (!workshopId) throw new Error("No se recibió el id del taller");

      // 2, procesar pendientes
      const results: { email: string, status: "ok" | "error", message?: string }[] = [];
      for (const m of pending) {
        try {
          if (!m.user_type_id) throw new Error("Seleccioná un rol");
          if (m.user_type_id === ENGINEER_ROLE_ID) {
            if (!m.license_number?.trim() || !m.title_name?.trim()) {
              throw new Error("Para Ingeniero, completá matrícula y título");
            }
          }

          if (m.existingUserId) {
              const payload: any = {
                user_id: m.existingUserId,
                user_type_id: m.user_type_id,
              };
              if (m.user_type_id === ENGINEER_ROLE_ID) {
                payload.license_number = m.license_number?.trim() || null;
                payload.title_name     = m.title_name?.trim() || null;
                payload.engineer_kind  = m.engineer_kind || null;
              }

            const rAttach = await fetch(`${API_BASE}/users/assign/${workshopId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            });
            if (!rAttach.ok) {
              const e = await rAttach.json().catch(() => null);
              throw new Error(e?.error || "No se pudo asociar el usuario");
            }
            results.push({ email: m.email, status: "ok" });
          } else {
            if (!m.password || !m.confirm_password) throw new Error("Ingresá contraseña y confirmación");
            if (m.password !== m.confirm_password) throw new Error("Las contraseñas no coinciden");
            if (m.password.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");

            const payload: any = {
              email: m.email,
              password: m.password,
              confirm_password: m.confirm_password,
              first_name: m.first_name || "",
              last_name: m.last_name || "",
              dni: m.dni || null,
              phone_number: m.phone_number || null,
              workshop_id: workshopId,
              user_type_id: m.user_type_id,
            };
            if (m.user_type_id === ENGINEER_ROLE_ID) {
              payload.license_number = m.license_number?.trim();
              payload.title_name     = m.title_name?.trim();
              payload.engineer_kind  = m.engineer_kind || null; 
            }

            const rCreate = await fetch(`${API_BASE}/auth/register_bulk`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(payload),
            });
            if (!rCreate.ok) {
              const e = await rCreate.json().catch(() => null);
              throw new Error(e?.error || "No se pudo crear el usuario");
            }
            results.push({ email: m.email, status: "ok" });
          }
        } catch (ex: any) {
          results.push({ email: m.email, status: "error", message: ex?.message || "Error" });
          if (STOP_ON_MEMBER_ERROR) break;
        }
      }

      // 3, feedback
      const errors = results.filter(r => r.status === "error");
      if (errors.length) {
        setSuccess(null);
        setError(`Taller creado, algunos usuarios fallaron, ${errors.map(e => `${e.email}: ${e.message}`).join(", ")}`);
        setTimeout(() => router.push(`/dashboard/${workshopId}`), 1400);
      } else {
        setError(null);
        setSuccess("Taller y usuarios creados. Te avisaremos por email cuando sea aprobado.");
        setName("");
        setRazonSocial("");
        setPlantNumber("");
        setProvince("");
        setCity("");
        setAddress("");
        setPhone("");
        setCuit("");
        setDispositionNumber("");
        setPending([]);
        setSwornChecked(false);

      }
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const addPendingSafely = (m: PendingMember): { ok: boolean; reason?: string } => {
    let ok = false;
    let reason: string | undefined = undefined;

    setPending(prev => {
      const exists = prev.some(x => x.email.trim().toLowerCase() === m.email.trim().toLowerCase());
      if (exists) {
        reason = "Ese email ya está en la lista";
        return prev;
      }
      ok = true;
      return [m, ...prev];
    });

    return { ok, reason };
  };

  /** Animaciones y progreso */
  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -32, opacity: 0 }),
  };
  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      <section className="w-full max-w-4xl mx-auto bg-white rounded-[12px] border border-[#d3d3d3] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#0F172A] tracking-tight">Crear taller</h1>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">Completá los datos, sumá a tu equipo, confirmá y creamos tu taller.</p>

          {/* Stepper */}
          <div className="mt-6">
            <ol className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {steps.map((s) => {
                const isActive = step === s.id;
                const isDone = step > s.id;
                return (
                  <li key={s.id} className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={[
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors flex-shrink-0",
                      isDone ? "bg-[#0040B8] text-white border-[#0040B8]" :
                        isActive ? "bg-white text-[#0040B8] border-[#0040B8]" :
                          "bg-white text-[#94A3B8] border-[#E2E8F0]"
                    ].join(" ")}>
                      {isDone ? <CheckCircle size={18} /> : s.id}
                    </div>
                    <span className={`${isActive ? "text-[#0F172A] font-medium" : "text-[#64748B]"} text-sm sm:text-base`}>{s.title}</span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-[#0040B8] transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </header>

        {/* Contenido */}
        <form onSubmit={(e) => e.preventDefault()} className="text-left min-h-[400px] sm:min-h-[450px]">
          <AnimatePresence mode="popLayout" custom={dir}>
            {/* Paso 1 */}
            {step === 1 && (
              <motion.div
                key="step1" custom={dir} initial="enter" animate="center" exit="exit" variants={variants}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
              >
                <Field id="name" label="Nombre identificatorio" value={name} onChange={setName} required placeholder="Ej, Taller Central" className="lg:col-span-2"/>
                <Field id="phone" label="Teléfono" value={phone} onChange={setPhone} inputMode="tel" required placeholder="Ej, 3511234567" />
                <Field id="razon" label="Razón social" value={razonSocial} onChange={setRazonSocial} required placeholder="Ej, Talleres Central S.A." />
                <Field id="cuit" label="CUIT" value={cuit} onChange={setCuit} inputMode="numeric" required placeholder="Ej, 20-12345678-3" />
                <SelectField
                   id="province"
                   label="Provincia"
                   value={province}
                   onChange={setProvince}
                   options={[...new Set(provinceOptions.map(p => p.value))]}
                   required
                 />
                 {cityApiFailed || (cityOptions.length === 0 && !loadingCities && province) ? (
                   <Field
                     id="city"
                     label="Localidad"
                     value={city}
                     onChange={setCity}
                     required
                     placeholder="Ej, Córdoba Capital"
                     disabled={!province}
                   />
                 ) : (
                   <SelectField
                     id="city"
                     label="Localidad"
                     value={city}
                     onChange={setCity}
                     options={cityOptions}
                     required
                     disabled={loadingCities || !province || cityOptions.length === 0}
                   />
                 )}

                <Field id="address" label="Domicilio" value={address} onChange={setAddress} required placeholder="Calle y número, piso, referencia" />
                <Field id="plant" label="Número de planta" value={plantNumber} onChange={setPlantNumber} inputMode="numeric" type="number" required placeholder="Ej, 3" />
                <Field
                  id="disposition"
                  label="Número de disposición"
                  value={dispositionNumber}
                  onChange={setDispositionNumber}
                  inputMode="numeric"
                  type="text"
                  required
                  placeholder="Ingresa el número de disposición"
                />

                <div className="lg:col-span-2">
                  {error && <Alert type="error" message={error} />}
                  {success && <Alert type="success" message={success} />}
                </div>
                <div className="lg:col-span-2 mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <GhostLink onClick={() => router.push("/select-workshop")}>Cancelar</GhostLink>
                  <PrimaryButton type="button" onClick={goNext} iconRight={<MoveRight size={20} />}>Continuar</PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* Paso 2, email primero */}
            {step === 2 && (
              <motion.div
                key="step2" custom={dir} initial="enter" animate="center" exit="exit" variants={variants}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="grid grid-cols-1 gap-4 sm:gap-6"
              >
                <AddStaffCard onAdd={addPendingSafely} />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#0F172A] mb-3">Pendientes</h3>
                  <AnimatePresence initial={false}>
                    {pending.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-sm sm:text-base text-[#64748B] border border-dashed border-[#E2E8F0] rounded-[12px] p-4 sm:p-6"
                      >
                        Aún no agregaste a nadie, cargá un email, elegí su rol y completá los datos.
                      </motion.div>
                    ) : (
                      <ul className="grid grid-cols-1 gap-3 sm:gap-4">
                        {pending.map((m) => (
                          <motion.li
                            key={m.id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            className="rounded-[12px] border border-[#E2E8F0] p-4 sm:p-5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm sm:text-base text-[#0F172A] font-medium truncate">
                                  {m.first_name || "Sin nombre"} {m.last_name || ""}
                                </div>
                                <div className="text-xs sm:text-sm text-[#64748B] truncate">
                                  {m.email}{m.existingUserId ? ", existente" : ", nuevo"}
                                </div>
                                {(m.dni || m.phone_number) && (
                                  <div className="text-xs text-[#64748B] mt-1">
                                    {m.dni ? `DNI ${m.dni}` : ""}{m.dni && m.phone_number ? ", " : ""}{m.phone_number || ""}
                                  </div>
                                )}
                              </div>
                              {/* Rol editable inline */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs sm:text-sm text-[#64748B] whitespace-nowrap">Rol</label>
                                  <select
                                    className="rounded-[4px] border border-[#E2E8F0] bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm min-w-[120px]"
                                    value={m.user_type_id || ""}
                                    onChange={(e) => {
                                      const strVal = e.target.value;
                                      if (!strVal) return; // No actualizar si está vacío
                                      const val = Number(strVal);
                                      if (isNaN(val)) return; // No actualizar si no es un número válido
                                      setPending(p => p.map(x => {
                                        if (x.id !== m.id) return x;
                                        if (val !== ENGINEER_ROLE_ID) {
                                          const { license_number, title_name, engineer_kind, ...rest } = x;
                                          return { ...rest, user_type_id: val }; // engineer_kind queda undefined
                                        }
                                        return { ...x, user_type_id: val };
                                      }));
                                    }}
                                  >
                                    <option value="">Seleccionar</option>
                                    {FIXED_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                  </select>
                                </div>
                                <IconButton label="Quitar" onClick={() => setPending(p => p.filter(x => x.id !== m.id))}><X size={16} /></IconButton>
                              </div>
                            </div>
                              {m.existingUserId && m.user_type_id === ENGINEER_ROLE_ID && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                  <div className="flex flex-col">
                                    <label className="text-xs text-[#64748B] mb-1">Tipo de ingeniero</label>
                                    <select
                                      className="rounded-[4px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
                                      value={m.engineer_kind ?? ""}  // <- muestra "" si no hay valor
                                      onChange={(e) => {
                                        const v = e.target.value as EngineerKind | ""; // "Titular" | "Suplente" | ""
                                        setPending((p) =>
                                          p.map((x) =>
                                            x.id === m.id
                                              ? { ...x, engineer_kind: v === "" ? undefined : v } // <- nunca ""
                                              : x
                                          )
                                        );
                                      }}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="Titular">Titular</option>
                                      <option value="Suplente">Suplente</option>
                                    </select>
                                  </div>

                                  <div className="flex flex-col">
                                    <label className="text-xs text-[#64748B] mb-1">Nro de matrícula</label>
                                    <input
                                      className="rounded-[4px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
                                      placeholder="Ej, 12345"
                                      value={m.license_number || ""}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setPending((p) =>
                                          p.map((x) => x.id === m.id ? { ...x, license_number: v } : x)
                                        );
                                      }}
                                    />
                                  </div>

                                  <div className="flex flex-col">
                                    <label className="text-xs text-[#64748B] mb-1">Título universitario</label>
                                    <input
                                      className="rounded-[4px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
                                      placeholder="Ej, Ing. Mecánico"
                                      value={m.title_name || ""}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setPending((p) =>
                                          p.map((x) => x.id === m.id ? { ...x, title_name: v } : x)
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </AnimatePresence>
                </div>

                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}
                {/* Declaración jurada, obligatorio */}
                <div className="rounded-[12px] border border-[#E2E8F0] p-4 sm:p-5 bg-[#F8FAFC]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={swornChecked}
                      onChange={(e) => setSwornChecked(e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="text-sm text-[#0F172A] leading-relaxed">
                      Como responsable del taller de Revisión Técnica Obligatoria, certifico en carácter de declaración jurada, que el taller se encuentra debidamente registrado bajo acto administrativo otorgado por la Agencia Nacional de Seguridad Vial y los datos que registro en el presente, son fehacientes y se encuentras vigentes.
                    </span>
                  </label>
                  {!swornChecked && (
                    <p className="mt-2 text-xs text-[#64748B]">
                      Tenés que aceptar esto para poder continuar.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <GhostButton onClick={goBack}><ChevronLeft size={18} />Volver</GhostButton>
                  <PrimaryButton type="button" onClick={goNext} iconRight={<MoveRight size={20} />}>Continuar</PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* Paso 3, confirmación */}
            {step === 3 && (
              <motion.div
                key="step3" custom={dir} initial="enter" animate="center" exit="exit" variants={variants}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="grid grid-cols-1 gap-4 sm:gap-6"
              >
                <SummaryCard
                  onEdit={() => setStep(1)}
                  rows={[
                    ["Nombre", name || "—"], ["Teléfono", phone || "—"], ["Razón social", razonSocial || "—"],
                    ["CUIT", cuit || "—"], ["Provincia", province || "—"], ["Localidad", city || "—"],
                    ["Domicilio", address || "—"], ["Número de planta", plantNumber || "—"],
                    ["Número de disposición", dispositionNumber || "—"],
                  ]}
                />
                <TeamSummary onEdit={() => setStep(2)} items={pending} />

                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}
                <p className="text-xs text-[#64748B] mt-1 ml-1">
                  Al crear aceptás nuestros{" "}
                  <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#0040B8] underline underline-offset-4">
                    Términos y condiciones
                  </a>.
                </p>

                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <GhostButton onClick={goBack}><ChevronLeft size={18} />Volver</GhostButton>
                  <PrimaryButton type="button" onClick={handleCreateOnStep3} loading={submitting} iconRight={<Check size={18} />}>
                    Crear taller
                  </PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </section>
    </main>
  );
}

/* ===== Subcomponentes, paso 2 ===== */

function AddStaffCard({ onAdd }: { onAdd: (m: PendingMember) => { ok: boolean; reason?: string } }) {
  const [email, setEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [engineerKind, setEngineerKind] = useState<EngineerKind | "">("");

  // si NO existe, mostramos estos campos
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");

  const [license, setlicense] = useState("");
  const [degree, setDegree] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const clearForm = () => {
    setFirstName(""); setLastName(""); setDni(""); setPhone(""); setRoleId("");
    setlicense(""); setDegree(""); setPassword(""); setConfirm("");
    setEngineerKind(""); // <<< NUEVO
    setShowPass(false); setShowConfirm(false);
  };

  const onChangeRole = (val: number | "") => {
    setRoleId(val);
    if (val !== ENGINEER_ROLE_ID) {
      setlicense("");
      setDegree("");
      setEngineerKind("");
    }
  };

  const searchAndAdd = async () => {
    setMsg(null);
    setNotFound(false);

    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) {
      setMsg("Ingresá un email válido");
      return;
    }

    setLookupLoading(true); // <<< importante

    try {
      const url = `${API_BASE}/users/by-email-lite?email=${encodeURIComponent(normalized)}`;
      const r = await fetch(url, { cache: "no-store", credentials: "include" });

      if (r.ok) {
        const u = await r.json();

        // Normalizamos el id recibido
        const idRaw = u?.id;
        const idStr =
          typeof idRaw === "string" ? idRaw
            : typeof idRaw === "number" ? String(idRaw)
              : idRaw?.toString?.() || null;

        if (idStr) {
          // Tomamos campos típicos que pueda devolver tu endpoint "lite"
          const first_name = u?.first_name || u?.firstName || "";
          const last_name = u?.last_name || u?.lastName || "";
          const dni = u?.dni ?? null;
          const phone_number = u?.phone_number ?? u?.phone ?? null;
          const license_number = u?.license_number ?? u?.licenseNumber ?? null;
          const title_name = u?.title_name ?? u?.titleName ?? null;

          const newItem: PendingMember = {
            id: crypto.randomUUID(),
            email: normalized,
            existingUserId: idStr,
            user_type_id: 0,              // el rol se elige en la UI, valor temporal hasta que se seleccione
            first_name,
            last_name,
            dni,
            phone_number,
            license_number: license_number || null,
            title_name: title_name || null,
            // para existentes no seteamos password
          };

          const res = onAdd(newItem);
          if (!res.ok) {
            setMsg(res.reason || "Ya está en la lista");
            return;
          }
          setMsg("Usuario existente agregado a la lista");
          setEmail("");
          clearForm();
          return;
        }
      }

      // Si no existe
      setNotFound(true);
      setMsg("No existe, completá los datos para crearlo");
    } catch {
      setMsg("No se pudo verificar el email");
    } finally {
      setLookupLoading(false);
    }
  };
  // Genera una contraseña robusta con al menos 1 minúscula, 1 mayúscula, 1 dígito y 1 símbolo
  function generatePassword(length = 12) {
    const lowers = "abcdefghijkmnopqrstuvwxyz"; // sin l
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";  // sin O
    const digits = "23456789";                  // sin 0,1
    const symbols = "!@#$%^&*()_+[]{};:,./?";
    const all = lowers + uppers + digits + symbols;

    const pick = (pool: string) => pool[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2**32) * pool.length)];

    // garantizamos 1 de cada tipo
    let pwd = pick(lowers) + pick(uppers) + pick(digits) + pick(symbols);

    // resto aleatorio
    for (let i = pwd.length; i < length; i++) {
      pwd += pick(all);
    }

    // shuffle
    const arr = pwd.split("");
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2**32) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }

  const addNewToPending = () => {
    setMsg(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setMsg("Ingresá un email");
    if (!roleId) return setMsg("Seleccioná un rol");
    if (roleId === ENGINEER_ROLE_ID && (!license.trim() || !degree.trim())) {
      return setMsg("Para Ingeniero, completá matrícula y título");
    }

    // si no cargaron password manualmente, la generamos
    const auto = password && confirm ? null : generatePassword(12);
    const finalPassword = password && confirm ? password : auto!;
    const finalConfirm  = password && confirm ? confirm  : auto!;

    if (finalPassword.length < 8) return setMsg("La contraseña debe tener al menos 8 caracteres");
    if (finalPassword !== finalConfirm) return setMsg("Las contraseñas no coinciden");
    if (roleId === ENGINEER_ROLE_ID) {
      if (!engineerKind) return setMsg("Elegí si el ingeniero es Titular o Suplente");
    }

    const item: PendingMember = {
      id: crypto.randomUUID(),
      email: normalized,
      user_type_id: roleId,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      dni: dni || null,
      phone_number: phone || null,
      license_number: roleId === ENGINEER_ROLE_ID ? license.trim() : null,
      title_name: roleId === ENGINEER_ROLE_ID ? degree.trim() : null,
      password: finalPassword,
      confirm_password: finalConfirm,
      engineer_kind: roleId === ENGINEER_ROLE_ID
    ? (engineerKind === "" ? undefined : engineerKind)
    : undefined,
    };

    const res = onAdd(item);
    if (!res.ok) {
      setMsg(res.reason || "Ya está en la lista");
      return;
    }

    setEmail("");
    clearForm();
    setNotFound(false);

    // avisamos si se autogeneró
    if (auto) {
      setMsg(`Agregado, contraseña autogenerada: ${auto}`);
    } else {
      setMsg("Agregado a la lista");
    }
    setTimeout(()=>setMsg(null), 1800);
  };

  return (
    <div className="rounded-[12px] border border-[#E2E8F0] p-4 sm:p-6 bg-gradient-to-br from-white to-[#F8FAFC]">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Agregar personal al taller</h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-1">Si existe se suma directo, si no existe completás sus datos.</p>

          {/* Email y buscar, centrado simétrico */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-6 gap-3">
            <TextInput
              id="email" label="Email" value={email} onChange={setEmail}
              leftIcon={<Mail size={16} />} className="lg:col-span-4"
              placeholder="ejemplo@dominio.com"
            />
            <div className="lg:col-span-2 flex items-end">
              <button
                type="button" onClick={searchAndAdd} disabled={lookupLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 border border-[#E2E8F0]
                           hover:bg-[#F8FAFC] active:bg-[#E2E8F0] transition disabled:opacity-60 text-sm sm:text-base"
              >
                <Search size={16} />
                {lookupLoading ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </div>

          {/* Form de alta solo si no existe */}
          {notFound && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-2 text-sm sm:text-base font-medium text-[#0F172A] block">Rol</label>
                  <select
                    className="w-full rounded-[10px] border border-[#E2E8F0] px-3.5 py-3 text-sm sm:text-base"
                    value={roleId}
                    onChange={(e) => onChangeRole(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Seleccionar</option>
                    {FIXED_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">Rol dentro del taller.</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <LabeledInput label="Nombres" value={firstName} onChange={setFirstName} />
                <LabeledInput label="Apellidos" value={lastName} onChange={setLastName} />
                <LabeledInput label="DNI" value={dni} onChange={setDni} />
                <LabeledInput label="Teléfono" value={phone} onChange={setPhone} />
              </div>

              {roleId === ENGINEER_ROLE_ID && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col">
                    <label className="block text-sm sm:text-base font-medium text-[#0F172A] mb-2">Tipo Ingeniero</label>
                    <select
                      className="w-full border border-[#E2E8F0] rounded-[10px] px-3.5 py-3 text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus-visible:ring-4 focus-visible:ring-[#0040B8]/20 focus:border-[#0040B8] transition-shadow"
                      value={engineerKind}
                      onChange={(e) => setEngineerKind(e.target.value as "Titular" | "Suplente" | "")}
                    >
                      <option value="">Seleccionar</option>
                      <option value="Titular">Titular</option>
                      <option value="Suplente">Suplente</option>
                    </select>
                  </div>

                  <LabeledInput label="Nro de matrícula" value={license} onChange={setlicense} />
                  <LabeledInput label="Título universitario" value={degree} onChange={setDegree} />
                </div>
              )}

              {/* <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-sm mb-2">Contraseña</label>
                  <input
                    className="w-full border rounded p-3 pr-10"
                    type={showPass ? "text" : "password"}
                    placeholder="Ingresá una contraseña segura"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                  />
                  <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-9">
                    {showPass ? <EyeOff className="w-5 h-5 text-[#0040B8]" /> : <Eye className="w-5 h-5 text-[#0040B8]" />}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm mb-2">Confirmar contraseña</label>
                  <input
                    className="w-full border rounded p-3 pr-10"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repetí la contraseña"
                    value={confirm}
                    onChange={(e)=>setConfirm(e.target.value)}
                  />
                  <button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute right-3 top-9">
                    {showConfirm ? <EyeOff className="w-5 h-5 text-[#0040B8]" /> : <Eye className="w-5 h-5 text-[#0040B8]" />}
                  </button>
                </div>
              </div> */}

              <div className="mt-6 flex justify-center mb-4">
                <PrimaryButton type="button" onClick={addNewToPending} iconRight={<Plus size={18} />}>
                  Agregar a la lista
                </PrimaryButton>
              </div>
            </motion.div>
          )}

          {msg && (
            <div className="mt-4 text-xs sm:text-sm text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0] rounded px-3 py-2">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Tarjetas de resumen del paso 3 ===== */

function SummaryCard({ rows, onEdit }: { rows: [string, string][]; onEdit: () => void; }) {
  return (
    <div className="rounded-[12px] border border-[#E2E8F0] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Revisá los datos</h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-1">Confirmá que esté correcto antes de crear el taller.</p>
        </div>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm sm:text-base text-[#0040B8] hover:opacity-80 self-start sm:self-auto">
          <Edit3 size={16} /> Editar
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3 text-sm sm:text-base">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs sm:text-sm text-[#64748B]">{k}</dt>
            <dd className="text-[#0F172A] break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TeamSummary({ items, onEdit }: { items: PendingMember[]; onEdit: () => void; }) {
  return (
    <div className="rounded-[12px] border border-[#E2E8F0] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#0F172A]">Personal de planta registrado</h3>
          <p className="text-sm sm:text-base text-[#64748B] mt-1">Se crearán o asociarán al confirmar.</p>
        </div>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm sm:text-base text-[#0040B8] hover:opacity-80 self-start sm:self-auto">
          <Edit3 size={16} /> Editar
        </button>
      </div>
      {items.length === 0 ? (
        <div className="mt-3 text-sm sm:text-base text-[#64748B]">Sin miembros por ahora.</div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3">
          {items.map((m) => (
            <li key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between border border-[#E2E8F0] rounded-[10px] px-3.5 py-3 gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base text-[#0F172A] font-medium truncate">{m.first_name || "Sin nombre"} {m.last_name || ""}</div>
                <div className="text-xs sm:text-sm text-[#64748B] truncate">{m.email}{m.existingUserId ? ", existente" : ", nuevo"}</div>
              </div>
              <span className="text-xs sm:text-sm text-[#0F172A] font-medium self-start sm:self-auto">
                {m.user_type_id === 2 ? "Titular"
                  : m.user_type_id === 3 ? `Ingeniero${m.engineer_kind ? ` (${m.engineer_kind})` : ""}`
                  : m.user_type_id === 4 ? "Administrativo"
                  : m.user_type_id === 6 ? "Personal de planta"
                  : "Sin rol"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===== UI genéricos ===== */

function Field(props: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  help?: string; disabled?: boolean; required?: boolean; type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;  
}) {
  const { id, label, value, onChange, placeholder, help, disabled, required, type = "text", inputMode, className  } = props;
  return (
    <div className={`flex flex-col ${className || ""}`}>
      <label htmlFor={id} className="mb-2 text-sm sm:text-base font-medium text-[#0F172A]">{label} {required ? <span className="text-[#EF4444]">*</span> : null}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        disabled={disabled} inputMode={inputMode}
        className="w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3.5 py-3 text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8]
                   outline-none focus-visible:ring-4 focus-visible:ring-[#0040B8]/20 focus:border-[#0040B8] transition-shadow" />
      {help ? <p className="text-xs sm:text-sm text-[#64748B] mt-1">{help}</p> : null}
    </div>
  );
}

function TextInput({ id, label, value, onChange, placeholder, leftIcon, className = "" }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; leftIcon?: React.ReactNode; className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={id} className="mb-2 text-sm sm:text-base font-medium text-[#0F172A]">{label}</label>
      <div className="relative">
        {leftIcon ? <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70">{leftIcon}</div> : null}
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3.5 py-3 text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] outline-none
                      focus-visible:ring-4 focus-visible:ring-[#0040B8]/20 focus:border-[#0040B8] transition-shadow ${leftIcon ? "pl-10" : ""}`} />
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm sm:text-base font-medium text-[#0F172A] mb-2">{label}</label>
      <input className="w-full border border-[#E2E8F0] rounded-[10px] px-3.5 py-3 text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus-visible:ring-4 focus-visible:ring-[#0040B8]/20 focus:border-[#0040B8] transition-shadow" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, required, disabled }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 text-sm sm:text-base font-medium text-[#0F172A]">{label} {required ? <span className="text-[#EF4444]">*</span> : null}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className={`w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3.5 py-3 text-sm sm:text-base text-[#0F172A]
                   outline-none focus-visible:ring-4 focus-visible:ring-[#0040B8]/20 focus:border-[#0040B8] transition-shadow
                   ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}>
        <option value="">{disabled ? 'Seleccioná una provincia primero' : 'Seleccionar'}</option>
        {options.map((opt, index) => <option key={`${opt}-${index}`} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function IconButton({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label?: string; }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center justify-center rounded-[8px] p-2 border border-[#E2E8F0] hover:bg-[#F8FAFC] active:bg-[#E2E8F0] transition"
      aria-label={label} title={label}>
      {children}
    </button>
  );
}

function Alert({ type, message }: { type: "error" | "success"; message: string; }) {
  const isError = type === "error";
  return (
    <div className={[
      "flex items-center gap-2 rounded-[10px] px-3.5 py-3 text-sm",
      isError ? "bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]" :
        "bg-[#F0FDF4] text-[#14532D] border border-[#BBF7D0]"
    ].join(" ")} role="alert">
      <Info size={18} /><span>{message}</span>
    </div>
  );
}

function PrimaryButton({ children, onClick, type = "button", loading, iconRight }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; loading?: boolean; iconRight?: React.ReactNode;
}) {
  return (
    <button type={type} onClick={onClick} disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-[4px] px-4 sm:px-6 py-3 sm:py-4 bg-[#0040B8] text-white font-medium shadow-sm text-sm sm:text-base
                 hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition w-full sm:w-auto" title="Continuar">
      <span>{loading ? "Procesando..." : children}</span>{!loading && iconRight}
    </button>
  );
}

function GhostButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-2 text-[#0F172A] rounded-[12px] px-3 sm:px-4 py-2 sm:py-3 hover:bg-[#F1F5F9] active:bg-[#E2E8F0] disabled:opacity-60 disabled:cursor-not-allowed transition text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
      {children}
    </button>
  );
}

function GhostLink({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="text-[#0040B8] underline underline-offset-4 hover:opacity-80 disabled:opacity-60 transition text-sm sm:text-base w-full sm:w-auto text-center sm:text-left">
      {children}
    </button>
  );
}
