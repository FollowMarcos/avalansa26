import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "motion/react"],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'knjrizclleralaxyhrwy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '**.fal.media',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'fal.media',
        port: '',
      },
      // Cloudflare R2 storage (r2.dev subdomain)
      {
        protocol: 'https',
        hostname: '**.r2.dev',
        port: '',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // CSP is set by proxy.ts for all page requests.
          // Do NOT add a second CSP header here — duplicate CSP headers
          // cause the browser to enforce the intersection (most restrictive),
          // which can block R2/external images in components using unoptimized next/image.
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
