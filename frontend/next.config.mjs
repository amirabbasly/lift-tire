/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    // در محیط توسعه، درخواست‌های /uploads به API پروکسی می‌شود
    const api = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000';
    return [
      { source: '/api/:path*', destination: `${api}/api/:path*` },
      { source: '/uploads/:path*', destination: `${api}/uploads/:path*` },
    ];
  },
};
export default nextConfig;
