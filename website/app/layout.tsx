import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://oags.sekuire.ai"),
  title: "OAGS - Open Agent Governance Specification",
  description:
    "An open specification for identity, policy, enforcement, audit, and verification of autonomous AI agents.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "OAGS - Open Agent Governance Specification",
    description:
      "An open specification for identity, policy, enforcement, audit, and verification of autonomous AI agents.",
    type: "website",
    url: "https://oags.sekuire.ai",
    images: [
      {
        url: "/og.jpg",
        width: 3000,
        height: 3000,
        alt: "Sekuire - The Governance Layer for AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OAGS - Open Agent Governance Specification",
    description:
      "An open specification for identity, policy, enforcement, audit, and verification of autonomous AI agents.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
