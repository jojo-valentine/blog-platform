"use client";
import * as React from "react";

import { cn } from "@/app/lib/utils";

const BannerSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <section
    className={cn("w-full h-[260px] bg-gray-300 animate-pulse rounded-2xl mb-[40px]", className)}
    {...props}
  ></section>
));
BannerSkeleton.displayName = "BannerSkeleton";
export { BannerSkeleton };
