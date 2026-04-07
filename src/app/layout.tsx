import type { Metadata } from "next";
import { Amatic_SC, Cormorant_Garamond } from "next/font/google";
import { PageTransitionProvider } from "@/components/layout/page-transition-provider";
import { SiteNavigation } from "@/components/layout/site-navigation";
import "./globals.css";

const handwritten = Amatic_SC({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Narrative Portfolio",
    template: "%s | Narrative Portfolio",
  },
  description:
    "An interactive personal website built as a rope-based narrative timeline with Sanity-powered content and editorial intake tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${handwritten.variable} ${serif.variable}`}>
      <body>
        <PageTransitionProvider>
          <SiteNavigation />
          <div className="site-shell">
            <div className="site-shell-edge" aria-hidden="true" />
            {children}
          </div>
        </PageTransitionProvider>
      </body>
    </html>
  );
}
