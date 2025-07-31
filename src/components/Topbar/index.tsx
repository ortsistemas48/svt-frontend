'use client'

// components/Topbar.tsx
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react"
import HamburgerMenu from "../HamburgerMenu";
import { useUser } from "@/context/UserContext";

export default function Topbar() {
  const user = useUser();
  console.log(user)
  return (
    <header className="h-16 px-6 max-md:px-4 flex items-center justify-between bg-white border-b border-gray-200">
      {/* Logo a la izquierda */}
      <div className="flex items-center">
        <HamburgerMenu />
        <Link href="/dashboard">
          <Image src="/images/logo.png" alt="Logo" width={150} height={50} className="p-2"/>
        </Link>
      </div>
      
      {/* Usuario a la derecha */}
      <div className="flex items-center gap-2">
        <User className="text-gray-500" size={30} />
        {/* <Image src="/user-avatar.png" alt="Avatar" width={32} height={32} className="rounded-full" /> */}
        <span className="text-sm font-medium text-gray-700 max-md:hidden">{user?.first_name} {user?.last_name}</span>
      </div>
    </header>
  );
}
