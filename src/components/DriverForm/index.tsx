import Dropzone from "@/components/Dropzone";
import FormField from "@/components/FormField";
export default function DriverForm() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Datos del Conductor</h2>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label="Nombre Completo"
                        placeholder="Ej: Ángel Isaías Vaquero"
                    />
                    <FormField
                        label="DNI"
                        placeholder="Ej: 39.959.950"
                    />
                    
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField 
                        label="Telefono"
                        placeholder="Ej: 3516909988"

                    />
                    <FormField 
                        label="Email"
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
                        placeholder="Ej: 1500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField 
                        label="Provincia"
                        options={[
                            { value: "cordoba", label: "Córdoba" },
                            { value: "buenos-aires", label: "Buenos Aires" },
                            { value: "santa-fe", label: "Santa Fe" }
                        ]}
                    />
                   <FormField
                        label="Localidad"
                        options={[
                            { value: "cordoba-capital", label: "Córdoba Capital" },
                            { value: "villa-carlos-paz", label: "Villa Carlos Paz" },
                            { value: "rio-cuarto", label: "Río Cuarto" }
                        ]}
                   />
                </div>
            </div>
            <Dropzone />
        </div>

    )
}