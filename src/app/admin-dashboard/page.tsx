import UserTable from "@/components/AdminUserTable";
import { fetchAdminUserData } from "@/utils";
import { ChevronRight } from "lucide-react";

export default async function UsersPage() {
  const usersInWorkshop = await fetchAdminUserData();
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
          Usuarios del sistema
        </h2>
        <p className=" text-gray-500 text-center">
          Aqui podrás ver y gestionar los usuarios existentes en el sistema.
        </p>

      </div>
        <UserTable users={users}/>
    </div>
  );
}