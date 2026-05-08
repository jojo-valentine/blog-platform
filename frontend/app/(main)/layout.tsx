// import type { Metadata } from "next";
// import "../styles/globals.css";
// import "./globals.css";
// export const metadata: Metadata = {
//   title: "BlogSpace",
//   description: "Dark minimal developer blog",
// };

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="container">{children}</main>
      <Footer />
    </>
  );
}
