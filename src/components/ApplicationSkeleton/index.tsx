import Skeleton from "../Skeleton";

export function ApplicationSkeleton() {
    return (
      <div className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Datos del Titular */}
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <Skeleton className="h-12 sm:h-14 w-full" />
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <div className="flex gap-2">
              <Skeleton className="h-[150px] sm:h-[200px] w-full" /> 
            </div>
          </div>
    
          {/* Datos del Conductor */}
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
            <Skeleton className="h-12 sm:h-14 w-full" />
            <Skeleton className="h-12 sm:h-14 w-full" />
            <Skeleton className="h-12 sm:h-14 w-full" />
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <Skeleton className="h-12 sm:h-14 w-full" /> 
            <div className="flex gap-2">
              <Skeleton className="h-[150px] sm:h-[200px] w-full" /> 
            </div>
          </div>
        </div>
      </div>
    );
  }