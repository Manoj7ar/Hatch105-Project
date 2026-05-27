"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatEmptyState } from "./chat/ChatEmptyState";
import { ChatMessageRow } from "./chat/ChatMessageRow";
import type { TeamOption } from "@/lib/teams";
import { ScoreHandoffModal } from "./chat/ScoreHandoffModal";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentionPrefillRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [composerFocusToken, setComposerFocusToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAssistantId, setPendingAssistantId] = useState<string | null>(
    null
  );
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreModalText, setScoreModalText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data: { teams?: TeamOption[] }) => {
        if (data.teams) setTeams(data.teams);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (teams.length === 0) return;

    const refParam = searchParams.get("ref")?.trim();
    const qParam = searchParams.get("q")?.trim();
    const prefillKey = refParam ? `ref:${refParam.toUpperCase()}` : qParam ? `q:${qParam}` : null;

    if (!prefillKey || mentionPrefillRef.current === prefillKey) return;

    let mentionText: string | null = null;

    if (refParam) {
      const team = teams.find(
        (t) => t.ref.toUpperCase() === refParam.toUpperCase()
      );
      if (team) mentionText = `@${team.title} `;
    } else if (qParam) {
      mentionText = qParam.endsWith(" ") ? qParam : `${qParam} `;
    }

    if (!mentionText) return;

    mentionPrefillRef.current = prefillKey;
    setInput(mentionText);
    setComposerFocusToken((n) => n + 1);
    router.replace("/chat", { scroll: false });
  }, [teams, searchParams, router]);

  const teamTitles = teams.map((t) => t.title);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      if (
        /^\/score\b/i.test(trimmed) ||
        /^score this idea/i.test(trimmed) ||
        (trimmed.startsWith("{") && trimmed.includes('"ref"'))
      ) {
        const body = trimmed.replace(/^\/score\s*/i, "").trim();
        setScoreModalText(body.startsWith("{") ? body : "");
        setScoreModalOpen(true);
        return;
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setError(null);
      setLoading(true);

      const assistantId = crypto.randomUUID();
      setPendingAssistantId(assistantId);
      setMessages((m) => [
        ...m,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ?? `Request failed (${res.status})`
          );
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId ? { ...msg, content: accumulated } : msg
            )
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setMessages((m) => m.filter((msg) => msg.id !== assistantId));
      } finally {
        setLoading(false);
        setPendingAssistantId(null);
      }
    },
    [loading, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setInput("");
  }, []);

  const lastAssistantId =
    [...messages].reverse().find((m) => m.role === "assistant")?.id ?? null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      >
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestion={send} disabled={loading} />
        ) : (
          <div className="mx-auto w-full max-w-3xl px-4 pb-40 pt-4">
            {messages.map((msg) => {
              const isPendingAssistant = msg.id === pendingAssistantId;
              const isThinking =
                loading && isPendingAssistant && !msg.content;
              const isStreaming =
                loading &&
                msg.role === "assistant" &&
                msg.id === lastAssistantId &&
                !!msg.content;

              return (
                <ChatMessageRow
                  key={msg.id}
                  messageId={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isThinking={isThinking}
                  isStreaming={isStreaming}
                  teamTitles={teamTitles}
                  teams={teams}
                />
              );
            })}
            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      {error && (
        <div className="absolute left-0 right-0 top-14 z-10 mx-auto max-w-3xl px-4">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      <div className="composer-fade pointer-events-none absolute bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 h-16" />

      <div className="absolute bottom-0 left-0 right-0 bg-white pt-2">
        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={() => send(input)}
          loading={loading}
          showClear={messages.length > 0}
          onClear={clearChat}
          teams={teams}
          focusToken={composerFocusToken}
          onScoreIdea={() => setScoreModalOpen(true)}
        />
      </div>

      {scoreModalOpen && (
        <ScoreHandoffModal
          initialText={scoreModalText}
          onClose={() => {
            setScoreModalOpen(false);
            setScoreModalText("");
          }}
        />
      )}
    </div>
  );
}
