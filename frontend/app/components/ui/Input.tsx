import { cn } from "@/app/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function InputWithLabel({ label, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className={cn(
          "rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
          className,
        )}
      />
    </div>
  );
}
