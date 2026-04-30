import * as React from "react";
import { cn } from "@/app/lib/utils";
import { Input } from "@/app/components/ui/input";

type Props = {
  value: string;
  onValueChange: (value: string) => void; // ✅ เปลี่ยนชื่อ
} & React.InputHTMLAttributes<HTMLInputElement>;

const SearchBar = React.forwardRef<HTMLInputElement, Props>(
  ({ className, value, onValueChange, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        placeholder="Search blog..."
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn("w-full", className)}
        {...props}
      />
    );
  },
);

SearchBar.displayName = "SearchBar";

export { SearchBar };
