// components/FormTemplate.tsx
import Dropzone from "../Dropzone";
import PersonFormField from "../PersonFormField";
import type { ExistingDoc } from "../Dropzone";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldData {
  label: string;
  placeholder?: string;
  type?: string;
  options?: FormFieldOption[];
  name: string;
}

export interface FormTemplateProps {
  formData: FormFieldData[];
  title: string;
  description: string;
  applicationId: number;
  data: any;
  setData: (value: any) => void;
  isOwner?: boolean;

  onDeleteExisting?: (docId: number) => Promise<void> | void;
  showDropzone?: boolean;
  onPendingDocsChange?: (files: File[]) => void;
  existingDocuments?: ExistingDoc[];
}

export default function FormTemplate({
  formData,
  title,
  description,
  data,
  setData,
  isOwner,
  showDropzone = true,
  onPendingDocsChange,
  existingDocuments = [],
  onDeleteExisting
}: FormTemplateProps) {
  const handleChange = (name: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-regular text-[#000000] mb-1">{title}</h2>
        <p className="text-md font-regular text-[#00000080] mb-10">{description}</p>
      </div>

      <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-y-8 gap-x-6">
        {formData.map((field, index) =>
          field.options ? (
            <PersonFormField
              key={index}
              label={field.label}
              type="select"
              options={field.options}
              name={field.name}
              isOwner={isOwner}
              value={data?.[field.name] || ""}
              onChange={(val: string) => handleChange(field.name, val)}
            />
          ) : (
            <PersonFormField
              key={index}
              label={field.label}
              placeholder={field.placeholder ?? ""}
              type={field.type ?? "text"}
              name={field.name}
              isOwner={isOwner}
              value={data?.[field.name] || ""}
              onChange={(val: string) => handleChange(field.name, val)}
            />
          )
        )}
      </div>

      {showDropzone && (
        <div className="pt-4">
          <Dropzone
            onPendingChange={onPendingDocsChange}
            existing={existingDocuments}
            onDeleteExisting={onDeleteExisting}
          />
        </div>
      )}
    </div>
  );
}
