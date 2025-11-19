"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ArrowRight } from "lucide-react";

type SupportTicket = {
  id: number;
  workshop_id: number;
  created_by_user_id: string;
  full_name: string | null;
  phone: string | null;
  subject: string;
  description: string;
  status: string;
  created_at?: string | null;
};

export default function AdminResolvedTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tickets/admin?status=resolved`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { tickets: SupportTicket[] };
        setTickets(data.tickets || []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="py-10 max-w-5xl mx-auto">
      <div className="bg-white rounded-[10px] border border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-md font-semibold text-gray-800">Tickets resueltos</div>
            <div className="text-sm text-gray-500">Todos los tickets resueltos aparecerán aquí</div>
          </div>
          <button
            onClick={() => router.push("/admin-dashboard/support")}
            className="inline-flex items-center gap-2 rounded-[4px] border border-[#0040B8] text-[#0040B8] text-sm font-medium px-4 py-3 hover:bg-[#0040B8]/5"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && (
          <div className="bg-white rounded-[10px] border border-gray-200 px-6 py-4 text-sm text-gray-500">Cargando...</div>
        )}
        {!loading && tickets.length === 0 && (
          <div className="bg-white rounded-[10px] border border-gray-200 px-6 py-4 text-sm text-gray-500">
            No hay tickets resueltos.
          </div>
        )}

        {!loading &&
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin-dashboard/support/${t.id}`)}
              className="hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer bg-white rounded-[10px] border border-gray-200 px-6 py-4 flex items-center justify-between gap-4 relative"
            >
              <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/images/icons/msgIcon.svg" alt="Ticket" className="w-10 h-10" />
              </div>
              <div className="min-w-0 w-[40%] flex flex-col gap-1 pl-1">
                <div className="text-sm text-gray-500 leading-none mb-1">Asunto:</div>
                <div className="text-sm text-gray-900 font-medium truncate">{t.subject}</div>
              </div>
              <div className="flex flex-col items-center text-center gap-1 mx-2">
                <div className="text-sm text-gray-500 leading-none">Fecha de creación</div>
                <div className="text-sm text-gray-800">
                  {t.created_at ? new Date(t.created_at).toLocaleString() : "-"}
                </div>
              </div>
              <button
                title="Ver"
                onClick={(e) => { e.stopPropagation(); router.push(`/admin-dashboard/support/${t.id}`); }}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

