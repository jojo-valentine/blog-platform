import { cn } from "@/app/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white shadow-sm p-6",
        className
      )}
    >
      {children}
    </div>
  );
}