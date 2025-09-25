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
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Usuarios</span>
          </div>
        </article>

        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Crea o añade tus usuarios
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8">
            Aquí podrás crear o asociar usuarios existentes a tu taller.
          </p>
          <SearchEmailBar workshopId={workshopId} />
        </div>

        {/* User Table */}
        <div className="overflow-hidden">
          <UserTable users={users}/>
        </div>
      </div>
    </div>
  );
}