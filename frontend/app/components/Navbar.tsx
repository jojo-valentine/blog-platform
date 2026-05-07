// ── Navbar.tsx ──
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { LogOut, User, PenSquare, BookOpen, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [menuOpen, setMenuOpen] = useState(false);

  // ปิด menu เมื่อ resize
  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  const handleSignOut = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setMenuOpen(false);
  };

  const avatar = user?.profile?.avatar;
  const avatarSrc =
    avatar && (avatar.startsWith("http") ? avatar : `${API_URL}${avatar}`);

  if (loading) return null;

  const navLinks = user ? (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href="/pages/blog/create" onClick={() => setMenuOpen(false)}>
          <PenSquare className="mr-1.5 h-4 w-4" /> Write
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/pages/blog" onClick={() => setMenuOpen(false)}>
          <BookOpen className="mr-1.5 h-4 w-4" /> My Blogs
        </Link>
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
          Sign In
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
          Get Started
        </Link>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-xl font-bold tracking-tight"
        >
          BlogSpace
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pages/blog/list_post">All Posts</Link>
          </Button>

          {navLinks}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={avatarSrc || undefined}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {(user?.profile?.display_name ?? user.email ?? "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/pages/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t bg-background overflow-hidden"
          >
            <nav className="container flex flex-col gap-2 py-4">
              <Link
                href="/pages/blog/list_post"
                className="px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                All Posts
              </Link>

              {user ? (
                <>
                  <Link
                    href="/pages/blog/create"
                    className="px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <PenSquare className="h-4 w-4" /> Write
                  </Link>
                  <Link
                    href="/pages/blog"
                    className="px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" /> My Blogs
                  </Link>
                  <Link
                    href="/pages/profile"
                    className="px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors flex items-center gap-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive text-sm text-left transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm transition-colors text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
