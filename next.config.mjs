
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  serverExternalPackages: ["playwright"],

  outputFileTracingIncludes: {
    "/api/invoices/**": [
      "./node_modules/playwright/**",
      "./node_modules/playwright-core/**",
    ],
  },
};

export default nextConfig;
