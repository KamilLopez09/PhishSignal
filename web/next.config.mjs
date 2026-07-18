/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Optional same-origin proxy → FastAPI (Phase B). Use with
    // NEXT_PUBLIC_API_BASE_URL=/backend
    const target = process.env.PHISHSIGNAL_API_PROXY ?? "http://127.0.0.1:8000";
    return [
      {
        source: "/backend/:path*",
        destination: `${target.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
