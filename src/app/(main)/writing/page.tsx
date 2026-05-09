'use client';

import { useAppStore } from '@/stores/app-store';
import { WritingContainer } from '@/components/writing/writing-container';

export default function WritingPage() {
  const { currentConversationId, conversations } = useAppStore();
  const currentConversation = conversations.find(c => c.id === currentConversationId);

  if (currentConversation?.mode !== 'writing') {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">✍️</div>
          <h3 className="text-lg font-medium mb-2">写作专家模式</h3>
          <p className="text-sm">请创建一个新的写作对话</p>
        </div>
      </div>
    );
  }

  return (
    <WritingContainer conversationId={currentConversationId} />
  );
}
