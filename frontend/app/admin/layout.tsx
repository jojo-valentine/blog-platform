import AdminPanelLayout from "@/app/components/admin/admin-panel/admin-panel-layout";
import { ThemeProvider } from "@/app/components/admin/providers/theme-provider";
import { GeistSans } from "geist/font/sans";

import "./globals.css";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${GeistSans.className}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AdminPanelLayout>{children}</AdminPanelLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
