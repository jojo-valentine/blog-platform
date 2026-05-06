export default function BlogContentSkeleton() {
  return (
    <div className="space-y-3 mt-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded"
          style={{ width: `${80 - i * 5}%` }}
        />
      ))}
    </div>
  );
}
