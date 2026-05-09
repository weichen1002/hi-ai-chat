import { Conversation } from '@/types';

const STORAGE_KEY = 'hi-ai-chat-conversations';
const SESSION_KEY = 'hi-ai-chat-session';

interface PersistedSession {
  currentConversationId: string | null;
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('保存对话失败:', error);
  }
}

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Conversation[];
    return parsed.map((conversation) => ({
      ...conversation,
      model: conversation.model || 'gpt-5.5',
      mode: conversation.mode === 'writing' ? 'writing' : 'chat',
    }));
  } catch (error) {
    console.error('加载对话失败:', error);
    return [];
  }
}

export function deleteConversation(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const conversations = loadConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    saveConversations(filtered);
  } catch (error) {
    console.error('删除对话失败:', error);
  }
}

export function updateConversation(updated: Conversation): void {
  if (typeof window === 'undefined') return;
  try {
    const conversations = loadConversations();
    const index = conversations.findIndex(conv => conv.id === updated.id);
    if (index !== -1) {
      conversations[index] = updated;
    } else {
      conversations.unshift(updated);
    }
    saveConversations(conversations);
  } catch (error) {
    console.error('更新对话失败:', error);
  }
}

export function saveCurrentConversationId(currentConversationId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const session: PersistedSession = { currentConversationId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('保存会话状态失败:', error);
  }
}

export function loadCurrentConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedSession;
    return typeof parsed.currentConversationId === 'string' ? parsed.currentConversationId : null;
  } catch (error) {
    console.error('加载会话状态失败:', error);
    return null;
  }
}
