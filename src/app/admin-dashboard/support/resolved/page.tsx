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
    <div className="py-3 sm:py-6 md:py-10 max-w-5xl mx-auto px-1 sm:px-2 md:px-4 lg:px-6">
      <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Tickets resueltos</div>
            <div className="text-xs sm:text-sm text-gray-500">Todos los tickets resueltos aparecerán aquí</div>
          </div>
          <button
            onClick={() => router.push("/admin-dashboard/support")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#0040B8] text-[#0040B8] text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 sm:py-3 hover:bg-[#0040B8]/5"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            Volver
          </button>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
        {loading && (
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">Cargando...</div>
        )}
        {!loading && tickets.length === 0 && (
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
            No hay tickets resueltos.
          </div>
        )}

        {/* Vista desktop */}
        {!loading &&
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin-dashboard/support/${t.id}`)}
              className="hidden md:flex hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-4 md:px-6 py-3 md:py-4 items-center justify-between gap-3 md:gap-4 relative"
            >
              <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/images/icons/msgIcon.svg" alt="Ticket" className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div className="min-w-0 w-[40%] flex flex-col gap-1 pl-1">
                <div className="text-[10px] sm:text-xs text-gray-500 leading-none mb-1">Asunto:</div>
                <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">{t.subject}</div>
              </div>
              <div className="flex flex-col items-center text-center gap-1 mx-2">
                <div className="text-[10px] sm:text-xs text-gray-500 leading-none">Fecha de creación</div>
                <div className="text-xs sm:text-sm text-gray-800">
                  {t.created_at ? new Date(t.created_at).toLocaleString() : "-"}
                </div>
              </div>
              <button
                title="Ver"
                onClick={(e) => { e.stopPropagation(); router.push(`/admin-dashboard/support/${t.id}`); }}
                className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
              >
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          ))}

        {/* Vista mobile/tablet - Cards */}
        {!loading &&
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin-dashboard/support/${t.id}`)}
              className="md:hidden hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3 relative"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img src="/images/icons/msgIcon.svg" alt="Ticket" className="w-8 h-8" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <div className="text-[10px] text-gray-500 leading-none mb-0.5">Asunto:</div>
                    <div className="text-xs sm:text-sm text-gray-900 font-medium break-words">{t.subject}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-gray-500 leading-none mb-0.5">Fecha de creación:</div>
                    <div className="text-xs text-gray-800">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}
                    </div>
                  </div>
                </div>

                <button
                  title="Ver"
                  onClick={(e) => { e.stopPropagation(); router.push(`/admin-dashboard/support/${t.id}`); }}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {t.created_at ? new Date(t.created_at).toLocaleTimeString() : ""}
                </div>
                {t.full_name && (
                  <div className="text-xs text-gray-700 truncate max-w-[60%]">
                    Por: {t.full_name}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

