import type { NextConfig } from "next";

function getApiOrigin() {
  const value = process.env.API_URL || "http://127.0.0.1:8000";
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new Error("API_URL must be an http(s) origin without a path");
  }
  return url.origin;
}

const config: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${getApiOrigin()}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
