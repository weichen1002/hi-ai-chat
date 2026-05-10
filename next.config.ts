import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["chat.hiapis.cloud"],

  // 允许更大的请求体（写作模式可能携带较长对话历史）
  serverExternalPackages: [],
  experimental: {
    serverComponentsBodySizeLimit: "10mb",
  },
};

export default nextConfig;
