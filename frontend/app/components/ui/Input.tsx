import { cn } from "@/app/lib/utils";
import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

const InputOTPSlot = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      maxLength={1}
      className={cn(
        "w-14 h-14 text-center text-2xl font-extrabold text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded p-4 outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
        className,
      )}
      {...props}
    />
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

export function InputWithLabel({ label, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-gray-300 text-black dark:bg-gray-800 dark:text-white  px-3 py-2 text-base ring-offset-background  file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground   placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50  md:text-sm",
          className,
        )}
      />
    </div>
  );
}
export { Input, InputOTPSlot };
