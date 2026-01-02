"use client";
import { useState } from "react";
import { genPassword } from "../../utils";
import { EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Spinner from "@/components/Spinner";

export default function RegisterOwnerForm() {
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
      const res = await fetch(`/api/auth/owner/register`, {
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-[14px] border border-gray-200 shadow-sm px-4 py-6 sm:px-6 sm:py-10">
        <div className="space-y-5">
          <Image
            src="/images/logo.svg"
            alt="Logo Track Detail"
            width={140}
            height={28}
            className="mx-auto"
          />

          <h1 className="text-center text-base text-black font-medium">¡Crea tu cuenta en CheckRTO!</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-6 sm:mt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@dominio.com"
              className="w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="dni">DNI</label>
            <input
              id="dni"
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 12345678"
              className="w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="first_name">Nombre/s</label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej: Juan Diego"
              className="w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="last_name">Apellido/s</label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej: Martin"
              className="w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  className="w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 pr-10 text-sm 
                  focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                  type={showPass ? "text" : "password"}
                  placeholder={"Ingresá una contraseña"}
                  value={password}
                  onChange={(e)=> setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={()=> setShowPass(v=>!v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4"
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPass ? <EyeOff stroke="#0040B8" size={20} /> : <Eye stroke="#0040B8" size={20} />}
                </button>
              </div>
              
              <button 
                type="button" 
                onClick={handleGeneratePassword} 
                className="text-xs sm:text-sm text-[#0040B8] hover:text-[#0035A0] mt-2 transition-colors duration-200"
              >
                Generar automáticamente
              </button>
            </div>

          <div className="relative md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
            <div className="relative">
              <input
                className="w-full border border-[#DEDEDE] rounded-[14px] px-5 py-3 pr-10 text-sm 
                focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                type={showPass ? "text" : "password"}
                placeholder={"Repetí la contraseña"}
                value={confirmPassword}
                onChange={(e)=> setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={()=> setShowPass(v=>!v)}
                className="absolute inset-y-0 right-0 flex items-center pr-4"
                tabIndex={-1}
                aria-label={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPass ? <EyeOff stroke="#0040B8" size={20} /> : <Eye stroke="#0040B8" size={20} />}
              </button>
            </div>
          </div>
          
          
          {msg && (
            <div className="flex justify-center mt-4 md:col-span-2">
                <div
                className={`rounded-[4px] border px-4 w-full py-3 text-center text-sm sm:text-base ${
                    msg.type === "error" 
                      ? "border-red-300 bg-red-50 text-red-800" 
                      : "border-green-300 bg-green-50 text-green-800"
                }`}
                >
                {msg.text}
                </div>
            </div>
            )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`mt-4 w-full bg-[#0040B8] text-white text-sm font-regular rounded-[14px] py-3 transition ${
                loading ? "cursor-not-allowed opacity-50" : "hover:bg-[#0038a6]"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner />
                  Creando cuenta...
                </div>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <Link 
            href="/login" 
            className="text-sm sm:text-base hover:underline transition-colors duration-200"
          >
            <span className="text-gray-600">¿Ya tienes cuenta?</span> <span className="text-[#0040B8] underline">Ingresa</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
