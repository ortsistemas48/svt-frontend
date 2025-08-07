import { PersonType } from "@/app/types";
import renderDocument from "../DocumentCard";

const tableData = [
    { label: "Nombre", key: "first_name" },
    { label: "Apellido", key: "last_name" },
    { label: "DNI", key: "dni" },
    { label: "Teléfono", key: "phone_number" },
    { label: "Email", key: "email" },
    { label: "Provincia", key: "province" },
    { label: "Localidad", key: "city" },
];
const renderPerson = (person: PersonType) => {
    return (
        <div className="space-y-4 py-4">
            {/* Person fields */}
            <div className="grid grid-cols-2 gap-6">

            {tableData.map((item) => (
                <div className="" key={item.key}>
                    <strong className="font-medium opacity-50">{item.label}:</strong>
                    <p className={item.key === "province" || item.key === "city" ? "capitalize" : ""}>
                    {item.key === "full_name"
                        ? (person.first_name && person.last_name
                            ? `${person.first_name} ${person.last_name}`
                            : "No disponible")
                            : person[item.key as keyof PersonType] || "No disponible"}
                    </p>
                </div>
            ))}
            </div>
            
            <p className="font-light opacity-40">Documentos</p>
            <div className="flex flex-col">
                <div className="space-y-3">
                    {renderDocument("DNI frente.pdf")}
                    {renderDocument("DNI dorso.pdf")}
                    {renderDocument("Cédula frente.pdf")}
                </div>
                <button className="text-blue-500 text-center text-sm mt-4 hover:underline border rounded border-gray-300 p-2">
                    (+1) Ver más archivos
                </button>
            </div>
        </div>
    );
};

export default renderPerson;