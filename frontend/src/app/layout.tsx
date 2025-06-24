import { Metadata } from "next";
import "./globals.css";

import Providers from "../components/Providers";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "AIT-W",
  description: "Amphibia Improove Test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
