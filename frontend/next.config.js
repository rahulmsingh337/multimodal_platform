/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://multimodal-api.onrender.com/api/v1/:path*',
      },
    ]
  },
}

module.exports = nextConfig
