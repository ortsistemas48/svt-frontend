'use client'

import Image from "next/image";
import Link from "next/link";
import HamburgerMenu from "../HamburgerMenu";
import UserProfile from "../UserProfile";

export default function Topbar() {
  return (
    <header className="h-16 px-6 max-md:px-4 flex items-center justify-between bg-white border-b border-gray-200">
      {/* Logo a la izquierda */}
      <div className="flex items-center">
        <HamburgerMenu />
        <Link href="/">
          <Image src="/images/logo.png" alt="Logo" width={150} height={50} className="p-2" />
        </Link>
      </div>

      {/* Usuario a la derecha */}
      <UserProfile />
    </header>
  );
}
