import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://chainwatch-6ggd7vuu0-vhictoiryas-projects.vercel.app/api/v1/:path*'
      }
    ]
  }
}

module.exports = nextConfig
