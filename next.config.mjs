
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // Keep Playwright outside the Next.js server bundle.
  serverExternalPackages: ["playwright", "playwright-core"],

  // Include Playwright runtime files in the production deployment.
  outputFileTracingIncludes: {
    "/api/invoices/[id]/html": [
      "./node_modules/playwright/**",
      "./node_modules/playwright-core/**",
    ],
  },
};

export default nextConfig;
