import { cn } from "@/app/lib/admin/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

type TableSkeletonProps = {
  length?: number;
  colSpan?: number;
};

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
function EditSkeleton() {
  return (
    <div className="container max-w-4xl py-10 space-y-6 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-9 w-32 bg-muted rounded" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-28 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 bg-muted rounded-lg" />
        </CardContent>
        <CardHeader>
          <div className="h-5 w-20 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-12 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-40 w-full bg-muted rounded" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="h-12 w-full bg-muted rounded" />
    </div>
  );
}

function TableSkeleton({ length = 5, colSpan = 5 }: TableSkeletonProps) {
  return Array.from({ length }).map((_, i) => (
    <tr key={i}>
      <td colSpan={colSpan}>
        <div className="flex items-center gap-4 rounded-lg border border-border p-4">
          {/* Cover */}
          <Skeleton className="h-16 w-16 rounded-md" />

          {/* Title */}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-32" />
          </div>

          {/* Tags */}
          <div className="hidden md:flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Status */}
          <Skeleton className="h-6 w-20 rounded-full" />

          {/* Date */}
          <Skeleton className="h-4 w-28" />

          {/* Actions */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </td>
    </tr>
  ));
}

export { Skeleton, EditSkeleton, TableSkeleton };
