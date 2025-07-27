// components/Topbar.tsx
import Image from "next/image";

export default function Topbar() {
  return (
    <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-gray-200">
      {/* Logo a la izquierda */}
      <div className="flex items-center gap-2">
        <Image src="/images/logo.png" alt="Logo" width={150} height={50} className="p-2"/>
      </div>

      {/* Usuario a la derecha */}
      <div className="flex items-center gap-2">
        <Image src="/user-avatar.png" alt="Avatar" width={32} height={32} className="rounded-full" />
        <span className="text-sm font-medium text-gray-700">Jorge Lopez</span>
      </div>
    </header>
  );
}
