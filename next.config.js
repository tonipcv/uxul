/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'boop-minioboop.dpbdp1.easypanel.host',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 