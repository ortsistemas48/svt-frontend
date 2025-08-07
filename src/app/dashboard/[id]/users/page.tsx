import UserInput from "@/components/UserInput";
import UserTable from "@/components/UserTable";
import { fetchUserData } from "@/app/utils";
import { ChevronRight, Search, ArrowRight } from "lucide-react";

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
        <h2 className="text-3xl font-semibold text-[#0040B8]">
          Crea o añade tus usuarios
        </h2>

        {/* Subtítulo */}
        <p className=" text-gray-500 text-center">
          Aqui podras crear o asociar usuarios existentes a tu taller.
        </p>

        {/* Input + Botón */}
        <div className="grid grid-cols-[500px_50px] gap-x-3 mt-6">
          {/* Input con icono */}
          <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-12">
            <Search size={20} className="text-gray-500 mr-1" />
            <input
              type="email"
              placeholder="Ingrese el mail del usuario para crear la cuenta"
              className="flex-1 text-sm focus:outline-none"
            />
          </div>

          {/* Botón */}
          <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 py-2 rounded flex items-center justify-center">
            <ArrowRight size={30} strokeWidth={3} className="p-1" />
          </button>
        </div>


      </div>
      {/* <div className="flex flex-col items-center gap-2 mt-6">
        <UserInput />
      </div> */}
        <UserTable users={users}/>
    </div>
  );
}