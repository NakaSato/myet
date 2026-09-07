import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module — never bundle it.
  serverExternalPackages: ["better-sqlite3"],
  // the dev badge overlaps the exam footer, and this screen is meant to be a replica
  devIndicators: false,
};

export default nextConfig;
