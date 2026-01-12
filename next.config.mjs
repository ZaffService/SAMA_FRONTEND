/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Désactivez en production si possible
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bibocomdigital.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "agreeable-beige-frhuu5l09k-6gilnlf1ox.edgeone.dev",
      },
      {
        protocol: "https",
        hostname: "foldr.space",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Recommandé pour Vercel
  output: 'standalone', // Optimise le bundle pour production
  
  // ✅ Compression automatique
  compress: true,

  devIndicators: {
    buildActivity: false,
    buildActivityPosition: "bottom-right",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NODE_ENV === 'production' 
              ? "https://bibocom-api.cloud" // Sécurisez en prod
              : "*", // Permissif en dev
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          // ✅ Sécurité supplémentaire
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;