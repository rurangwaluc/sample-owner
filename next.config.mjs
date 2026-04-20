/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://sample-backend-3rje.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
