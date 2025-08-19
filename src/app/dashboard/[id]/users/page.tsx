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
    <div className="min-w-full">  
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Usuarios</span>
        </div>
      </article>

      <div className="flex flex-col items-center gap-2">
        {/* Título */}
        <h2 className="text-3xl text-[#0040B8]">
          Crea o añade tus usuarios
        </h2>

        {/* Subtítulo */}
        <p className=" text-gray-500 text-center">
          Aqui podras crear o asociar usuarios existentes a tu taller.
        </p>
        <SearchEmailBar workshopId={workshopId} />
      </div>
        <UserTable users={users}/>
    </div>
  );
}