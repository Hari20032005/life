import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: { default: "FullStack AI Academy", template: "%s · FullStack AI Academy" },
  description: "A six-week, first-principles program that takes a beginner to a job-ready Full-Stack AI Developer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-fg">Skip to content</a>
          <Header />
          <main id="main" className="mx-auto max-w-7xl px-4 py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
