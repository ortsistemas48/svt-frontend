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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function buildURL(path: string, query?: Record<string, any>) {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function fetchAdminOrders(params: {
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiList> {
  const cookie = headers().get("cookie") || "";
  const url = buildURL("/payments_admin/orders", params);
  const res = await fetch(url, {
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
// @ts-expect-error next type bug with searchParams
export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Record<string, unknown>;
}) {
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
