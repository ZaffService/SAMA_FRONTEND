import type { Metadata } from "next";
import { Inter, Pacifico } from "next/font/google";
import "./globals.css";
import "../styles/responsive-mobile.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
  fallback: ["cursive", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Bibocom digital - Plateforme E-Learning",
  description: "Plateforme e-learning complète pour développer vos compétences",
  generator: "Bibocom Digital",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.className} ${pacifico.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
