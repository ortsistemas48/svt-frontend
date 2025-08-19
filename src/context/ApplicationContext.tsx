'use client';

import React, { createContext, useState, useContext } from "react";

interface ApplicationContextType {
  isIdle: boolean;
  setIsIdle: React.Dispatch<React.SetStateAction<boolean>>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isIdle, setIsIdle] = useState(false);
  return (
    <ApplicationContext.Provider value={{ isIdle, setIsIdle }}>
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
