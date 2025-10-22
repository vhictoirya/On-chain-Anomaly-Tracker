/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    serverActions: true,
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://chainwatch-6ggd7vuu0-vhictoiryas-projects.vercel.app/api/v1/:path*'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=1, stale-while-revalidate=59' }
        ],
      },
    ]
  }
}

module.exports = nextConfig
