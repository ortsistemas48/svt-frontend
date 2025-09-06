'use client';

import React, { createContext, useState, useContext } from "react";

interface ApplicationContextType {
  isIdle: boolean;
  setIsIdle: React.Dispatch<React.SetStateAction<boolean>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  applicationErrors: Record<string, string>;
  setApplicationErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isIdle, setIsIdle] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applicationErrors, setApplicationErrors] = useState<Record<string, string>>({});
  
  return (
    <ApplicationContext.Provider value={{ isIdle, setIsIdle, errors, setErrors, applicationErrors, setApplicationErrors }}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = (): ApplicationContextType => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error("useApplication must be used within an ApplicationProvider");
  }
  return context;
};
