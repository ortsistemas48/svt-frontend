import { Plus, RefreshCw, CircleFadingPlus} from "lucide-react";

const options = [
    {
        key: "new",
        icon: <CircleFadingPlus size={42} strokeWidth={2.5} className="text-[#0040B8]" />,
        title: "Nueva Revisión",
        description: "Iniciar una nueva revisión técnica desde cero"
    },
    {
        key: "continue",
        icon: <RefreshCw size={42} strokeWidth={2.5} className="text-[#0040B8]" />,
        title: "Continuar Revisión",
        description: "Continuar con una revisión existente"
    }
];
export default function SelectApplicationType() {
    return (
        <div className="space-y-4 my-10">
            <div>
                <h3 className="text-lg font-medium text-gray-900">
                    Seleccione el tipo de revisión
                </h3>
                <p className="text-sm text-gray-500">
                    Elija si desea iniciar una nueva revisión o continuar con una existente.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map((option) => {
                    return (
                        <button
                            key={option.key}
                            className="flex flex-col items-center justify-center border rounded-lg p-6 transition-all duration-200 focus:outline-noneborder-gray-300 hover:border-[#0040B8] hover:shadow-lg"
                        >
                            <div className="mb-3">{option.icon}</div>
                            <h4 className="text-md font-medium text-gray-900">{option.title}</h4>
                            <p className="text-sm text-gray-500 text-center">
                                {option.description}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    )
}  