/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["ajv", "ajv-formats", "jszip"]
  }
};

export default nextConfig;
