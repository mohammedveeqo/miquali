/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for optimized production builds with minimal footprint.
  // Supports API routes for AI/Bedrock key management while keeping
  // deployment costs near-zero (Requirement 16.4).
  output: 'standalone',

  // Optimize images — use unoptimized for static/CDN hosting compatibility
  images: {
    unoptimized: true,
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize bundle splitting for faster page loads (Requirement 16.1)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@xyflow/react',
      'react-markdown',
    ],
  },

  // Webpack customizations for performance (Requirement 16.1, 16.3)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure React Flow and heavy dependencies are split into separate chunks
      // so they only load on diagram/capstone pages (lazy loaded via next/dynamic)
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            .../** @type {object} */ (config.optimization?.splitChunks)
              ?.cacheGroups,
            reactflow: {
              test: /[\\/]node_modules[\\/]@xyflow[\\/]/,
              name: 'reactflow',
              chunks: 'all',
              priority: 30,
            },
            markdown: {
              test: /[\\/]node_modules[\\/](react-markdown|remark|unified|micromark|mdast)[\\/]/,
              name: 'markdown',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }
    return config;
  },

  // Compress responses for faster delivery
  compress: true,

  // Disable x-powered-by header for smaller response size
  poweredByHeader: false,
};

export default nextConfig;
