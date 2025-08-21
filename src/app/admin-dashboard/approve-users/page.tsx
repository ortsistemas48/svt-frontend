import UserTable from "@/components/ApproveUserTable";
import { fetchAdminPendingUserData } from "@/utils";
import { ChevronRight } from "lucide-react";

export default async function UsersPage() {
  const usersInWorkshop = await fetchAdminPendingUserData();
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
          Aprobar nuevos titulares
        </h2>
        <p className=" text-gray-500 text-center">
          Aqui podrás aprobar a los titulares registrados en el sistema.
        </p>

      </div>
        <UserTable users={users}/>
    </div>
  );
}