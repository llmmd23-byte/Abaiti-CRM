import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {key: "Cache-Control", value: "no-store, no-cache, must-revalidate"},
          {key: "Pragma", value: "no-cache"},
          {key: "Expires", value: "0"},
        ],
      },
    ];
  },
  images: {
    unoptimized: true
  }
};

export default withNextIntl(nextConfig);
