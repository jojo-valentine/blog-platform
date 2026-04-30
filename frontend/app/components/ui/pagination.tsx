import * as React from "react";
import { cn } from "@/app/lib/utils";

type Props = {
  page: number;
  totalPages: number;

  onValueChange: (page: number) => void;
} & React.HTMLAttributes<HTMLDivElement>;

const Pagination = React.forwardRef<HTMLDivElement, Props>(
  ({ className, page, totalPages, onValueChange, ...props }, ref) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-2 rounded-lg border bg-card text-card-foreground shadow-sm p-2",
          className,
        )}
        {...props}
      >
        {/* Prev */}
        <button
          disabled={page === 1}
          onClick={() => onValueChange(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {/* Page numbers */}
        {pages.map((p) => (
          <button
            key={p}
            className={cn(
              "px-3 py-1 border rounded",
              p === page && "bg-black text-white",
            )}
            onClick={() => onValueChange(p)}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button
          disabled={page === totalPages}
          onClick={() => onValueChange(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  },
);

Pagination.displayName = "Pagination";

export { Pagination };
