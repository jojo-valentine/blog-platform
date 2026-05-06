export default function BlogGallerySkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="h-5 w-24 bg-muted rounded mb-4" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-full aspect-square bg-muted rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}