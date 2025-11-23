import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 1. AWS S3: Virtual-hosted-style (bucket.s3.region.amazonaws.com)
      {
        protocol: 'https',
        hostname: '**.s3.*.amazonaws.com',
      },
      // 2. AWS S3: Dash-region style (bucket.s3-region.amazonaws.com)
      {
        protocol: 'https',
        hostname: '**.s3-*.amazonaws.com',
      },
      // 3. AWS S3: Legacy global endpoint (bucket.s3.amazonaws.com)
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Local Development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000', // Next.js default
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001', // External backend/API
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;