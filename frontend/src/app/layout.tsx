import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Der faire Mietpreis-Check",
  description:
    "Nutze modernstes Machine Learning, um den wahren Wert einer Wohnung zu ermitteln.",
};

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.className} antialiased`}>{children}</body>
    </html>
  );
}
