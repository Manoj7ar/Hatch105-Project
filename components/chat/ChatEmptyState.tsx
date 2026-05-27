import { CHAT_SUGGESTIONS } from "./constants";

type ChatEmptyStateProps = {
  onSuggestion: (text: string) => void;
  disabled?: boolean;
};

export function ChatEmptyState({ onSuggestion, disabled }: ChatEmptyStateProps) {
  return (
    <div className="relative min-h-0 w-full flex-1">
      <div className="absolute inset-x-0 top-0 bottom-[8.5rem] flex flex-col items-center justify-center px-4">
        <h2 className="mb-8 max-w-xl text-center text-2xl font-medium tracking-tight text-[#0d0d0d]">
          What would you like to know about the dataset?
        </h2>
      <p className="mb-6 text-sm text-[#8e8e8e]">
        Type <span className="font-medium text-[#0d0d0d]">@</span> in the message box to
        mention a team by name.
      </p>
      <div className="flex max-w-2xl flex-wrap items-center justify-center gap-2">
        {CHAT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onSuggestion(s)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#0d0d0d] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
