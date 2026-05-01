/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'https://multimodal-api.onrender.com'
    return [{ source: '/api/v1/:path*', destination: `${api}/api/v1/:path*` }]
  },
}
module.exports = nextConfig
