import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "./providers";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const DEFAULT_META = {
  title: "RAJA DIGITAL — Top-Up Royal Dream",
  description: "Platform top-up game terpercaya. Top-up Diamond & Koin Royal Dream dengan harga terbaik, proses cepat, dan layanan 24 jam.",
  keywords: "raja digital, top up royal dream, diamond royal dream, koin royal dream, top up game murah",
};

async function fetchSiteSettings() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const isConfigured = url.startsWith("https://") && !url.includes("your-project") && key.length > 20 && !key.includes("your-service");
    
    if (isConfigured) {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(url, key);
      const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (data) return data;
    }
  } catch (e) {
    console.error("Failed to fetch settings from Supabase:", e);
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await fetchSiteSettings();

  const title       = s?.meta_title       || DEFAULT_META.title;
  const description = s?.meta_description || DEFAULT_META.description;
  const keywords    = s?.meta_keywords    || DEFAULT_META.keywords;

  return {
    title,
    description,
    keywords,
    icons: {
      icon: "https://res.cloudinary.com/dzojrrwtr/image/upload/v1778050105/icon-raja-digital-webp_pstu3k.webp",
      apple: "https://res.cloudinary.com/dzojrrwtr/image/upload/v1778050105/icon-raja-digital-webp_pstu3k.webp",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "id_ID",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await fetchSiteSettings();

  // Extract scripts (strip if empty)
  const gaScript     = s?.ga_script?.trim()     || "";
  const pixelScript  = s?.pixel_script?.trim()  || "";
  const widgetScript = s?.widget_script?.trim() || "";

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable}`}
    >
      <head>
        {/* Google Analytics */}
        {gaScript && (
          <Script
            id="ga-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: gaScript.replace(/<\/?script[^>]*>/gi, "") }}
          />
        )}
        {/* Facebook Pixel */}
        {pixelScript && (
          <Script
            id="pixel-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: pixelScript.replace(/<\/?script[^>]*>/gi, "") }}
          />
        )}
      </head>
      <body className="transition-theme min-h-screen" suppressHydrationWarning>
        <Providers>{children}</Providers>
        {/* Custom Widget Script */}
        {widgetScript && (
          <Script
            id="widget-script"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{ __html: widgetScript.replace(/<\/?script[^>]*>/gi, "") }}
          />
        )}
      </body>
    </html>
  );
}
