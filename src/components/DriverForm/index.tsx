// components/DriverForm.tsx
import FormTemplate from "../FormTemplate";
import type { ExistingDoc } from "../Dropzone";

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
      { value: "Córdoba", label: "Córdoba" },
      { value: "Buenos Aires", label: "Buenos Aires" },
      { value: "Santa Fe", label: "Santa Fe" },
    ],
    name: "province"
  },
  {
    label: "Localidad",
    options: [
      { value: "Córdoba Capital", label: "Córdoba Capital" },
      { value: "Villa Carlos Paz", label: "Villa Carlos Paz" },
    ],
    name: "city"
  },
];

type Props = {
  data: any;
  applicationId: number;
  setData: (value: any) => void;
  onPendingDocsChange?:(files:File[])=>void;
  existingDocuments?: ExistingDoc[];
  onDeleteExisting?: (docId:number)=>Promise<void> | void;
};

export default function DriverForm({
  data, applicationId, setData, onPendingDocsChange, existingDocuments = [], onDeleteExisting
}: any) {
  return (
    <FormTemplate
      formData={formData}
      applicationId={applicationId}
      title="Datos del Conductor"
      description="Ingrese los datos del conductor"
      data={data}
      setData={setData}
      onDeleteExisting={onDeleteExisting}   
      showDropzone={true}                          
      onPendingDocsChange={onPendingDocsChange}    
      existingDocuments={existingDocuments}
    />
  );
}
