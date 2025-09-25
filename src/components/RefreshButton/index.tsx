import { RefreshCcw } from "lucide-react";

export default function RefreshButton({ loading, fetchApps }: { loading: boolean, fetchApps: () => void }) {
    return (
        <button
          disabled={loading}
          onClick={fetchApps}
          className="flex items-center justify-center gap-2 rounded-md border border-[#0040B8] px-3 py-2 text-sm font-medium text-[#0040B8] transition-colors duration-200 hover:bg-[#0040B8] hover:text-white disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          <span className="sm:hidden">{loading ? "..." : "↻"}</span>
        </button>
    )
}