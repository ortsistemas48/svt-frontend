"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import WhatIsCheckRTO from "@/components/landing/WhatIsCheckRTO";
import FeaturesSection from "@/components/landing/FeaturesSection";
import GrowthSection from "@/components/landing/GrowthSection";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          setChecking(false);
          return;
        }

        const data = await res.json();

        // Misma lógica que después del login
        if (data.user?.is_admin) {
          router.push("/admin-dashboard");
          return;
        }

        const workshops = data.workshops || [];
        if (workshops.length === 1) {
          router.push(`/dashboard/${workshops[0].workshop_id}`);
          return;
        }

        router.push("/select-workshop");
        return;
      } catch (error) {
        console.error("Error checking auth:", error);
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Mostrar nada mientras se verifica (o un spinner si prefieres)
  if (checking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <LandingHeader />
      <HeroSection />
      <WhatIsCheckRTO />
      <FeaturesSection />
      <GrowthSection />
      <CallToAction />
      <Footer />
    </div>
  );
}
