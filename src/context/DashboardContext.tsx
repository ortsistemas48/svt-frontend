'use client';
import React, { createContext, useState, useContext } from "react";

interface DashboardContextType {
    applicationErrors: Record<string, string>;
    setApplicationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
    const [applicationErrors, setApplicationErrors] = useState<Record<string, string>>({});

    return (
        <DashboardContext.Provider value={{ applicationErrors, setApplicationErrors }}>
            {children}
        </DashboardContext.Provider>
    );
}

export const useDashboard = (): DashboardContextType => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}


