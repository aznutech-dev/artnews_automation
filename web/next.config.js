/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.usaupdatenews.com" },
      { protocol: "https", hostname: "media.usaupdatenews.com" },
    ],
  },
};

module.exports = nextConfig;
