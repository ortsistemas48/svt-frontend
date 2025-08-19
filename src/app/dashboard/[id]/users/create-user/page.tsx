// app/dashboard/[id]/users/create-user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";
import { genPassword } from "@/utils";
type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  dni: string | null;
  phone_number: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
type Role = { id: number; name: string };

const FIXED_ROLES: Role[] = [
  { id: 2, name: "Titular" },
  { id: 3, name: "Ingeniero" },
  { id: 4, name: "Operador" },
  { id: 5, name: "Soporte" },
];


export default function CreateOrAttachUserPage() {
  const params = useParams<{ id: string }>();
  const workshopId = Number(params.id);
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const rolesLoading = false; 
  const [roles] = useState<Role[]>(FIXED_ROLES);
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [dni, setDni]             = useState("");
  const [phone, setPhone]         = useState("");
  const [roleId, setRoleId]       = useState<number | "">("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [msg, setMsg] = useState<{type: "success"|"error", text: string} | null>(null);

  const isReadOnly = !!existingUser;
  const ctaLabel = existingUser ? "Asociar al taller" : "Crear usuario";


  // 2) Buscar usuario por email cuando esté disponible
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!email) {
        // si no hay email, limpiamos el estado y terminamos
        resetFormExceptEmail();
        setExistingUser(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setMsg(null);
        const r = await fetch(
          `${API_BASE}/users/by-email?email=${encodeURIComponent(email)}`,
          { cache: "no-store", credentials: "include" }
        );
        if (r.ok) {
          const u: User | null = await r.json();
          if (!mounted) return;
          if (u) {
            setExistingUser(u);
            setFirstName(u.first_name ?? "");
            setLastName(u.last_name ?? "");
            setDni(u.dni ?? "");
            setPhone(u.phone_number ?? "");
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
  }, [email]);

  const resetFormExceptEmail = () => {
    setFirstName("");
    setLastName("");
    setDni("");
    setPhone("");
    setRoleId("");
    setPassword("");
    setConfirm("");
    setShowPass(false);
    setShowConfirm(false);
  };

  const handleGeneratePassword = () => {
   const generatePassword = genPassword();
   setPassword(generatePassword);
    setConfirm(generatePassword);
    setMsg({ type: "success", text: "Contraseña generada" });
  }

  const submit = async () => {
    setMsg(null);
    if (!roleId) {
      setMsg({ type: "error", text: "Selecciona un rol" });
      return;
    }

    try {
      if (!existingUser) {
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

        const r = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
            confirm_password: confirm,
            first_name: firstName,
            last_name: lastName,
            dni: dni || null,
            phone_number: phone || null,
            workshop_id: workshopId,
            user_type_id: roleId,
          }),
        });
        if (!r.ok) {
          const err = await r.json().catch(()=>null);
          throw new Error(err?.error || "No se pudo crear el usuario");
        }

        // éxito creando: reseteo todos los campos
        setExistingUser(null);
        resetFormExceptEmail();
        setMsg({ type: "success", text: "Usuario creado" });
        // si querés limpiar también el email del query:
        // router.replace(`/dashboard/${workshopId}/users/create-user`);
      } else {
        const rAttach = await fetch(`${API_BASE}/users/assign/${workshopId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_id: existingUser.id, user_type_id: roleId }),
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
        {/* migas centradas */}


        {/* títulos centrados */}


        {/* formulario centrado */}
        <div className="mx-auto max-w-5xl mt-6">
        <h2 className="text-xl font-regular mb-1">Crear usuario</h2>
        <p className="text-[#00000080] mb-8">
          Ingrese los datos de la persona a la que quieras registrar.
        </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2">Nombres</label>
              <input className="w-full border rounded p-3" value={firstName} onChange={(e)=>setFirstName(e.target.value)} readOnly={isReadOnly} placeholder="Ej, Alejo Joaquin" />
            </div>
            <div>
              <label className="block text-sm mb-2">Apellidos</label>
              <input className="w-full border rounded p-3" value={lastName} onChange={(e)=>setLastName(e.target.value)} readOnly={isReadOnly} placeholder="Ej, Vaquero Yornet" />
            </div>

            <div>
              <label className="block text-sm mb-2">DNI</label>
              <input className="w-full border rounded p-3" value={dni} onChange={(e)=>setDni(e.target.value)} readOnly={isReadOnly} placeholder="Ej, 99.999.999" />
            </div>
            <div>
              <label className="block text-sm mb-2">Teléfono</label>
              <input className="w-full border rounded p-3" value={phone} onChange={(e)=>setPhone(e.target.value)} readOnly={isReadOnly} placeholder="Ej, 3519999999" />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input className="w-full border rounded p-3 bg-gray-50" value={email} readOnly />
            </div>
            <div>
              <label className="block text-sm mb-2">Rol</label>
                <select
                className="w-full border rounded p-3"
                value={roleId}
                onChange={(e)=>setRoleId(e.target.value ? Number(e.target.value) : "")}
                >
                <option value="">Seleccione un rol</option>
                {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                ))}
                </select>
              <p className="text-xs text-gray-500 mt-2 text-left">Este rol es el que cumplirá dentro del taller.</p>
            </div>

            {/* Passwords */}
            <div className="relative">
              <label className="block text-sm mb-2">Contraseña</label>
              <input
                className="w-full border rounded p-3 pr-10"
                type={showPass ? "text" : "password"}
                placeholder={isReadOnly ? "" : "Ingresá una contraseña segura"}
                value={isReadOnly ? "••••••••" : password}
                onChange={(e)=>!isReadOnly && setPassword(e.target.value)}
                readOnly={isReadOnly}
              />
              <button
                type="button"
                onClick={()=>setShowPass(v=>!v)}
                className="absolute right-3 py-4"
                tabIndex={-1}
                aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPass ? <EyeOff className="w-5 h-5 text-[#0040B8]" /> : <Eye className="w-5 h-5 text-[#0040B8]" />}
              </button>
              {!isReadOnly && (
                <button type="button" onClick={handleGeneratePassword} className="text-xs text-[#0040B8] mt-2">
                  Generar automáticamente
                </button>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm mb-2">Confirmar Contraseña</label>
              <input
                className="w-full border rounded p-3 pr-10"
                type={showConfirm ? "text" : "password"}
                placeholder={isReadOnly ? "" : "Repetí la contraseña"}
                value={isReadOnly ? "••••••••" : confirm}
                onChange={(e)=>!isReadOnly && setConfirm(e.target.value)}
                readOnly={isReadOnly}
              />
              <button
                type="button"
                onClick={()=>setShowConfirm(v=>!v)}
                className="absolute right-3 py-4"
                tabIndex={-1}
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
                className={`mb-6 rounded border px-4 w-full py-3 text-sm${
                    msg.type === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-green-300 bg-green-50 text-green-800"
                }`}
                >
                {msg.text}
                </div>
            </div>
            )}

          {/* acciones centradas */}
          <div className="flex gap-6 justify-center mt-10">
            <button onClick={()=>router.back()} className="border text-[#0040B8] hover:bg-[#0040B8] duration-150 hover:text-white border-[#0040B8] px-5 py-3 rounded">Volver</button>
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
