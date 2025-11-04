import { X } from "lucide-react";


interface TableFiltersProps {
    tableFilters: string[];
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    setShowFilters: (show: boolean) => void;
    setPage: (page: number) => void;
}

export default function TableFilters({ tableFilters, statusFilter, setStatusFilter, setShowFilters, setPage }: TableFiltersProps) {
    return (
        <div className="mb-4 relative">
          <div className="absolute top-0 left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Filtros</h3>
              <button
                onClick={() => {
                  setShowFilters(false);
                  setPage(1);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setShowFilters(false);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                >
                  {tableFilters.map((filter) => (
                    <option key={filter} value={filter}>{filter}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
    );
}