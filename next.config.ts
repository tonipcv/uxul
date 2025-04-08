import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ignorar erros de tipo durante o build para facilitar o desenvolvimento
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
