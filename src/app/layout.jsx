import "@/index.css";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Script from "next/script";

export const metadata = {
  title: "Entrepreneurs BD | The National Engine of Growth",
  description: "Developing 1 million entrepreneurs by 2030. Connect, discover, and scale your startup.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
          strategy="afterInteractive" 
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
