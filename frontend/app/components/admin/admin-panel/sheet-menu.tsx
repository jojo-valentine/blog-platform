"use client";
import Link from "next/link";
import { MenuIcon, PanelsTopLeft } from "lucide-react";
import { Button } from "@/app/components/admin/ui/button";
import { Menu } from "@/app/components/admin/admin-panel/menu";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/admin/ui/sheet";

export function SheetMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background text-foreground shadow-sm">
          <MenuIcon className="h-5 w-5" />
        </button>
      </SheetTrigger>

      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <Button
            className="flex justify-center items-center pb-2 pt-1"
            variant="link"
            asChild
          >
            <Link href="/admin" className="flex items-center gap-2">
              <PanelsTopLeft className="w-6 h-6 mr-1" />

              <SheetTitle className="font-bold text-lg">Admin Panel</SheetTitle>
            </Link>
          </Button>
        </SheetHeader>

        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
}
