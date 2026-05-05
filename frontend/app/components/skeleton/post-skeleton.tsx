"use client";
import * as React from "react";

import { cn } from "@/app/lib/utils";
type Props = React.HTMLAttributes<HTMLDivElement> & {
  count?: number;
};

const PostSkeleton = ({ count = 1, ...props }: Props) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn("post-card animate-pulse", props.className)}
          {...props}
        >
          <div className="w-full h-[200px] bg-gray-300 rounded" />

          <div className="post-content space-y-2 mt-3">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />

            <div className="flex gap-2 mt-2">
              <div className="h-3 w-12 bg-gray-300 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

PostSkeleton.displayName = "PostSkeleton";

export { PostSkeleton };
