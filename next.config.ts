import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: [
          "lh3.googleusercontent.com",
          // add any other domains you need here
        ],
      },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // ...your existing Next.js config
});

export default nextConfig;
