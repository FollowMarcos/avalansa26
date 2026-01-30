import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "motion/react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'knjrizclleralaxyhrwy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
