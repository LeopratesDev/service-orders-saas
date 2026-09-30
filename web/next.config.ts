import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy reverso só em desenvolvimento local (localhost:5000)
    // Em produção, NEXT_PUBLIC_API_URL aponta direto para Railway
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
