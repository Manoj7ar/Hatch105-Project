export function ThinkingShimmer() {
  return (
    <div className="flex flex-col gap-2.5 py-1" aria-label="Thinking">
      <div className="shimmer-bar h-3 w-[92%] rounded-full" />
      <div className="shimmer-bar h-3 w-[78%] rounded-full" />
      <div className="shimmer-bar h-3 w-[55%] rounded-full" />
    </div>
  );
}
