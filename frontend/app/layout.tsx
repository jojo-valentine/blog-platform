import type { Metadata } from "next";
import "./globals.css";
// import "./styles/globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/app/components/ui/theme-provider";

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
