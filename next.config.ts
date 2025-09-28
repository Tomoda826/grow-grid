import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests for Replit environment
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '.replit.dev',
    '.replit.com'
  ],
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
