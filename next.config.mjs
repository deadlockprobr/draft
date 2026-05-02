/** @type {import('next').NextConfig} */
const nextConfig = {
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
