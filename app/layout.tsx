import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShieldOn — Governed Revenue Investigation",
  description: "Evidence-led AI investigation with human-governed findings.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
