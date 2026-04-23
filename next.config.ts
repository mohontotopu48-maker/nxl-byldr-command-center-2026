import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.space.z.ai", "*.z.ai"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Prisma client must be externalized for serverless environments (Vercel)
  serverExternalPackages: ["@prisma/client"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors * *" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
