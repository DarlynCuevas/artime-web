import type { NextConfig } from "next";

function getOrigin(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

// Legacy static allowlist used previously (kept for quick rollback/testing).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LEGACY_CONNECT_SRC =
  "'self' http://localhost:3000 https://artime-backend.onrender.com https://api.stripe.com https://lqimbxjicvdddaoxgjmm.supabase.co wss://lqimbxjicvdddaoxgjmm.supabase.co";

const apiOrigin = getOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
const connectSrc = [
  "'self'",
  "http://localhost:3000",
  "https://artime-backend.onrender.com",
  apiOrigin,
  "https://api.stripe.com",
  "https://lqimbxjicvdddaoxgjmm.supabase.co",
  "wss://lqimbxjicvdddaoxgjmm.supabase.co",
]
  .filter(Boolean)
  .filter((v, i, arr) => arr.indexOf(v) === i)
  .join(" ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' https://js.stripe.com;
              style-src 'self' 'unsafe-inline' https://js.stripe.com https://fonts.googleapis.com;
              frame-src 'self' https://js.stripe.com https://www.youtube.com https://www.youtube-nocookie.com;
              img-src 'self' data: blob: https://lqimbxjicvdddaoxgjmm.supabase.co https://img.youtube.com;
              font-src 'self' data: https://fonts.gstatic.com;
              connect-src ${connectSrc};
            `
              .replace(/\s+/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
