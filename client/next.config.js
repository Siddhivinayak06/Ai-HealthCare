/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: process.env.NEXT_PUBLIC_IMAGE_DOMAINS?.split(',') || ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: process.env.NEXT_PUBLIC_SERVER_PORT || '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: process.env.NEXT_PUBLIC_SERVER_PORT || '5000',
        pathname: '/api/uploads/**',
      },
    ],
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000',
    SERVER_PORT: process.env.NEXT_PUBLIC_SERVER_PORT || '5000',
  },
};

module.exports = nextConfig; 