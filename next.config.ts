import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["chat.hiapis.cloud"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
