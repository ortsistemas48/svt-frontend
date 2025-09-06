"use client";
import { useState } from "react";
import { genPassword } from "../../utils";
import { EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Spinner from "@/components/Spinner";

export default function RegisterOwnerFormB() {
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{type: "success"|"error", text: string} | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    setLoading(true); 

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/owner/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName,
          dni,
          phone_number: "",   
          workshop_id: 1,    
          user_type_id: 2  
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Error al registrar" });
        return;
      }
      setMsg({ type: "success", text: "Te hemos enviado un email de verificación." });
    } catch (err) {
      setMsg({ type: "error", text: "Error de red" });
    } finally {
      setLoading(false); 
    }
  };

  const handleGeneratePassword = () => {
    const generatedPassword = genPassword()
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
  }

  return (
    <main className="min-h-full grid place-items-center bg-white">
      <div className="w-full max-w-2xl bg-white rounded-[10px] border border-[#DEDEDE] px-6 py-10">
        <div className="space-y-5">
          <Image
            src="/images/logo.png"
            alt="Logo Track Detail"
            width={170}
            height={170}
            className="mx-auto"
          />

          <h1 className="text-center text-lg text-black font-medium">¡Crea tu cuenta en AutoCheck!</h1>

        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@dominio.com"
              className="w-full border border-[#DEDEDE] rounded-[10px] px-4 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="dni">DNI</label>
            <input
              id="dni"
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 12345678"
              className="w-full border border-[#DEDEDE] rounded-[10px] px-4 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="first_name">Nombre/s</label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej: Juan Diego"
              className="w-full border border-[#DEDEDE] rounded-[10px] px-4 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="last_name">Apellido/s</label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: Martin"
              className="w-full border border-[#DEDEDE] rounded-[10px] px-4 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div className="relative">
              <label className="block text-sm mb-2">Contraseña</label>
              <input
                className="w-full border rounded-[10px] placeholder:text-sm p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                type={showPass ? "text" : "password"}
                placeholder={"Ingresá una contraseña"}
                value={password}
                onChange={(e)=> setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={()=> setShowPass(v=>!v)}
                className="absolute right-3 py-4 "
                tabIndex={-1}
                aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPass ? <EyeOff className="w-5 h-5 text-[#0040B8]" /> : <Eye className="w-5 h-5 text-[#0040B8]" />}
              </button>
              
                <button type="button" onClick={handleGeneratePassword} className="text-xs text-[#0040B8] mt-3">
                  Generar automáticamente
                </button>
            </div>

          <div className="relative">
            <label className="block text-sm mb-2">Confimar Contraseña </label>
              <input
                className="w-full border rounded-[10px] placeholder:text-sm p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                type={showPass ? "text" : "password"}
                placeholder={"Repetí la contraseña"}
                value={confirmPassword}
                onChange={(e)=> setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={()=> setShowPass(v=>!v)}
                className="absolute right-3 py-4"
                tabIndex={-1}
                aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPass ? <EyeOff className="w-5 h-5 text-[#0040B8]" /> : <Eye className="w-5 h-5 text-[#0040B8]" />}
              </button>
          </div>
          
          
          {msg && (
            <div className="flex justify-center mt-2 col-span-2">
                <div
                className={` rounded-[4px] border px-4 w-full py-3 text-center text-sm ${
                    msg.type === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-green-300 bg-green-50 text-green-800"
                }`}
                >
                {msg.text}
                </div>
            </div>
            )}

          <div className="md:col-span-2">
            <button
              type="submit"
              className="mt-2 w-full bg-[#0040B8] text-white text-md rounded-[4px] py-3.5 
              hover:bg-[#0038a6] transition"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>
        </form>
        <Link href="/" className="flex text-sm mt-6 justify-center text-[#0040B8] hover:underline">
          ¿Ya Tienes Cuenta? Ingresa
        </Link>

      </div>
    </main>
  );
}
