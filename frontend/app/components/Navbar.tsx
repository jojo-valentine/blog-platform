"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// NEXT_PUBLIC_API_URL
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Button, buttonVariants } from "./ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { LogOut, User, PenSquare, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
export default function Navbar() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    if (!user) {
      setUser(null);
      return;
    }
  }, [user]);
  // console.log({ user: user });
  if (loading) return null;
  const handleSignOut = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-heading text-xl font-bold tracking-tight"
        >
          BlogSpace
        </Link>
        <nav className="flex items-center gap-3">
          {loading ? (
            <span>Loading...</span>
          ) : user ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="">
                  <PenSquare className="mr-1.5 h-4 w-4" />
                  Write
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="">
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  My Blogs
                </Link>
              </Button>
              {/* <span>{user.name}</span> */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profile?.avatar ?? undefined} />
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
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
