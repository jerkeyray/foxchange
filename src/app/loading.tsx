export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="h-9 w-72 bg-muted/50 rounded-xl shimmer mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="h-[480px] bg-muted/30 rounded-2xl shimmer" />
        <div className="space-y-4">
          <div className="h-36 bg-muted/30 rounded-2xl shimmer" />
          <div className="h-72 bg-muted/30 rounded-2xl shimmer" />
        </div>
      </div>
    </div>
  );
}
