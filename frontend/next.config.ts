import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow the dev server to be reached from devices on the local network
  // (e.g. a real phone) without cross-origin warnings.
  allowedDevOrigins: ["192.168.1.*"],
};

export default nextConfig;
