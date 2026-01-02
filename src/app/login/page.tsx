import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Iniciar sesión - CheckRTO",
  description: "Accedé a tu cuenta de CheckRTO para continuar",
};

export default function LoginPage() {
  return (
    <div className="min-h-full grid place-items-center bg-white">
      <LoginForm />
    </div>
  )
}

