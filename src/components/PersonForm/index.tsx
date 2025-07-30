'use client';
import DriverForm from "@/components/DriverForm";
import OwnerForm from "@/components/OwnerForm";
import CheckBox from "../CheckBox";
import { useState } from "react";
export default function PersonForm() {
    const [isSamePerson, setIsSamePerson] = useState(true);
    return <div className="">
        <div className="flex justify-center items-center gap-x-4 mb-10">
            <h1 className="text-xl font-semibold">¿El conductor y el propietario son la misma persona ?</h1>
            <CheckBox 
                label="" 
                checked={isSamePerson}   
                onChange={setIsSamePerson} 
            />
        </div>
        <div className={`grid ${!isSamePerson ? "grid-cols-[1fr_1px_1fr]" : "grid-cols-1"} max-xl:grid-cols-1 gap-8 mb-4 items-start `}>
            <OwnerForm />
            {!isSamePerson && <div className="bg-[#dedede] h-full w-px max-xl:hidden" />}
            {!isSamePerson && <DriverForm />}
        </div>
    </div>

}