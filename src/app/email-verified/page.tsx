// app/email-verified/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EmailVerifiedClient from "@/components/EmailVerifiedClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function EmailVerifiedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] grid place-items-center bg-white px-4">
          <div className="w-full max-w-md bg-white rounded-[14px] border border-[#DEDEDE] px-4 py-10 text-center">
            <Loader2 className="mx-auto animate-spin" />
            <p className="mt-3 text-sm text-gray-600">Cargando</p>
          </div>
        </main>
      }
    >
      <EmailVerifiedClient />
    </Suspense>
  );
}
