/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure API proxy for development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },

  // Increase timeout for API proxying (5 minutes for complex calculations)
  experimental: {
    proxyTimeout: 300000,
  },

  // Enable standalone mode for Docker
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [],
    unoptimized: true, // Use unoptimized for local images
  },

  // Suppress hydration warnings in development
  reactStrictMode: true,
};

export default nextConfig;
