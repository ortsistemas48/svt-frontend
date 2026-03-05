export default function DashboardSkeleton() {
  return (
    <div className="bg-white animate-pulse">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="h-5 w-20 bg-gray-200 rounded mb-6" />

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="p-5 h-[104px] flex flex-col items-center justify-center gap-3">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200 hidden sm:block" />
                  <div className="h-4 w-36 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-56 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
