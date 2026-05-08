import Link from "next/link";
import { MenuIcon, PanelsTopLeft } from "lucide-react";

import { Button } from "@/app/components/admin/ui/button";
import { Menu } from "@/app/components/admin/admin-panel/menu";
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/app/components/admin/ui/sheet";

export function SheetMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground w-9 lg:hidden h-8"
          variant="outline"
          size="icon"
        >
          <MenuIcon size={20} />
        </Button>
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
