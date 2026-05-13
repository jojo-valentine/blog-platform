import * as React from "react";
import { cn } from "@/app/lib/utils";
import { Input } from "./input";
import { Label } from "./label";
type Category = {
  _id: string;
  name: string;
};

type Props = {
  categories: Category[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function CategoryCheckbox({ categories, value, onChange }: Props) {
  const handleToggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const checked = value.includes(cat._id);

        return (
          <label
            key={cat._id}
            className={`
              cursor-pointer
              rounded-lg
              border
              px-3
              py-2
              transition
              flex
              items-center
              gap-2
              ${
                checked
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border  hover:border-foreground/30"
              }
            `}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleToggle(cat._id)}
              className="hidden"
            />

            <span
              className={`
                flex
                h-4
                w-4
                items-center
                justify-center
                rounded
                border
               
                text-xs
                ${checked ? "bg-primary text-primary-foreground " : ""}
              `}
            >
              {checked && "✓"}
            </span>

            <span className="text-sm">{cat.name}</span>
          </label>
        );
      })}
    </div>
  );
}
