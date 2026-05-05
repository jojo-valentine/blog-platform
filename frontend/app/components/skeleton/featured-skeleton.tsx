"use client";
import * as React from "react";

import { cn } from "@/app/lib/utils";

const FeaturedSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div
    ref={ref}
    className={cn("grid gap-4 md:grid-cols-3 sm:grid-cols-2 ")}
    {...props}
  >
    {/* Left side skeleton */}
    <div
      className={cn(
        "bg-gray-300 animate-pulse rounded-2xl col-span-2 mb-10",
        "w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px]", // 👈 responsive height
      )}
    ></div>

    {/* Right side skeleton */}
    <div className="col-span-1 flex items-center">
      <div className="w-full space-y-2">
        <div className="h-3 w-20 bg-gray-300 rounded"></div>
        <div className="mt-5 h-5 w-80 bg-gray-300 rounded"></div>
        <div className="mt-5 h-3 w-60 bg-gray-300 rounded"></div>
        <div className="h-3 w-20 bg-gray-300 rounded"></div>
        <div className="mt-5 h-2 w-40 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
));
FeaturedSkeleton.displayName = "FeaturedSkeleton";
export { FeaturedSkeleton };
