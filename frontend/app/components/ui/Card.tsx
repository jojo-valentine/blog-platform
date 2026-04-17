import { cn } from "@/app/lib/utils";
import * as React from "react";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card bg-white text-card-foreground shadow-sm",
      className,
    )}
    {...props}
  />
));
export { Card };
