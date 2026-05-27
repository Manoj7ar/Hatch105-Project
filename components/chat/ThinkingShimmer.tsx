"use client";

export function ThinkingShimmer() {
  return (
    <div
      className="thinking-indicator flex min-w-0 flex-1 flex-col gap-3 py-0.5"
      role="status"
      aria-live="polite"
      aria-label="Thinking"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[15px] font-medium tracking-tight text-[var(--groq-orange)]">
          Thinking
        </span>
        <span className="thinking-dots inline-flex items-center gap-0.5 pt-0.5" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="flex flex-col gap-2 pl-0.5">
        <div className="thinking-skeleton h-2.5 w-[min(100%,20rem)] rounded-full" />
        <div className="thinking-skeleton h-2.5 w-[min(100%,14rem)] rounded-full [animation-delay:120ms]" />
        <div className="thinking-skeleton h-2.5 w-[min(100%,9rem)] rounded-full [animation-delay:240ms]" />
      </div>
    </div>
  );
}
