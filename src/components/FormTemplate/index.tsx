import Dropzone from "../Dropzone"
import PersonFormField from "../PersonFormField";
import FormField from "../PersonFormField"

export interface FormFieldOption {
    value: string;
    label: string;
}

export interface FormFieldData {
    label: string;
    placeholder?: string;
    type?: string;
    options?: FormFieldOption[];
    name?: any; // Optional, used for form submission
}

export interface FormTemplateProps {
    formData: FormFieldData[];
    title: string;
    description: string;
    isOwner?: boolean; // Optional prop to indicate if the form is for owner data
}
export default function FormTemplate({ formData, title, description, isOwner }: FormTemplateProps) {
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
                            name={field.name} // Use the name for form submission
                            isOwner={isOwner} // Pass isOwner prop if needed
                        />
                    ) : (
                        <PersonFormField
                            key={index}
                            label={field.label}
                            placeholder={field.placeholder ?? ""}
                            type={field.type ?? "text"}
                            name={field.name} // Use the name for form submission
                            isOwner={isOwner} // Pass isOwner prop if needed
                        />
                    )
                )}
            </div>
            <Dropzone />
        </div>
    )

}