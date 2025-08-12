export type CarType = {
  id: number;
  license_plate: string;
  brand: string;
  vehicle_type: string;
  usage_type: string;
  model: string;
  engine_number: string;
  engine_brand: string;
  chassis_number: string;
  chassis_brand: string;
  weight: number;
  fuel_type: string;
  green_card_number: string;
  green_card_start: string;
  license_number: string;
  license_expiration: string;
  manufacture_year: number;
  owner_id: number;
  driver_id: number;
};

export type UserType = {
  id: string; // UUID
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  dni: string;
  password: string;
  avatar: string;
};
export type PersonType = {
  id?: number;
  first_name?: string;
  last_name?: string;
  dni?: string;
  phone_number?: string;
  email?: string;
  province?: string;
  city?: string;
  is_owner?: boolean;
  street?: string;
  street_number?: string;
};
type ApplicationContextType = {
  applicationId: string;
  date: string;
  owner: PersonType;
  driver?: PersonType;
  car: CarType;
  userId: UserType;

  setDate: React.Dispatch<React.SetStateAction<string>>;
  setOwner: React.Dispatch<React.SetStateAction<PersonType>>;
  setDriver: React.Dispatch<React.SetStateAction<PersonType | undefined>>;
  setCar: React.Dispatch<React.SetStateAction<CarType>>;
  setUserId: React.Dispatch<React.SetStateAction<UserType>>;
};


export type UserType = {
  id: string; // UUID
  created_at: Date;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  dni: string;
  password: string;
  avatar: string;
};

export type Application = {
  application_id: number;
  car: {
    license_plate: string;
    model: string;
    brand: string;
  } | null;
  owner: {
    first_name: string;
    last_name: string;
    dni: string;
  } | null;
  date: string;
  status: "Completado" | "En curso" | "Pendiente" | "En Cola";
  result?: "Apto" | "Condicional" | "Rechazado"
};