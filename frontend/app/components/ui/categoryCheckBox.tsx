import * as React from "react";
import { cn } from "@/app/lib/utils";
import { Input } from "./input";
import { Label } from "./label";

type Category = { _id: string; name: string };
type Props = {
  value: string[];
  onValueChange: (value: string[]) => void; // 👈 เปลี่ยนชื่อ
  categories: Category[];
} & React.HTMLAttributes<HTMLDivElement>;

const CategoryCheckBox = React.forwardRef<HTMLDivElement, Props>(
  ({ className, value, categories, onValueChange, ...props }, ref) => {
    const toggleCategory = (id: string) => {
      if (!value) return;

      if (value.includes(id)) {
        onValueChange(value.filter((v) => v !== id));
      } else {
        onValueChange([...value, id]);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2", className)}
        {...props}
      >
        {categories.map((cat) => {
          const checked = value.includes(cat._id);

          return (
            <label
              key={cat._id}
              htmlFor={cat._id}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer transition border",
                checked
                  ? "bg-blue-500 text-white border-blue-500"
                  : "hover:bg-muted/30",
              )}
            >
              <input
                id={cat._id}
                type="checkbox"
                checked={checked}
                onChange={() => toggleCategory(cat._id)}
                className="accent-blue-500 cursor-pointer"
              />
              <span>{cat.name}</span>
            </label>
          );
        })}
      </div>
    );
  },
);
CategoryCheckBox.displayName = "CategorySelect";

export { CategoryCheckBox };
