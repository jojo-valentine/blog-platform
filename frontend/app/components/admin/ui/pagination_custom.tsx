import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/admin/ui/pagination";

type Props = {
  page: number;
  totalPages: number;
  onValueChange: (page: number) => void;
};

const getPages = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);

  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
};

function PaginationTable({ page, totalPages, onValueChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
            onClick={(e) => {
              e.preventDefault();

              if (page > 1) {
                onValueChange(page - 1);
              }
            }}
          />
        </PaginationItem>

        {getPages(page, totalPages).map((p, index) =>
          p === "..." ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                key={p}
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();

                  onValueChange(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            className={
              page === totalPages ? "pointer-events-none opacity-50" : ""
            }
            onClick={(e) => {
              e.preventDefault();

              if (page < totalPages) {
                onValueChange(page + 1);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
export { PaginationTable };
