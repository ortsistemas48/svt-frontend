// components/PersonForm.tsx
'use client';

import DriverForm from "@/components/DriverForm";
import OwnerForm from "@/components/OwnerForm";
import CheckBox from "../CheckBox";
import type { ExistingDoc } from "../Dropzone";

type Props = {
  owner:any; setOwner:(v:any)=>void;
  driver:any; setDriver:(v:any)=>void;
  applicationId:number|string;
  isSamePerson:boolean; setIsSamePerson:(v:boolean)=>void;

  onPendingOwnerDocsChange?:(files:File[])=>void;
  onPendingDriverDocsChange?:(files:File[])=>void;

  existingOwnerDocs?: ExistingDoc[];
  existingDriverDocs?: ExistingDoc[];
  onDeleteOwnerDoc?: (docId:number)=>Promise<void> | void;
  onDeleteDriverDoc?: (docId:number)=>Promise<void> | void;

};

export default function PersonForm({
  owner,
  setOwner,
  driver,
  setDriver,
  applicationId,
  isSamePerson,
  setIsSamePerson,
  onPendingOwnerDocsChange, onPendingDriverDocsChange,
  existingOwnerDocs = [], existingDriverDocs = [],
  onDeleteOwnerDoc,
  onDeleteDriverDoc,

}:  Props) {

  const handleCheckboxChange = (value: boolean) => {
    setIsSamePerson(value);
    if (value) {
      setDriver({ is_owner: true });
    } else {
      setDriver({
        is_owner: false,
        first_name: "",
        last_name: "",
        dni: "",
        phone_number: "",
        email: "",
        province: "",
        city: "",
        street: "",
      });
    }
  };

  return (
    <div className="">
      <div className="flex justify-center items-center gap-x-4 mb-14">
        <h1 className="text-xl font-regular">
          ¿El titular y el conductor son la misma persona?
        </h1>
        <CheckBox label="" checked={isSamePerson} onChange={handleCheckboxChange} />
      </div>

      <div
        className={`grid ${
          !isSamePerson ? "grid-cols-[1fr_1px_1fr]" : "px-4 grid-cols-1"
        } max-xl:grid-cols-1 max-xl:px-7 px-10 gap-8 mb-4 items-start`}
      >
        <OwnerForm
          data={owner}
          applicationId={applicationId}
          setData={setOwner}
          onPendingDocsChange={onPendingOwnerDocsChange}
          existingDocuments={existingOwnerDocs}
          onDeleteExisting={onDeleteOwnerDoc}
        />
        {!isSamePerson && <div className="bg-[#dedede] h-full w-px max-xl:w-full max-xl:h-px" />}
        {!isSamePerson && (
          <DriverForm
            data={driver}
            applicationId={applicationId}
            onDeleteExisting={onDeleteDriverDoc}
            setData={setDriver}
            onPendingDocsChange={onPendingDriverDocsChange}
            existingDocuments={existingDriverDocs}
          />
        )}
      </div>
    </div>
  );
}
