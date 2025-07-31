'use client'
import { useState } from "react"
import PersonForm from "@/components/PersonForm";
import VehicleForm from "@/components/VehicleForm";
import ConfirmationForm from "@/components/ConfirmationForm";
import SelectApplicationType from "../SelectApplicationType";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function ApplicationForm() {
    const [step, setStep] = useState(0)

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return <SelectApplicationType />;
            case 1:
                return <PersonForm />;
            case 2:
                return <VehicleForm />;
            case 3:
                return <ConfirmationForm />;
            default:
                return null;
        }
    }
    
    return (
        <>
            <article className="flex items-center justify-between text-lg mb-6">
                <div className="flex items-center gap-1">
                    <span>Inicio</span>
                    <ChevronRight size={20} />
                    <span className="text-[#0040B8]">Trámite</span>
                </div>
                {
                    step === 0 || <span className="text-md mr-4 text-black">Paso {step}/3</span>
                }
            </article>

            <div>
                {renderStepContent()}
            </div>
            <div className="flex gap-x-3 justify-center px-4 pt-8 pb-10">
                <button onClick={handlePrev} className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-7">
                    <ChevronLeft size={18} />
                    Volver
                </button>
                <button onClick={handleNext} className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-7">
                    Continuar
                </button>
            </div>

        </>
    )
}