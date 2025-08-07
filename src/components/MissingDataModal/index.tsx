
export default function MissingDataModal ( {
  missingFields,
  onClose,
}: {
  missingFields: string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-3">No se puede continuar</h2>
        {missingFields.length > 0 ? (
          <div className="text-sm text-red-600 mb-4">
            Faltan campos por completar:
            <ul className="list-disc list-inside mt-2 grid grid-cols-2">
              {missingFields.map((field, i) => (
                <li key={i}>{field}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          onClick={onClose}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

}