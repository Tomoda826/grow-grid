import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable development optimizations
  swcMinify: true,
  // Ensure proper handling of external requests
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
