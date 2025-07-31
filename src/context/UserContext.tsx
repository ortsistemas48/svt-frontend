// context/UserContext.tsx
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
} | null;

const UserContext = createContext<User>(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
