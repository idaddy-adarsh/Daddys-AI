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
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build as well
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
