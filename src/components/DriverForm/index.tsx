import Dropzone from "@/components/Dropzone";
import FormField from "@/components/FormField";
const formData = [
    { label: "Nombre completo", placeholder: "Ej: Ángel Isaías Vaquero" },
    { label: "DNI", placeholder: "Ej: 39.959.950" },
    { label: "Teléfono", placeholder: "Ej: 3516909988" },
    { label: "Email", type: "email", placeholder: "Ej: ejemplo@gmail.com" },
    { label: "Calle", placeholder: "Ej: Avenida Colón" },
    { label: "Número", placeholder: "Ej: 1450" },
    {
        label: "Provincia",
        options: [
            { value: "cordoba", label: "Córdoba" },
            { value: "buenos-aires", label: "Buenos Aires" },
            { value: "santa-fe", label: "Santa Fe" },
        ],
    },
    {
        label: "Localidad",
        options: [
            { value: "cordoba-capital", label: "Córdoba Capital" },
            { value: "villa-carlos-paz", label: "Villa Carlos Paz" },
        ],
    },
]
import FormTemplate from "../FormTemplate";
export default function DriverForm() {
    return (
        <FormTemplate
            formData={formData}
            title="Datos del Conductor"
            description='Ingrese los datos del titular de auto'
        />
    )
}