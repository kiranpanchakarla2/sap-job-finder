import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
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
