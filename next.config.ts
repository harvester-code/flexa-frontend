import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1] || '' },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
