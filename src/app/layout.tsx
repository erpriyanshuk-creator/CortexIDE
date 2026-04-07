import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NexusIDE - AI-Powered Code Editor",
  description: "The world's most advanced AI-powered IDE. Multi-LLM support, AI agents, real-time collaboration, and intelligent code assistance.",
  keywords: ["NexusIDE", "AI", "IDE", "Code Editor", "Next.js", "TypeScript", "Monaco"],
  authors: [{ name: "NexusIDE Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
  openGraph: {
    title: "NexusIDE",
    description: "The world's most advanced AI-powered IDE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
