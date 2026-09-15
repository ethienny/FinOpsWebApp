// Next.js configuration. Standalone output for the App Service deploy;
// papaparse and mssql stay external so the server bundle does not inline
// them. Security headers apply to every route; inline scripts and styles are
// allowed because Next and Recharts still rely on them.

import type { NextConfig } from "next";

// Development needs eval for hot reloading; production does not.
const SCRIPT_SRC = process.env.NODE_ENV === "development" ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value:
      `default-src 'self'; script-src ${SCRIPT_SRC}; style-src 'self' 'unsafe-inline'; ` +
      "img-src 'self' data:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["papaparse", "mssql"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
