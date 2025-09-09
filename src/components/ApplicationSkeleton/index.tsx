import Skeleton from "../Skeleton";

export function ApplicationSkeleton() {
    return (
      <div className="p-6">

        <div className="grid grid-cols-2 gap-6">
          {/* Datos del Titular */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-14 w-full" /> 
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" /> 
            <Skeleton className="h-14 w-full" /> 
            <Skeleton className="h-14 w-full" /> 
            <Skeleton className="h-14 w-full" /> 
            <div className="flex gap-2">
              <Skeleton className="h-[200px] w-full" /> 
            </div>
          </div>
    
          {/* Datos del Conductor */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" /> 
            <Skeleton className="h-14 w-full" /> 
            <Skeleton className="h-14 w-full" /> 
            <div className="flex gap-2">
              <Skeleton className="h-[200px] w-full" /> 
            </div>
          </div>
        </div>
      </div>
    );
  }