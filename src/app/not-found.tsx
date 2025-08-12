'use client';
import { ChevronLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
export default function NotFoundPage() {
  const router = useRouter();
  const handleGoBack = () => {
    router.back();
  };
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">404 - Página no encontrada</h1>
        <p className="mt-4 text-gray-600">Lo sentimos, la página que buscas no existe.</p>
        <button className="mt-5 inline-block border-2 bg-black text-white px-4 py-2 rounded-xl" onClick={handleGoBack}>
          <ChevronLeft className="inline mr-2" />
          Volver
        </button>
      </div>
    </div>
  );
}