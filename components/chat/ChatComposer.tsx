"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamOption } from "@/lib/teams";
import {
  findTeamsByPrefixFrom,
  getMentionState,
} from "@/lib/teams-mention";
import { MentionAutocomplete } from "./MentionAutocomplete";

const MAX_TEXTAREA_HEIGHT = 200;

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
  showClear?: boolean;
  onClear?: () => void;
  teams: TeamOption[];
  onScoreIdea?: () => void;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  loading,
  showClear,
  onClear,
  teams,
  onScoreIdea,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const teamsWithKeys = useMemo(
    () =>
      teams.map((t) => ({
        ...t,
        searchKey:
          t.searchKey ??
          t.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
      })),
    [teams]
  );

  const filteredTeams = useMemo(
    () => findTeamsByPrefixFrom(mentionQuery, teamsWithKeys, 8),
    [mentionQuery, teamsWithKeys]
  );

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const syncMention = useCallback(
    (text: string, caretIndex: number) => {
      const state = getMentionState(text, caretIndex, teamsWithKeys);
      if (state) {
        setMentionActive(true);
        setMentionStart(state.start);
        setMentionQuery(state.query);
        setActiveIndex(0);
      } else {
        setMentionActive(false);
        setMentionQuery("");
      }
      setCaret(caretIndex);
    },
    [teamsWithKeys]
  );

  const insertMention = useCallback(
    (team: TeamOption) => {
      const before = value.slice(0, mentionStart);
      const after = value.slice(caret);
      const next = `${before}@${team.title} ${after}`;
      const newCaret = mentionStart + team.title.length + 2;
      onChange(next);
      setMentionActive(false);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(newCaret, newCaret);
          setCaret(newCaret);
        }
      });
    },
    [value, mentionStart, caret, onChange]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionActive && filteredTeams.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filteredTeams.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (i) => (i - 1 + filteredTeams.length) % filteredTeams.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredTeams[activeIndex] ?? filteredTeams[0]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionActive(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !loading) onSend();
    }
  };

  const canSend = value.trim().length > 0 && !loading;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div className="chat-composer-shell relative flex items-end rounded-[28px] border bg-white">
        {mentionActive && (
          <MentionAutocomplete
            teams={filteredTeams}
            activeIndex={activeIndex}
            onSelect={insertMention}
            onHover={setActiveIndex}
          />
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            syncMention(e.target.value, e.target.selectionStart ?? 0);
          }}
          onClick={(e) =>
            syncMention(
              e.currentTarget.value,
              e.currentTarget.selectionStart ?? 0
            )
          }
          onKeyUp={(e) =>
            syncMention(
              e.currentTarget.value,
              e.currentTarget.selectionStart ?? 0
            )
          }
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Message… type @ to mention a team"
          disabled={loading}
          aria-autocomplete={mentionActive ? "list" : undefined}
          aria-controls={mentionActive ? "mention-listbox" : undefined}
          className="max-h-[200px] min-h-[52px] flex-1 resize-none bg-transparent py-3.5 pl-4 pr-14 text-[15px] leading-6 text-[#0d0d0d] placeholder:text-[#8e8e8e] focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "chat-composer-send",
            canSend ? "chat-composer-send--ready" : "chat-composer-send--disabled"
          )}
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <p className="text-center text-xs text-[#8e8e8e]">
          Answers use only the Hatch105 thesis dataset. Use @ for team names.
        </p>
        <div className="flex shrink-0 gap-3">
          {onScoreIdea && (
            <button
              type="button"
              onClick={onScoreIdea}
              className="text-xs font-medium text-[var(--groq-orange)] hover:text-[var(--groq-orange-hover)]"
            >
              Score this idea
            </button>
          )}
          {showClear && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-[#8e8e8e] hover:text-[#0d0d0d]"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
