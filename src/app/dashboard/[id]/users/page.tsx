import SearchEmailBar from "@/components/SearchEmailBar";
import UserTable from "@/components/UserTable";
import { fetchUserData } from "@/utils";
import { ChevronRight } from "lucide-react";

export default async function UsersPage( { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workshopId = Number(id);
  const usersInWorkshop = await fetchUserData({ workshopId });
  const { users } = usersInWorkshop;
  return (
    <div className="">
      <div className="max-w-8xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
        {/* Breadcrumb */}
        <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-3 md:mb-4 lg:mb-6 px-1 sm:px-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Usuarios</span>
          </div>
        </article>

        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-4 md:mb-6 lg:mb-8 px-1 sm:px-0">
          <h2 className="text-xl sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-[#0040B8] mb-2 sm:mb-2 md:mb-3">
            Crea o añade tus usuarios
          </h2>
          <p className="text-sm sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-4 md:mb-6 lg:mb-8">
            Aquí podrás crear o asociar usuarios existentes a tu taller.
          </p>
          <div className="px-1 sm:px-0">
            <SearchEmailBar workshopId={workshopId} />
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-hidden">
          <UserTable users={users}/>
        </div>
      </div>
    </div>
  );
}