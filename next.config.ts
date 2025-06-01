import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    domains: ['images.clerk.dev'], // For Clerk avatar images
    unoptimized: false,
  },
};

export default nextConfig;
