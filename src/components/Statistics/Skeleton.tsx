export default function StatisticsSkeleton() {
  return (
    <div className="bg-white animate-pulse">
      <div className="max-w-8xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">
        {/* Breadcrumb + date picker */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1 sm:px-0">
          <div className="h-5 w-48 bg-gray-200 rounded" />
          <div className="h-9 w-48 bg-gray-200 rounded-lg" />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="h-7 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-36 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="h-5 w-44 bg-gray-200 rounded" />
              </div>
              <div className="p-4 sm:p-5">
                <div className="h-[200px] bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: brands, usage, errors, expirations */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-1 sm:px-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="h-5 w-40 bg-gray-200 rounded" />
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-8 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
