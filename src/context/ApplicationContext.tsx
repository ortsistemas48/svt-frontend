'use client';
import { type CarType, type PersonType, type ApplicationContextType, type UserType } from "@/app/types";
import { ReactNode, useContext, useState, createContext, useEffect } from "react";
// 1️⃣ Crear el contexto
const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

// 2️⃣ Hook para consumir el contexto
export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplication debe usarse dentro de un ApplicationProvider');
  }
  return context;
};

// 3️⃣ Provider
export const ApplicationProvider = ({ children }: { children: ReactNode }) => {
  const [date, setDate] = useState<string>('');
  const [owner, setOwner] = useState<PersonType>({
    id: 0,
    first_name: '',
    last_name: '',
    dni: '',
    phone_number: '',
    email: '',
    province: '',
    city: '',
    is_owner: true,
    street: '',
    street_number: '',
  });
  const [driver, setDriver] = useState<PersonType | undefined>({
    id: 0,
    first_name: '',
    last_name: '',
    dni: '',
    phone_number: '',
    email: '',
    province: '',
    city: '',
    is_owner: false,
    street: '',
    street_number: '',
    
  });
  const [car, setCar] = useState<CarType>({
    id: 0,
    license_plate: '',
    brand: '',
    vehicle_type: '',
    usage_type: '',
    model: '',
    engine_number: '',
    engine_brand: '',
    chassis_number: '',
    chassis_brand: '',
    weight: 0,
    fuel_type: '',
    green_card_number: '',
    green_card_start: '',
    license_number: '',
    license_expiration: '',
    manufacture_year: 0,
    owner_id: 0,
    driver_id: 0,
  });
  const [userId, setUserId] = useState<UserType>({
    id: "",
    created_at: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    dni: "",
    password: "",
    avatar: "",
  });

  useEffect(() => {
    // Aquí podrías agregar lógica para sincronizar el estado con un backend o localStorage si es necesario
    console.log("Context updated:", { owner, driver, car, userId });
  }, [owner, driver, car, userId]);
  return (
    <ApplicationContext.Provider
      value={{
        date,
        owner,
        driver,
        car,
        userId,
        setDate,
        setOwner,
        setDriver,
        setCar,
        setUserId,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};