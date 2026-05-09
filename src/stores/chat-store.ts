import { create } from 'zustand';
import { Message, ChatState } from '@/types';
import { generateId } from '@/lib/utils';

interface ChatStore extends ChatState {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateLastMessage: (content: string) => void;
  replaceLastMessage: (content: string) => void;
  removeLastMessage: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  abortController: AbortController | null;
  setAbortController: (controller: AbortController | null) => void;
  stopGeneration: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  abortController: null,

  addMessage: (message) => {
    const nextMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, nextMessage],
    }));

    return nextMessage;
  },

  updateLastMessage: (content) => set((state) => {
    const messages = [...state.messages];
    if (messages.length > 0) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content: messages[messages.length - 1].content + content,
      };
    }
    return { messages };
  }),

  replaceLastMessage: (content) => set((state) => {
    const messages = [...state.messages];
    if (messages.length > 0) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
      };
    }
    return { messages };
  }),

  removeLastMessage: () => set((state) => ({
    messages: state.messages.slice(0, -1),
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], error: null }),
  setMessages: (messages) => set({ messages }),

  setAbortController: (controller) => set({ abortController: controller }),

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, isLoading: false });
    }
  },
}));
