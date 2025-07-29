'use client';


export default function DropzoneComponent({
}) {

  return (
    <div className="mb-4">
      <div
        className="border-dashed border-2 border-[#D3D3D3] rounded-xl text-center mt-1"
      >
        <input />
        <div className="flex justify-center mb-2 mt-10">
          <img src="/images/icons/DropzoneIcon.svg" alt="" className="mr-3 ml-2" />
        </div>
        <button
          type="button"
          className="mt-4 mb-2 px-4 py-2 bg-[#fff] text-[#00A8BA] border border-[#00A8BA] rounded-md text-sm duration-150 hover:bg-[#00A8BA] hover:text-[#fff]">
          Sube tus fotos
        </button>
        <p className="mb-10 text-[#00000080] text-sm">o arrastralas hasta aquí.</p>
      </div>
    </div>
  )
}