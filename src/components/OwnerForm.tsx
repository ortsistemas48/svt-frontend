import Dropzone from "./Dropzone";
import FormField from "./FormField";

export default function OwnerForm() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Datos del Propietario</h2>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Nombre completo"
                        placeholder="Ej: Ángel Isaías Vaquero"
                    />
                    <FormField
                        label="DNI"
                        placeholder="Ej: 39.959.950"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Teléfono"
                        placeholder="Ej: 3516909988"
                    />
                    <FormField
                        label="Email"
                        type="email"
                        placeholder="Ej: ejemplo@gmail.com"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Calle"
                        placeholder="Ej: Avenida Colón"
                    />
                    <FormField
                        label="Número"
                        placeholder="Ej: 8899"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Provincia"
                        options={[
                            { value: "cordoba", label: "Córdoba" },
                            { value: "buenos-aires", label: "Buenos Aires" },
                            { value: "santa-fe", label: "Santa Fe" },
                        ]}
                    />
                    <FormField
                        label="Localidad"
                        options={[
                            { value: "cordoba-capital", label: "Córdoba Capital" },
                            { value: "villa-carlos-paz", label: "Villa Carlos Paz" },
                        ]}
                    />
                </div>
            </div>
            <Dropzone />
        </div>
    )
}