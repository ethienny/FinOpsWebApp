// Next.js configuration. Standalone output for the App Service deploy;
// papaparse and mssql stay external so the server bundle does not inline them.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["papaparse", "mssql"],
};

export default nextConfig;
