/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `standalone` bundles only what's needed to run; used by the
  // Dockerfile / Fly deploy so the runtime image is ~150 MB.
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["ajv", "ajv-formats", "jszip"]
  }
};

export default nextConfig;
