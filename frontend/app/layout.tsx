import type { Metadata } from "next";
import "./globals.css";
// import "./styles/globals.css";
import { AuthProvider } from "@/app/context/AuthContext";

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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground font-sans"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
