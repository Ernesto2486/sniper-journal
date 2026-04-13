import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Journal",
  description: "Production-ready trading journal SaaS built with Next.js, Tailwind, Recharts, and Supabase."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07111f] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
