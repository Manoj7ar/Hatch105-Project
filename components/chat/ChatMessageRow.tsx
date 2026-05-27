import { ThinkingShimmer } from "./ThinkingShimmer";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { GroqAvatar } from "./GroqAvatar";
import { formatTeamText } from "./formatTeamText";
import type { TeamOption } from "@/lib/teams";

type ChatMessageRowProps = {
  messageId?: string;
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
  isStreaming?: boolean;
  teamTitles?: string[];
  teams?: TeamOption[];
};

export function ChatMessageRow({
  messageId,
  role,
  content,
  isThinking,
  isStreaming,
  teamTitles = [],
  teams = [],
}: ChatMessageRowProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end py-3">
        <div className="max-w-[min(85%,32rem)] rounded-[24px] bg-[#f4f4f4] px-4 py-2.5 text-[15px] leading-7 text-[#0d0d0d]">
          {formatTeamText(content, teamTitles, teams)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-3">
      <GroqAvatar />
      {isThinking ? (
        <ThinkingShimmer />
      ) : (
        <AssistantMarkdown
          content={content}
          messageId={messageId}
          isStreaming={isStreaming}
          teamTitles={teamTitles}
          teams={teams}
        />
      )}
    </div>
  );
}
