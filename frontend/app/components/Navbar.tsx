import Link from "next/link";
import React from "react";
// import { Link, useNavigate } from "react-router-dom";
import { Button, buttonVariants } from "./ui/Button";
export default function Navbar() {
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/register">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
