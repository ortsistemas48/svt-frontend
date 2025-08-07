'use client';
import {
  type CarType,
  type PersonType,
  type ApplicationContextType,
  type UserType,
} from "@/app/types";
import {
  ReactNode,
  useContext,
  useState,
  createContext,
  useEffect,
} from "react";

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

// 3️⃣ Props para el Provider
interface ApplicationProviderProps {
  applicationId: string;
  initialData: any;
  children: ReactNode;
}

// 4️⃣ Provider
export const ApplicationProvider = ({
  applicationId,
  initialData,
  children,
}: ApplicationProviderProps) => {
  const [date, setDate] = useState<string>(initialData?.date || '');
  const [owner, setOwner] = useState<PersonType>(initialData?.owner || {
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
  const [driver, setDriver] = useState<PersonType | undefined>(initialData?.driver || {
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
  const [car, setCar] = useState<CarType>(initialData?.car || {
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
  const [userId, setUserId] = useState<UserType>(initialData?.user || {
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
  }, [owner, driver, car, userId]);

  return (
    <ApplicationContext.Provider
      value={{
        applicationId,
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
