// app/dashboard/[id]/users/create-user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Eye, EyeOff, ChevronRight } from "lucide-react";
import { genPassword } from "@/utils";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  dni: string | null;
  phone_number: string | null;
  title_name?: string | null;
  license_number?: string | null;
  user_type_id?: number | null; // rol del usuario en ESTE taller
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
type Role = { id: number; name: string };

const FIXED_ROLES: Role[] = [
  { id: 3, name: "Ingeniero" },
  { id: 4, name: "Operador" },
  { id: 5, name: "Soporte" },
];

const ENGINEER_ROLE_ID = 3;

export default function CreateOrAttachUserPage() {
  const params = useParams<{ id: string }>();
  const workshopId = Number(params.id);
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [roles] = useState<Role[]>(FIXED_ROLES);

  const [existingUser, setExistingUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [dni, setDni]             = useState("");
  const [phone, setPhone]         = useState("");
  const [roleId, setRoleId]       = useState<number | "">("");

  // Campos extra para Ingeniero
  const [engineerRegistration, setEngineerRegistration] = useState("");
  const [engineerDegree, setEngineerDegree]             = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState<{type: "success"|"error", text: string} | null>(null);

  const isExisting = !!existingUser;
  const [userChoseEngineer, setUserChoseEngineer] = useState(false); // <- NUEVO: si el user eligió Ingeniero desde el select

  // 🔒 Regla de edición de los extras de ingeniero:
  // - Creación: editable si el rol es Ingeniero
  // - Usuario existente: editable SOLO si el usuario lo selecciona desde el input (no por venir del endpoint)
  const engineerEditable = roleId === ENGINEER_ROLE_ID && (!isExisting || userChoseEngineer);
  const ctaLabel = isExisting ? "Asociar al taller" : "Crear usuario";

  // Clases de estilo
  const roCls = isExisting ? "opacity-75 bg-gray-50 cursor-not-allowed" : "";
  const inputCls = `w-full border rounded p-3 ${roCls}`;
  const passInputCls = `w-full border rounded p-3 pr-10 ${roCls}`;
  const engineerInputCls = `w-full border rounded p-3 ${engineerEditable ? "" : "opacity-75 bg-gray-50 cursor-not-allowed"}`;

  // Buscar usuario por email (con workshop_id)
  useEffect(() => {
    let mounted = true;
    (async () => {
      // cada vez que cambia el email de búsqueda, asumimos que aún NO eligió ingeniero manualmente
      setUserChoseEngineer(false);

      if (!email) {
        resetFormExceptEmail();
        setExistingUser(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setMsg(null);
        const url = `${API_BASE}/users/by-email?email=${encodeURIComponent(email)}&workshop_id=${workshopId}`;
        const r = await fetch(url, { cache: "no-store", credentials: "include" });

        if (r.ok) {
          const u: User | null = await r.json();
          if (!mounted) return;

          if (u) {
            setExistingUser(u);

            // Pre-cargar datos básicos
            setFirstName(u.first_name ?? "");
            setLastName(u.last_name ?? "");
            setDni(u.dni ?? "");
            setPhone(u.phone_number ?? "");

            // Si ya tiene rol en este taller, lo preseleccionamos
            if (typeof u.user_type_id === "number") setRoleId(u.user_type_id);
            else setRoleId("");

            // Pre-cargar datos de ingeniero si existen
            setEngineerRegistration(u.license_number ?? "");
            setEngineerDegree(u.title_name ?? "");
          } else {
            setExistingUser(null);
            resetFormExceptEmail();
          }
        } else {
          setExistingUser(null);
          resetFormExceptEmail();
        }
      } catch (e: any) {
        setMsg({ type: "error", text: e.message || "Error cargando datos" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [email, workshopId]);

  const resetFormExceptEmail = () => {
    setFirstName("");
    setLastName("");
    setDni("");
    setPhone("");
    setRoleId("");
    setEngineerRegistration("");
    setEngineerDegree("");
    setPassword("");
    setConfirm("");
    setShowPass(false);
    setShowConfirm(false);
    setUserChoseEngineer(false);
  };

  // Manejo del cambio de rol: marcamos si el user selecciona Ingeniero desde el input
  const onChangeRole = (val: number | "") => {
    setRoleId(val);
    setUserChoseEngineer(val === ENGINEER_ROLE_ID); // true solo si el usuario eligió Ingeniero manualmente
  };

  // Si cambia a rol distinto de Ingeniero, limpiamos campos de ingeniero (opcional)
  useEffect(() => {
    if (roleId !== ENGINEER_ROLE_ID) {
      setEngineerRegistration("");
      setEngineerDegree("");
    }
  }, [roleId]);

  const handleGeneratePassword = () => {
    const p = genPassword();
    setPassword(p);
    setConfirm(p);
    setMsg({ type: "success", text: "Contraseña generada" });
  };

  const submit = async () => {
    setMsg(null);
    if (!roleId) {
      setMsg({ type: "error", text: "Selecciona un rol" });
      return;
    }

    // Requerido SOLO cuando el rol Ingeniero fue elegido desde el input (creación o cambio de rol)
    if (engineerEditable && roleId === ENGINEER_ROLE_ID) {
      if (!engineerRegistration.trim() || !engineerDegree.trim()) {
        setMsg({ type: "error", text: "Para Ingeniero, completá Nro de matrícula y Título universitario" });
        return;
      }
    }

    try {
      if (!isExisting) {
        // crear usuario
        if (!password || !confirm) {
          setMsg({ type: "error", text: "Ingresá la contraseña y su confirmación" });
          return;
        }
        if (password !== confirm) {
          setMsg({ type: "error", text: "Las contraseñas no coinciden" });
          return;
        }
        if (password.length < 8) {
          setMsg({ type: "error", text: "La contraseña debe tener al menos 8 caracteres" });
          return;
        }

        const payload: any = {
          email,
          password,
          confirm_password: confirm,
          first_name: firstName,
          last_name: lastName,
          dni: dni || null,
          phone_number: phone || null,
          workshop_id: workshopId,
          user_type_id: roleId,
        };

        // En creación: si eligió Ingeniero, mandamos extras
        if (roleId === ENGINEER_ROLE_ID) {
          payload.license_number = engineerRegistration.trim();
          payload.title_name     = engineerDegree.trim();
        }

        const r = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const err = await r.json().catch(()=>null);
          throw new Error(err?.error || "No se pudo crear el usuario");
        }

        setExistingUser(null);
        resetFormExceptEmail();
        setMsg({ type: "success", text: "Usuario creado" });
      } else {
        // asociar usuario existente
        const payload: any = {
          user_id: existingUser.id,
          user_type_id: roleId,
        };

        // Si el usuario eligió Ingeniero desde el input (cambio a ingeniero), mandamos/actualizamos extras
        if (engineerEditable && roleId === ENGINEER_ROLE_ID) {
          payload.license_number = engineerRegistration.trim() || null;
          payload.title_name     = engineerDegree.trim() || null;
        }
        // Si vino como ingeniero desde el endpoint y no tocó el rol, NO mandamos extras (no editable)

        const rAttach = await fetch(`${API_BASE}/users/assign/${workshopId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!rAttach.ok) {
          const err = await rAttach.json().catch(()=>null);
          throw new Error(err?.error || "No se pudo asociar el usuario");
        }
        setMsg({ type: "success", text: "Usuario asociado" });
        setTimeout(() => router.push(`/dashboard/${workshopId}/users`), 600);
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Error" });
    }
  };

  return (
    <>
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Usuarios</span>
        </div>
      </article>

      <div className="min-h-screen w-full flex flex-col items-center justify-start">
        <div className="w-full max-w-5xl px-6 pt-6">
          <div className="mx-auto max-w-5xl mt-6">
            <h2 className="text-xl font-regular mb-1">Crear usuario</h2>
            <p className="text-[#00000080] mb-8">
              Ingrese los datos de la persona a la que quieras registrar.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-2">Nombres</label>
                <input
                  className={inputCls}
                  value={firstName}
                  onChange={(e)=>setFirstName(e.target.value)}
                  readOnly={isExisting}
                  disabled={isExisting}
                  placeholder="Ej, Alejo Joaquin"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Apellidos</label>
                <input
                  className={inputCls}
                  value={lastName}
                  onChange={(e)=>setLastName(e.target.value)}
                  readOnly={isExisting}
                  disabled={isExisting}
                  placeholder="Ej, Vaquero Yornet"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">DNI</label>
                <input
                  className={inputCls}
                  value={dni}
                  onChange={(e)=>setDni(e.target.value)}
                  readOnly={isExisting}
                  disabled={isExisting}
                  placeholder="Ej, 99.999.999"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Teléfono</label>
                <input
                  className={inputCls}
                  value={phone}
                  onChange={(e)=>setPhone(e.target.value)}
                  readOnly={isExisting}
                  disabled={isExisting}
                  placeholder="Ej, 3519999999"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Email</label>
                <input
                  className={`w-full border rounded p-3 bg-gray-50 ${isExisting ? "opacity-75 cursor-not-allowed" : ""}`}
                  value={email}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Rol</label>
                <select
                  className="w-full border rounded p-3"
                  value={roleId}
                  onChange={(e)=>onChangeRole(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 text-left">
                  Este rol es el que cumplirá dentro del taller.
                </p>
              </div>

              {/* Campos adicionales para Ingeniero (antes de contraseñas) */}
              {roleId === ENGINEER_ROLE_ID && (
                <>
                  <div>
                    <label className="block text-sm mb-2">Nro de matrícula</label>
                    <input
                      className={engineerInputCls}
                      value={engineerRegistration}
                      onChange={(e)=>setEngineerRegistration(e.target.value)}
                      placeholder="Ej: 12345"
                      readOnly={!engineerEditable}
                      disabled={!engineerEditable}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Título universitario</label>
                    <input
                      className={engineerInputCls}
                      value={engineerDegree}
                      onChange={(e)=>setEngineerDegree(e.target.value)}
                      placeholder="Ej: Ing. Mecánico"
                      readOnly={!engineerEditable}
                      disabled={!engineerEditable}
                    />
                  </div>
                </>
              )}

              {/* Passwords */}
              <div className="relative">
                <label className="block textsm mb-2">Contraseña</label>
                <input
                  className={passInputCls}
                  type={showPass ? "text" : "password"}
                  placeholder={isExisting ? "" : "Ingresá una contraseña segura"}
                  value={isExisting ? "••••••••" : password}
                  onChange={(e)=>!isExisting && setPassword(e.target.value)}
                  readOnly={isExisting}
                  disabled={isExisting}
                />
                <button
                  type="button"
                  onClick={()=>setShowPass(v=>!v)}
                  className={`absolute right-3 py-4 ${isExisting ? "pointer-events-none opacity-50" : ""}`}
                  tabIndex={isExisting ? -1 : 0}
                  disabled={isExisting}
                  aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPass ? <EyeOff className="w-5 h-5 text-[#0040B8]" /> : <Eye className="w-5 h-5 text-[#0040B8]" />}
                </button>
                {!isExisting && (
                  <button type="button" onClick={handleGeneratePassword} className="text-xs text-[#0040B8] mt-2">
                    Generar automáticamente
                  </button>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm mb-2">Confirmar Contraseña</label>
                <input
                  className={passInputCls}
                  type={showConfirm ? "text" : "password"}
                  placeholder={isExisting ? "" : "Repetí la contraseña"}
                  value={isExisting ? "••••••••" : confirm}
                  onChange={(e)=>!isExisting && setConfirm(e.target.value)}
                  readOnly={isExisting}
                  disabled={isExisting}
                />
                <button
                  type="button"
                  onClick={()=>setShowConfirm(v=>!v)}
                  className={`absolute right-3 py-4 ${isExisting ? "pointer-events-none opacity-50" : ""}`}
                  tabIndex={isExisting ? -1 : 0}
                  disabled={isExisting}
                  aria-label={showConfirm ? "Ocultar confirmación" : "Ver confirmación"}
                  title={showConfirm ? "Ocultar confirmación" : "Ver confirmación"}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5 text-[#0040B8]" /> : <Eye className="w-5 h-5 text-[#0040B8]" />}
                </button>
              </div>
            </div>

            {msg && (
              <div className="flex justify-center mt-8">
                <div
                  className={`mb-6 rounded border px-4 w-full py-3 text-sm ${
                    msg.type === "error"
                      ? "border-red-300 bg-red-50 text-red-800"
                      : "border-green-300 bg-green-50 text-green-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )}

            <div className="flex gap-6 justify-center mt-10">
              <button
                onClick={()=>router.back()}
                className="border text-[#0040B8] hover:bg-[#0040B8] duration-150 hover:text-white border-[#0040B8] px-5 py-3 rounded"
              >
                Volver
              </button>
              <button onClick={submit} className="bg-[#0040B8] text-white px-6 py-3 rounded">
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
