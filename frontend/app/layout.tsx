import type { Metadata } from "next";
import "./styles/globals.css";
import "./globals.css";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
export const metadata: Metadata = {
  title: "BlogSpace",
  description: "Dark minimal developer blog",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        <Navbar />
        <main className="container">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
