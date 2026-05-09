import { Conversation } from '@/types';

const STORAGE_KEY = 'hi-ai-chat-conversations';

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
    return JSON.parse(stored);
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
