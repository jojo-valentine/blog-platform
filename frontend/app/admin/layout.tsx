import AdminPanelLayout from "@/app/components/admin/admin-panel/admin-panel-layout";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={GeistSans.className}>
      <AdminPanelLayout>{children}</AdminPanelLayout>
    </div>
  );
}
