'use client';
import DriverForm from "@/components/DriverForm";
import OwnerForm from "@/components/OwnerForm"
import CheckBox from "../CheckBox";
import { useState } from "react";
export default function PersonForm() {
    const [isSamePerson, setIsSamePerson] = useState(true);
    return <div className="">
        <div className="flex justify-center items-center gap-x-4 mb-14">
            <h1 className="text-xl font-regular">¿El conductor y el propietario son la misma persona?</h1>
            <CheckBox 
                label="" 
                checked={isSamePerson}   
                onChange={setIsSamePerson} 
            />
        </div>
        <div className={`grid ${!isSamePerson ? "grid-cols-[1fr_1px_1fr]" : "px-4 grid-cols-1"} max-xl:grid-cols-1 max-xl:px-7 px-10 gap-8 mb-4 items-start `}>
            <OwnerForm />
            {!isSamePerson && <div className="bg-[#dedede] h-full w-px max-xl:w-full max-xl:h-px" />}
            {!isSamePerson && <DriverForm />}
        </div>
    </div>

}