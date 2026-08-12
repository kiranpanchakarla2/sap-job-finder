import type { Metadata } from "next";
import {
  Inter,
  Lora,
  Manrope,
  Outfit,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/auth/AuthContext";
import { AppToaster } from "@/components/providers/AppToaster";
import { GoogleAnalytics } from "@/components/providers/GoogleAnalytics";
import { ThemeAtmosphere } from "@/components/theme/ThemeAtmosphere";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { ApplicationsProvider } from "@/features/candidate-applications";
import { SavedJobsProvider } from "@/features/candidate-jobs";
import { siteConfig } from "@/lib/constants";
import { ThemeProvider } from "@/theme/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

const fontVariables = [
  inter.variable,
  manrope.variable,
  lora.variable,
  spaceGrotesk.variable,
  outfit.variable,
].join(" ");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <GoogleAnalytics />
      </head>
      <body className="relative min-h-screen font-sans">
        <ThemeProvider>
          <AuthProvider>
            <SavedJobsProvider>
              <ApplicationsProvider>
                <ThemeAtmosphere />
                <div className="relative z-[1]">{children}</div>
                <ThemeSwitcher />
                <AppToaster />
              </ApplicationsProvider>
            </SavedJobsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
