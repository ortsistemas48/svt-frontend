// next.config.ts
import type { NextConfig } from "next";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || "https://svt-backend.onrender.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "connect-src 'self' ws: wss: https://uedevplogwlaueyuofft.supabase.co",
      "img-src 'self' data: blob: https://uedevplogwlaueyuofft.supabase.co",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",      // permite los inlines y eval que Next necesita
      "style-src 'self' 'unsafe-inline'",       // estilos inline usados por Next y Tailwind
      "connect-src 'self' ws: wss: https://apis.datos.gob.ar", // fetch y HMR
      "font-src 'self' https: data:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
