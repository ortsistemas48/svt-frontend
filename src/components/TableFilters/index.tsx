import { X, ChevronDown } from "lucide-react";


interface TableFiltersProps {
    tableFilters: readonly string[];
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    setShowFilters: (show: boolean) => void;
    setPage: (page: number) => void;
    dateFilter?: string;
    setDateFilter?: (date: string) => void;
}

export default function TableFilters({ tableFilters, statusFilter, setStatusFilter, setShowFilters, setPage, dateFilter, setDateFilter }: TableFiltersProps) {
    return (
        <div className="absolute top-full -left-20 mt-2 z-10">
          <div className="bg-white border border-gray-200 rounded-[14px] shadow-lg p-5 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Filtros por estado</h3>
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
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setShowFilters(false);
                    }}
                    className="w-full appearance-none rounded-[4px] border border-gray-300 px-3 py-2 pr-10 text-sm bg-white focus:border-[#0040B8] focus:outline-none focus:ring-2 focus:ring-[#0040B8] cursor-pointer"
                  >
                    {tableFilters.map((filter) => (
                      <option key={filter} value={filter}>{filter}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>
              {dateFilter !== undefined && setDateFilter && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-[4px] border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#0040B8] focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
    );
}