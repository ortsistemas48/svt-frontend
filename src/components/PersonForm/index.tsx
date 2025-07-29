import DriverForm from "@/components/DriverForm";
import OwnerForm from "@/components/OwnerForm";

export default function PersonForm() {

    return <div className="grid grid-cols-[1fr_1px_1fr] gap-8 mb-4 items-start">
                {/* Datos del titular */}
                <div>
                    <DriverForm />
                </div>

                {/* Línea divisoria */}
                <div className="bg-[#dedede] h-full w-px" />

                {/* Datos del conductor */}
                <div>
                    <OwnerForm />
                </div>
            </div>

}