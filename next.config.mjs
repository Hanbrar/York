/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.klingai.com",
      },
    ],
  },
};

export default nextConfig;
