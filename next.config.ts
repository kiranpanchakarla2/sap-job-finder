import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@supabase/supabase-js",
      "@supabase/ssr",
      "zod",
      "xlsx",
    ],
  },
  async redirects() {
    return [
      {
        source: "/career-hub/:page",
        destination: "/services/career-services/:page",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// Local `next dev` bindings only — skip in production/CI builds.
if (process.env.NODE_ENV === "development") {
  void import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
