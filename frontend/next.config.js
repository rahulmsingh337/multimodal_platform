/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'https://multimodal-api.onrender.com'
    return [{ source: '/api/v1/:path*', destination: `${api}/api/v1/:path*` }]
  },
}
module.exports = nextConfig
