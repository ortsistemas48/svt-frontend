import Dropzone from "../Dropzone"
import FormField from "../FormField"

export interface FormFieldOption {
    value: string;
    label: string;
}

export interface FormFieldData {
    label: string;
    placeholder?: string;
    type?: string;
    options?: FormFieldOption[];
}

export interface FormTemplateProps {
    formData: FormFieldData[];
    title: string;
    description: string;
}
export default function FormTemplate({ formData, title, description }: FormTemplateProps) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-regular text-[#000000] mb-1">{title}</h2>
                <p className="text-md font-regular text-[#00000080] mb-10">{description}</p>
            </div>


            <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-y-8 gap-x-6">

                {formData.map((field, index) =>
                    field.options ? (
                        <FormField
                            key={index}
                            label={field.label}
                            type="select"
                            options={field.options}
                        />
                    ) : (
                        <FormField
                            key={index}
                            label={field.label}
                            placeholder={field.placeholder ?? ""}
                            type={field.type ?? "text"}
                        />
                    )
                )}
            </div>
            <Dropzone />
        </div>
    )

}