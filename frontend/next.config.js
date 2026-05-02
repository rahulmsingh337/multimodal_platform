/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: 'https://multimodal-plat-rahul-singh-s-projects-9d848a7f.vercel.app/api/v1/:path*' }]
  },
}
module.exports = nextConfig
