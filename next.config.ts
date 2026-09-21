import type { NextConfig } from "next";

const developmentScriptSources = process.env.NODE_ENV === 'development'
  ? " 'unsafe-eval'"
  : '';
const contentSecurityPolicy = `default-src 'self'; script-src 'self' 'unsafe-inline'${developmentScriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api-merchant.payos.vn; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`;

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      ],
    }];
  },
};

export default nextConfig;
