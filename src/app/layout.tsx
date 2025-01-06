import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ben's CFP Tracker - Track Conference Speaking Opportunities",
  description: "Track and manage your conference speaking opportunities. Filter by location, manage submission status, and (hopefully) never miss a CFP deadline.",
  metadataBase: new URL('https://cfp.bendechr.ai'),
  openGraph: {
    title: "Ben's CFP Tracker - Track Conference Speaking Opportunities",
    description: "Track and manage your conference speaking opportunities. Filter by location, manage submission status, and (hopefully) never miss a CFP deadline.",
    type: "website",
    url: "https://cfp.bendechr.ai",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Ben's CFP Tracker Preview"
      }
    ],
    siteName: "Ben's CFP Tracker"
  },
  twitter: {
    card: "summary_large_image",
    title: "Ben's CFP Tracker - Track Conference Speaking Opportunities",
    description: "Track and manage your conference speaking opportunities. Filter by location, manage submission status, and (hopefully) never miss a CFP deadline.",
    creator: "@bendechrai",
    images: ["/opengraph-image"]
  },
  robots: {
    index: true,
    follow: true
  },
  authors: [{ name: "Ben Dechrai", url: "https://bsky.app/profile/bendechr.ai" }],
  creator: "Ben Dechrai",
  keywords: ["CFP", "conference", "speaking", "call for papers", "tech conference", "developer conference"]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
