import { ChatClient } from "@/components/chat-client";

export default function ChatPage() {
  return (
    <div className="flex min-h-[calc(100dvh-8.5rem)] flex-col p-4 pb-10 md:min-h-[calc(100dvh-7.5rem)] md:p-6">
      <ChatClient />
    </div>
  );
}
