import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  reactCompiler: true,

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
              style-src 'self' 'unsafe-inline' https://js.stripe.com;
              frame-src 'self' https://js.stripe.com;
              connect-src 'self' http://localhost:3000 https://artime-backend.onrender.com https://api.stripe.com
               https://lqimbxjicvdddaoxgjmm.supabase.co;
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
