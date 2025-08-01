import Dropzone from "@/components/Dropzone";
import FormField from "@/components/PersonFormField";

// id: number;
//   first_name: string;
//   last_name: string;
//   dni: string;
//   phone_number: string;
//   email: string;
//   province: string;
//   city: string;
//   is_owner: boolean;
//   street: string;
//   street_number: string;

const formData = [
    { label: "Nombre", placeholder: "Ej: Ángel Isaías Vaquero", name:  "first_name" },
    { label: "Apellido", placeholder: "Ej: Ángel Isaías Vaquero", name:  "last_name" },

    { label: "DNI", placeholder: "Ej: 39.959.950", name: "dni" },
    { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number" },
    { label: "Email", type: "email", placeholder: "Ej: ejemplo@gmail.com", name: "email" },
    { label: "Calle", placeholder: "Ej: Avenida Colón", name: "street" },
    { label: "Número", placeholder: "Ej: 1450", name: "street_number" },
    {
        label: "Provincia",
        options: [
            { value: "cordoba", label: "Córdoba" },
            { value: "buenos-aires", label: "Buenos Aires" },
            { value: "santa-fe", label: "Santa Fe" },
        ],
        name: "province"
    },
    {
        label: "Localidad",
        options: [
            { value: "cordoba-capital", label: "Córdoba Capital" },
            { value: "villa-carlos-paz", label: "Villa Carlos Paz" },
        ],
        name: "city"
    },
]
import FormTemplate from "../FormTemplate";
export default function OwnerForm() {
    return (
        <FormTemplate
            formData={formData}
            title="Datos del Titular"
            description='Ingrese los datos del titular de auto'
            isOwner={true}
        />
    )
}