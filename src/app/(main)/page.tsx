'use client';

import { useAppStore } from '@/stores/app-store';
import { ChatContainer } from '@/components/chat/chat-container';
import { WritingContainer } from '@/components/writing/writing-container';

export default function HomePage() {
  const { currentConversationId, conversations, activeMode } = useAppStore();
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const activeConversationId = currentConversation?.mode === activeMode ? currentConversationId : null;

  if (activeMode === 'writing') {
    return <WritingContainer conversationId={activeConversationId} />;
  }

  return <ChatContainer conversationId={activeConversationId} />;
}
