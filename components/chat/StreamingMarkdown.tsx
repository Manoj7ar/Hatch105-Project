"use client";

import { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { splitStreamBlocks } from "./splitStreamBlocks";

type StreamingMarkdownProps = {
  content: string;
  isStreaming: boolean;
  messageId?: string;
  components: Components;
  className?: string;
};

export function StreamingMarkdown({
  content,
  isStreaming,
  messageId,
  components,
  className,
}: StreamingMarkdownProps) {
  const blocks = useMemo(() => splitStreamBlocks(content), [content]);
  const revealedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    revealedRef.current = new Set();
  }, [messageId]);

  useEffect(() => {
    if (!isStreaming) {
      blocks.forEach((_, i) => revealedRef.current.add(i));
    }
  }, [isStreaming, blocks.length, blocks]);

  return (
    <div className={cn("stream-markdown", className)}>
      {blocks.map((block, index) => {
        const isLast = index === blocks.length - 1;
        const isGrowing = isStreaming && isLast;
        const wasRevealed = revealedRef.current.has(index);
        const shouldReveal =
          !isGrowing && !wasRevealed && block.trim().length > 0;

        if (shouldReveal) {
          revealedRef.current.add(index);
        }

        return (
          <div
            key={`${messageId ?? "msg"}-${index}`}
            className={cn(
              "stream-block",
              isGrowing && "stream-block-growing",
              wasRevealed && !isGrowing && "stream-block-done",
              shouldReveal && "stream-block-revealed"
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {block}
            </ReactMarkdown>
          </div>
        );
      })}
      {isStreaming && (
        <span
          className="stream-cursor ml-0.5 inline-block text-[#0d0d0d]"
          aria-hidden
        />
      )}
    </div>
  );
}
