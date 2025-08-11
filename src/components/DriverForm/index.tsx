import FormTemplate from "../FormTemplate";

const formData = [
    { label: "DNI", placeholder: "Ej: 39.959.950", name: "dni" },
    { label: "Email", type: "email", placeholder: "Ej: ejemplo@gmail.com", name: "email" },
    { label: "Nombre", placeholder: "Ej: Ángel", name: "first_name" },
    { label: "Apellido", placeholder: "Ej: Vaquero", name: "last_name" },
    { label: "Teléfono", placeholder: "Ej: 3516909988", name: "phone_number" },
    { label: "Domicilio", placeholder: "Ej: Avenida Colón 3131", name: "street" },
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
type Props = {
  data: any;
  setData: (value: any) => void;
};

export default function DriverForm({ data, setData }: Props) {
    return (
        <FormTemplate
            formData={formData}
            title="Datos del Conductor"
            description='Ingrese los datos del titular de auto'
            data={data}
            setData={setData}
        />
    )
}