import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Build-time environment variable validation
// Validate critical environment variables at build time to catch configuration errors early
const requiredEnvVars = ['BACKEND_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `\n❌ Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
    '   Please check your .env.local file or Vercel environment variables.\n' +
    '   See .env.example for required variables.\n'
  );
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // Add security headers for all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
