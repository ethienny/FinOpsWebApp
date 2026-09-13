import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["papaparse", "mssql"],
};

export default nextConfig;
