import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is now stable - moved from experimental
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
  
  // Optimize production
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    unoptimized: true, // Faster dev builds
  },
  
  // Reduce webpack overhead
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
