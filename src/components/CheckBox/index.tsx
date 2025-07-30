
type CheckBoxProps = {
    label: string;
    checked: boolean;
    onChange : (checked: boolean) => void;
    className?: string;
};

export default function CheckBox({ label, onChange, checked, className = "" }: CheckBoxProps) {
    return (
        <>
            <div className={`flex ${className}`}>
                <input id="default-checkbox" onChange={(e) => onChange?.(e.target.checked)} type="checkbox" defaultChecked={checked} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                <label htmlFor="default-checkbox" className="ms-2 text-sm font-medium text-black">{label}</label>
            </div>
            
        </>
    )
}