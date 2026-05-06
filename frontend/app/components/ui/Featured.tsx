import React from "react";
import { cn } from "@/app/lib/utils";
type FeaturedProps = {
  title: string;
  description: string;
  author: string;
  date: string;
  imageUrl: string;
  imageClassName?: string;
} & React.HTMLAttributes<HTMLElement>;
export default function Featured({
  title,
  description,
  author,
  date,
  imageUrl,
  className,
  imageClassName,
  ...props
}: FeaturedProps) {
  return (
    <section
      className={cn(
        "relative group overflow-hidden rounded-xl cursor-pointer",
        className,
      )}
      {...props}
    >
      {/* 🔥 Image */}
      <div className="relative overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className={cn(
            "w-full aspect-[16/9] object-cover transition-transform duration-500",
            "group-hover:scale-105",
            imageClassName,
          )}
          onError={(e) => {
            e.currentTarget.src = "/default/fallback/default-placeholder.png";
          }}
        />

        {/* 🔥 Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition" />

        {/* 🔥 Text บนรูป */}
        <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
          <span className="text-xs bg-white/20 backdrop-blur px-2 py-1 rounded">
            FEATURED
          </span>

          <h2 className="text-xl md:text-2xl font-bold line-clamp-2">
            {title}
          </h2>

          <p className="text-sm text-white/80 line-clamp-2">{description}</p>

          <div className="flex gap-3 text-xs text-white/70 pt-1">
            <span>👤 {author || "Unknown"}</span>
            <span>📅 {new Date(date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
