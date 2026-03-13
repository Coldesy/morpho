import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morpho 2.0 — AI-Powered 3D Visualization Engine",
  description:
    "Transform any concept into interactive 3D visualizations powered by multi-model AI. Explore real-world and abstract concepts with Morpho 2.0.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
