import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    domains: [
      'images.clerk.dev', // For Clerk avatar images
      'lh3.googleusercontent.com', // For Google profile pictures
      'graph.microsoft.com', // For Microsoft profile pictures
      'avatars.githubusercontent.com', // For GitHub profile pictures (if needed in future)
      'platform-lookaside.fbsbx.com', // For Facebook profile pictures (if needed in future)
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
