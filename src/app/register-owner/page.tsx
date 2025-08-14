"use client";
import { useState } from "react";
import { genPassword } from "../utils";
import { EyeOff, Eye } from "lucide-react";

export default function RegisterOwnerFormB() {
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{type: "success"|"error", text: string} | null>(null);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (password !== confirmPassword) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }

    // 👉 aquí más adelante vas a manejar el registro (API call, etc.)
    console.log({
      email,
      dni,
      firstName,
      lastName,
      password,
    });
  };
  const handleGeneratePassword = () => {
    const generatedPassword = genPassword()
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
  }
  return (
    <main className="min-h-full grid place-items-center bg-white">
      <div className="w-full max-w-2xl bg-white rounded-[10px] border border-[#DEDEDE] px-6 py-10">
        <h1 className="text-lg text-black font-medium text-center mb-8">
          Registro de Titulares de Taller
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm text-gray-700 mb-1" htmlFor="first_name">Nombres</label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-[#DEDEDE] rounded-[10px] px-4 py-3 text-sm 
              focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="last_name">Apellidos</label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Tu apellido"
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
                placeholder={"Ingresá una contraseña segura"}
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
                className={`mb-6 rounded border px-4 w-full py-3 text-center text-sm ${
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
              className="mt-2 w-full bg-[#0040B8] text-white text-lg font-semibold rounded-[4px] py-3.5 
              hover:bg-[#0038a6] transition"
            >
              Crear cuenta
            </button>
          </div>
        </form>
        
      </div>
    </main>
  );
}
