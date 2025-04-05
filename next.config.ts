import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1] || '' },
    ],
  },
};

export default nextConfig;
