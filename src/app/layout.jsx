import "@/index.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Script from "next/script";
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/seo-schemas";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrepreneurs.com.bd';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Entrepreneurs BD | The National Engine of Growth",
    template: "%s | Entrepreneurs BD"
  },
  description: "Accelerating Bangladesh by developing 1 million entrepreneurs by 2030. Connect with founders, discover businesses, and scale your venture.",
  keywords: ["entrepreneurs", "Bangladesh startups", "business directory", "founder networking", "scale startups", "entrepreneurship BD"],
  authors: [{ name: "Entrepreneurs BD Team" }],
  creator: "Entrepreneurs BD",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Entrepreneurs BD",
    title: "Entrepreneurs BD | The National Engine of Growth",
    description: "The definitive platform for finding founders and scaling businesses in Bangladesh.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Entrepreneurs BD - The National Engine of Growth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Entrepreneurs BD | The National Engine of Growth",
    description: "Developing 1 million entrepreneurs by 2030. Connect, discover, and scale your startup.",
    images: ["/og-default.png"],
    creator: "@EntrepreneursBD",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo192.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
          strategy="afterInteractive" 
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebSiteSchema()) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-stone-50 font-sans">
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
