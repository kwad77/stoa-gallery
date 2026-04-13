/**
 * Single config that flips based on NEXT_PUBLIC_GALLERY_STATIC.
 *
 * - Server mode (default): `output: 'standalone'` for Fly's Dockerfile.
 * - Static mode (NEXT_PUBLIC_GALLERY_STATIC=1): `output: 'export'` for
 *   GitHub Pages, with basePath/assetPrefix for the project sub-path.
 *
 * The prebuild script (scripts/prebuild-static.mjs) temporarily stashes
 * server-only routes (api/, live/, opengraph-image) before the export
 * build so Next doesn't choke on them.
 */

const STATIC = process.env.NEXT_PUBLIC_GALLERY_STATIC === "1";
const BASE_PATH = process.env.NEXT_PUBLIC_GALLERY_BASE_PATH ?? "/stoa-gallery";

/** @type {import('next').NextConfig} */
const nextConfig = STATIC
  ? {
      output: "export",
      basePath: BASE_PATH,
      assetPrefix: BASE_PATH,
      reactStrictMode: true,
      trailingSlash: true,
      images: { unoptimized: true },
      experimental: {
        serverComponentsExternalPackages: ["ajv", "ajv-formats", "jszip"]
      },
      env: {
        NEXT_PUBLIC_GALLERY_STATIC: "1",
        NEXT_PUBLIC_GALLERY_BASE_PATH: BASE_PATH
      }
    }
  : {
      output: "standalone",
      reactStrictMode: true,
      experimental: {
        serverComponentsExternalPackages: ["ajv", "ajv-formats", "jszip"]
      }
    };

export default nextConfig;
