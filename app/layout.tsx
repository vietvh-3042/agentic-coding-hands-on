import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import I18nProvider from "@/shared/ui/i18n-provider";
import { cookieName, resolveLocale } from "@/shared/i18n/settings";
import QueryProvider from "@/shared/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sun* Annual Awards 2025",
  description: "Sun* Annual Awards 2025 — Root Further.",
};

// Emits <meta name="color-scheme" content="dark"> so the browser knows the
// page is intentionally dark before CSS loads — required for Chrome's
// auto-dark-mode heuristics to leave the page alone.
export const viewport: Viewport = {
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Locale resolved from the NEXT_LOCALE cookie (default VI) so SSR renders the
  // right language and the client hydrates without a mismatch.
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(cookieName)?.value);

  // Browser extensions (Dark Reader, Grammarly, password managers) mutate
  // <html>/<body> attributes and inline styles before React hydrates.
  // suppressHydrationWarning is one-level-deep, so it only silences those
  // extension-injected attribute diffs — not real content mismatches in children.
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <QueryProvider>
          <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
