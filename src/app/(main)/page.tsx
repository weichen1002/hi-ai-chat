'use client';

import { useAppStore } from '@/stores/app-store';
import { ChatContainer } from '@/components/chat/chat-container';
import { WritingContainer } from '@/components/writing/writing-container';

export default function HomePage() {
  const { currentConversationId, conversations, activeMode } = useAppStore();
  const currentConversation = conversations.find(c => c.id === currentConversationId);

  // If current conversation mode doesn't match active mode, show appropriate container
  if (activeMode === 'writing' && currentConversation?.mode === 'writing') {
    return <WritingContainer conversationId={currentConversationId} />;
  }

  return <ChatContainer conversationId={currentConversationId} />;
}
