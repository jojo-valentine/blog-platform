import * as React from "react";
import { cn } from "@/app/lib/utils";

type Props = {
  page: number;
  totalPages: number;

  onValueChange: (page: number) => void;
} & React.HTMLAttributes<HTMLDivElement>;
const getPages = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
};

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
        {getPages(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span
              key={`dot-${i}`}
              className="px-2 py-1.5 text-sm text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onValueChange(p)}
              className={cn(
                "w-9 h-9 rounded-lg border text-sm font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "hover:bg-muted text-foreground",
              )}
            >
              {p}
            </button>
          ),
        )}

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
