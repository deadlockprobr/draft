import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets-bucket.deadlock-api.com',
      },
    ],
  },
}

export default nextConfig
