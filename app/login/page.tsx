import type { Metadata } from "next";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import SiteHeader from "@/components/login/site-header";
import HeroSection from "@/components/login/hero-section";
import SiteFooter from "@/components/login/site-footer";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
  variable: "--font-montserrat",
});

const montserratAlternates = Montserrat_Alternates({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-montserrat-alternates",
});

export const metadata: Metadata = {
  title: "Sign in | Sun* Annual Awards 2025",
  description: "Sign in to SAA 2025 with your Google account.",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const initialError = error === "oauth_failed";

  return (
    <div
      className={`${montserrat.variable} ${montserratAlternates.variable} relative min-h-screen w-full bg-[#00101A]`}
    >
      <SiteHeader />
      <HeroSection initialError={initialError} />
      <SiteFooter />
    </div>
  );
}
