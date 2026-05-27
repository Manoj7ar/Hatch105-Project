import { AppHeader } from "@/components/AppHeader";
import { ChatInterface } from "@/components/ChatInterface";

export const metadata = {
  title: "Ask dataset · Hatch105",
  description: "Chat grounded on the Hatch105 thesis ranking dataset",
};

export default function ChatPage() {
  return (
    <div className="flex h-dvh flex-col bg-white">
      <AppHeader fullWidth />
      <main className="flex min-h-0 flex-1 flex-col">
        <ChatInterface />
      </main>
    </div>
  );
}
