import { create } from 'zustand';
import { Conversation, AppState } from '@/types';
import { generateId } from '@/lib/utils';
import { saveConversations, loadConversations } from '@/lib/storage';

interface AppStore extends AppState {
  createConversation: (mode?: 'chat' | 'writing') => string;
  setCurrentConversation: (id: string | null) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  addMessageToConversation: (conversationId: string, message: { role: 'user' | 'assistant' | 'system'; content: string; model?: string }) => void;
  loadConversations: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveMode: (mode: 'chat' | 'writing') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
  sidebarOpen: true,
  activeMode: 'chat' as 'chat' | 'writing',
  theme: 'dark' as 'dark' | 'light',

  createConversation: (mode = 'chat') => {
    const id = generateId();
    const newConversation: Conversation = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gpt-5.4',
      mode,
    };

    set((state) => {
      const conversations = [newConversation, ...state.conversations];
      saveConversations(conversations);
      return { conversations, currentConversationId: id };
    });

    return id;
  },

  setCurrentConversation: (id) => set({ currentConversationId: id }),

  updateConversation: (id, updates) => set((state) => {
    const conversations = state.conversations.map(conv =>
      conv.id === id ? { ...conv, ...updates, updatedAt: Date.now() } : conv
    );
    saveConversations(conversations);
    return { conversations };
  }),

  deleteConversation: (id) => set((state) => {
    const conversations = state.conversations.filter(conv => conv.id !== id);
    saveConversations(conversations);
    const currentConversationId = state.currentConversationId === id
      ? (conversations[0]?.id || null)
      : state.currentConversationId;
    return { conversations, currentConversationId };
  }),

  addMessageToConversation: (conversationId, message) => set((state) => {
    const conversations = state.conversations.map(conv => {
      if (conv.id !== conversationId) return conv;
      return {
        ...conv,
        messages: [...conv.messages, {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        }],
        updatedAt: Date.now(),
      };
    });
    saveConversations(conversations);
    return { conversations };
  }),

  loadConversations: () => {
    const conversations = loadConversations();
    set({ 
      conversations,
      currentConversationId: conversations.length > 0 ? conversations[0].id : null
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveMode: (mode) => set({ activeMode: mode }),
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    }
    return { theme: newTheme };
  }),
}));
