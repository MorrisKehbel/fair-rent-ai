import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI RENT PREDICTOR",
  description: "Predict fair rental prices using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
