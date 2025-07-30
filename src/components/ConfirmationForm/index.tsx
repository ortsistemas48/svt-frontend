
export default function ConfirmationForm() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Confirmación de Datos</h2>
            </div>

            <div className="space-y-4">
                <p className="text-gray-700">Por favor, revise los datos ingresados antes de continuar.</p>
                
                {/* Aquí se pueden agregar componentes para mostrar los datos ingresados */}
                
                <div className="flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}