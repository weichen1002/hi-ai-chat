import { create } from 'zustand';
import { AppMode, Conversation, AppState, Message } from '@/types';
import { generateId } from '@/lib/utils';
import { saveConversations, loadConversations, saveCurrentConversationId, loadCurrentConversationId } from '@/lib/storage';
import { getDefaultOutputMode, getDefaultTemperature, getDefaultTimeoutMs } from '@/lib/chat-config';

interface AppStore extends AppState {
  createConversation: (mode?: AppMode) => string;
  setCurrentConversation: (id: string | null) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  addMessageToConversation: (conversationId: string, message: { id?: string; timestamp?: number; role: 'user' | 'assistant' | 'system'; content: string; model?: string }) => Message;
  updateLastMessageInConversation: (conversationId: string, content: string) => void;
  removeLastMessageFromConversation: (conversationId: string) => void;
  loadConversations: () => Promise<Conversation[]>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveMode: (mode: AppMode) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

function createDraftConversation(mode: AppMode): Conversation {
  return {
    id: generateId(),
    title: '新对话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: 'gpt-5.5',
    mode,
    temperature: getDefaultTemperature(),
    outputMode: getDefaultOutputMode(),
    timeoutMs: getDefaultTimeoutMs(mode),
  };
}

export const useAppStore = create<AppStore>((set) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
  sidebarOpen: false,
  activeMode: 'chat' as AppMode,
  theme: 'light' as 'dark' | 'light',

  createConversation: (mode = 'chat') => {
    const newConversation = createDraftConversation(mode);

    set((state) => {
      const conversations = [newConversation, ...state.conversations];
      saveConversations(conversations);
      saveCurrentConversationId(newConversation.id);
      return {
        conversations,
        currentConversationId: newConversation.id,
        activeMode: mode,
      };
    });

    return newConversation.id;
  },

  setCurrentConversation: (id) => set((state) => {
    saveCurrentConversationId(id);
    const currentConversation = state.conversations.find((conversation) => conversation.id === id);
    return {
      currentConversationId: id,
      activeMode: currentConversation?.mode || state.activeMode,
    };
  }),

  updateConversation: (id, updates) => set((state) => {
    const conversations = state.conversations.map(conv =>
      conv.id === id ? { ...conv, ...updates, updatedAt: Date.now() } : conv
    );
    saveConversations(conversations);
    return { conversations };
  }),

  deleteConversation: (id) => set((state) => {
    const remainingConversations = state.conversations.filter(conv => conv.id !== id);
    const conversations = remainingConversations.length > 0
      ? remainingConversations
      : [createDraftConversation(state.activeMode)];
    saveConversations(conversations);
    const currentConversationId = state.currentConversationId === id
      ? conversations[0].id
      : state.currentConversationId;
    saveCurrentConversationId(currentConversationId);
    return {
      conversations,
      currentConversationId,
      activeMode: conversations.find((conversation) => conversation.id === currentConversationId)?.mode || state.activeMode,
    };
  }),

  addMessageToConversation: (conversationId, message) => {
    const nextMessage: Message = {
      ...message,
      id: message.id || generateId(),
      timestamp: message.timestamp || Date.now(),
    };

    set((state) => {
      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        return {
          ...conversation,
          messages: [...conversation.messages, nextMessage],
          updatedAt: Date.now(),
        };
      });
      saveConversations(conversations);
      return { conversations };
    });

    return nextMessage;
  },

  updateLastMessageInConversation: (conversationId, content) => set((state) => {
    const conversations = state.conversations.map((conversation) => {
      if (conversation.id !== conversationId || conversation.messages.length === 0) {
        return conversation;
      }

      const messages = [...conversation.messages];
      const lastMessage = messages[messages.length - 1];
      messages[messages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + content,
      };

      return {
        ...conversation,
        messages,
        updatedAt: Date.now(),
      };
    });

    saveConversations(conversations);
    return { conversations };
  }),

  removeLastMessageFromConversation: (conversationId) => set((state) => {
    const conversations = state.conversations.map((conversation) => {
      if (conversation.id !== conversationId || conversation.messages.length === 0) {
        return conversation;
      }

      return {
        ...conversation,
        messages: conversation.messages.slice(0, -1),
        updatedAt: Date.now(),
      };
    });

    saveConversations(conversations);
    return { conversations };
  }),

  loadConversations: async () => {
    const conversations = await loadConversations();
    const savedCurrentConversationId = loadCurrentConversationId();
    const currentConversationId = savedCurrentConversationId && conversations.some((conversation) => conversation.id === savedCurrentConversationId)
      ? savedCurrentConversationId
      : (conversations[0]?.id || null);
    const activeMode = conversations.find((conversation) => conversation.id === currentConversationId)?.mode || 'chat';

    set({
      conversations,
      currentConversationId,
      activeMode,
    });

    saveCurrentConversationId(currentConversationId);
    return conversations;
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveMode: (mode) => set((state) => {
    const matchingConversation = state.conversations.find((conversation) => conversation.mode === mode);

    if (matchingConversation) {
      saveCurrentConversationId(matchingConversation.id);
      return {
        activeMode: mode,
        currentConversationId: matchingConversation.id,
      };
    }

    const newConversation = createDraftConversation(mode);
    const conversations = [newConversation, ...state.conversations];
    saveConversations(conversations);
    saveCurrentConversationId(newConversation.id);

    return {
      activeMode: mode,
      conversations,
      currentConversationId: newConversation.id,
    };
  }),
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
