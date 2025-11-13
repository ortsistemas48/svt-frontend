// app/admin-dashboard/payments/page.tsx
import PaymentApprovalTable from "@/components/AdminPaymentsTable";
import { headers } from "next/headers";
import { ChevronRight } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type PaymentOrder = {
  id: number;
  workshop_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
  zone: "SUR" | "CENTRO" | "NORTE" | string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  created_at?: string;
  updated_at?: string;
  receipt_url?: string | null;
  receipt_mime?: string | null;
  receipt_size?: number | null;
  receipt_uploaded_at?: string | null;
  document_count?: number;
};

type ApiList = {
  items: PaymentOrder[];
  page: number;
  page_size: number;
  total: number;
};

async function getBaseURL() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) throw new Error("No host header");
  const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

function buildURL(path: string, query?: Record<string, any>) {
  const url = new URL(`/api${path}`, 'http://localhost'); // Base only for URL constructor
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  // Return only the path + search params, not the full URL
  return url.pathname + url.search;
}

async function fetchAdminOrders(params: {
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiList> {
  const h = await headers();
  const cookie = h.get("cookie") || "";
  const baseURL = await getBaseURL();
  const path = buildURL("/payments_admin/orders", params);
  const res = await fetch(`${baseURL}${path}`, {
    method: "GET",
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "No se pudieron cargar las órdenes");
  }
  return res.json();
}
// @ts-ignore - Next.js searchParams typing bug
export default async function AdminPaymentsPage({ searchParams }: any) {
  const q = searchParams?.q as string | undefined;
  const status = searchParams?.status as
    | "PENDING"
    | "IN_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | undefined;
  const page = searchParams?.page ? Number(searchParams.page) : 1;
  const page_size = searchParams?.page_size ? Number(searchParams.page_size) : 50;

  const data = await fetchAdminOrders({ q, status, page, page_size });

  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Talleres</span>
        </div>
      </article>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-3xl text-[#0040B8]">Aprobar pagos de revisiones</h2>
        <p className="text-gray-500 text-center">
          Aqui podrás aprobar los pagos de revisiones del sistema.
        </p>
      </div>

      <PaymentApprovalTable orders={data.items} />
    </div>
  );
}
