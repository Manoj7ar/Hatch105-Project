import type { ReactNode } from "react";

const REF_PATTERN = /(\*\*)?(H-\d{2})(\*\*)?/g;

export function formatRefText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(REF_PATTERN.source, "g");

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const ref = match[2];
    parts.push(
      <span
        key={`${ref}-${match.index}`}
        className="font-mono text-xs font-medium text-slate-700"
      >
        {ref}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
