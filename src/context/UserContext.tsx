"use client";

import React, { createContext, useContext } from "react";

type User = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  dni: string;
  avatar: string;
};

type Workshop = {
  workshop_id: number;
  workshop_name: string;
  role: string;
};

type UserContextType = {
  user: User;
  workshops: Workshop[];
};

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de <UserProvider>");
  return ctx;
};

export const UserProvider = ({
  user,
  workshops,
  children
}: {
  user: User;
  workshops: Workshop[];
  children: React.ReactNode;
}) => {
  return (
    <UserContext.Provider value={{ user, workshops }}>
      {children}
    </UserContext.Provider>
  );
};
