import type { Metadata } from "next";
import { Inter, Quicksand, Fredoka, Baloo_2 } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-quicksand",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fredoka",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
});

export const metadata: Metadata = {
  title: "Little Fables - Create Magical Stories for Children",
  description: "AI-powered story creation platform for parents and teachers. Create personalized, educational stories with our intuitive visual canvas.",
  keywords: ["children stories", "AI story creator", "educational stories", "kids books", "story maker"],
  authors: [{ name: "Little Fables" }],
  openGraph: {
    title: "Little Fables - Create Magical Stories for Children",
    description: "AI-powered story creation platform for parents and teachers",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${quicksand.variable} ${fredoka.variable} ${baloo.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
