"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { formatTeamText } from "./formatTeamText";
import { ScoreCell, parseScoreValue } from "./ScoreCell";
import type { ReactNode } from "react";
import { CompareChips } from "./CompareChips";
import { StreamingMarkdown } from "./StreamingMarkdown";
import type { TeamOption } from "@/lib/teams";

function extractTeamNamesFromTables(content: string, teamTitles: string[]): string[] {
  const found: string[] = [];
  for (const title of teamTitles) {
    if (content.includes(title)) found.push(title);
  }
  return found;
}

function flattenToText(node: ReactNode): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenToText).join("");
  return "";
}

type AssistantMarkdownProps = {
  content: string;
  isStreaming?: boolean;
  messageId?: string;
  teamTitles?: string[];
  teams?: TeamOption[];
};

function TextWithRefs({
  children,
  teamTitles = [],
  teams = [],
}: {
  children?: React.ReactNode;
  teamTitles?: string[];
  teams?: { ref: string; title: string }[];
}) {
  if (typeof children === "string") {
    return <>{formatTeamText(children, teamTitles, teams)}</>;
  }
  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, i) =>
          typeof child === "string" ? (
            <span key={i}>{formatTeamText(child, teamTitles, teams)}</span>
          ) : (
            <span key={i}>{child}</span>
          )
        )}
      </>
    );
  }
  return <>{children}</>;
}

function buildComponents(
  teamTitles: string[],
  teams: { ref: string; title: string }[]
): Components {
  const wrap = (children: React.ReactNode) => (
    <TextWithRefs teamTitles={teamTitles} teams={teams}>
      {children}
    </TextWithRefs>
  );
  return {
    h2: ({ children }) => (
      <h2 className="mb-3 mt-6 text-lg font-semibold tracking-tight text-[#0d0d0d] first:mt-0">
        {wrap(children)}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-base font-semibold text-[#0d0d0d]">
        {wrap(children)}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 leading-7 text-[#0d0d0d] last:mb-0">{wrap(children)}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 list-disc space-y-2 pl-5 leading-7 text-[#0d0d0d]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-2 pl-5 leading-7 text-[#0d0d0d]">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{wrap(children)}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-[#0d0d0d]">{wrap(children)}</strong>
    ),
    code: ({ children }) => (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
        {children}
      </code>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mb-4 border-l-4 border-slate-200 pl-4 text-slate-600">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="chat-markdown-table-wrap mb-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[320px] border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-slate-200 bg-slate-50/90">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {wrap(children)}
      </th>
    ),
    td: ({ children }) => {
      const text = flattenToText(children);
      const showBar = text.length > 0 && parseScoreValue(text) !== null;
      return (
        <td className="border-t border-slate-100 px-4 py-3 align-middle text-slate-800">
          {showBar ? (
            <ScoreCell>{text}</ScoreCell>
          ) : (
            wrap(children)
          )}
        </td>
      );
    },
    tr: ({ children }) => (
      <tr className="transition-colors hover:bg-slate-50/50">{children}</tr>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    hr: () => <hr className="my-6 border-slate-200" />,
  };
}

export function AssistantMarkdown({
  content,
  isStreaming = false,
  messageId,
  teamTitles = [],
  teams = [],
}: AssistantMarkdownProps) {
  const components = buildComponents(teamTitles, teams);
  const compareTitles = extractTeamNamesFromTables(content, teamTitles);

  if (!content.trim() && !isStreaming) {
    return null;
  }

  return (
    <div
      className={cn(
        "chat-markdown min-w-0 flex-1 text-[15px] text-[#0d0d0d]",
        isStreaming && "streaming"
      )}
    >
      {isStreaming && content.trim() ? (
        <StreamingMarkdown
          content={content}
          isStreaming={isStreaming}
          messageId={messageId}
          components={components}
        />
      ) : content.trim() ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      ) : null}
      {!isStreaming && teams.length > 0 && compareTitles.length >= 2 && (
        <CompareChips teams={teams} titlesInMessage={compareTitles} />
      )}
    </div>
  );
}
