import AdminPanelLayout from "@/app/components/admin/admin-panel/admin-panel-layout";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}

