import ApplicationForm from "@/components/ApplicationForm";
import { ApplicationProvider } from "@/context/ApplicationContext";
export default function CreateApplicationPage() {
    return (
      <ApplicationProvider>
        <ApplicationForm />
      </ApplicationProvider>
  );
}