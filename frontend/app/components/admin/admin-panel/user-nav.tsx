"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/context/AuthContext";
import { API_URL } from "@/app/lib/config";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/admin/ui/tooltip";

import { Button } from "@/app/components/ui/button";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";

import { LayoutGrid, User, LogOut, Loader2 } from "lucide-react";

export function UserNav() {
  const router = useRouter();

  const { user, loading, setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      );

      setUser(null);

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const avatarSrc =
    user?.profile?.avatar &&
    (user.profile.avatar.startsWith("http")
      ? user.profile.avatar
      : `${API_URL}${user.profile.avatar}`);

  const displayName = user?.profile?.display_name || user?.name || "User";

  const email = user?.email || "No email";

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarSrc || ""} alt={displayName} />

                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>

            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/admin/" className="flex items-center">
              <LayoutGrid className="mr-3 h-4 w-4 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link
              href="/admin/pages/setting/change-password"
              className="flex items-center"
            >
              <User className="mr-3 h-4 w-4 text-muted-foreground" />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-500 focus:text-red-500"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-3 h-4 w-4 text-muted-foreground" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
