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
      "script-src 'self' 'unsafe-inline'",      // permite los inlines que Next inyecta
      "style-src 'self' 'unsafe-inline'",       // estilos inline usados por Next y Tailwind
      "img-src 'self' data: https:",
      "connect-src 'self' wss: https://apis.datos.gob.ar", // fetch y HMR
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
