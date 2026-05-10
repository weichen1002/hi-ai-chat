import { create } from 'zustand';

interface ChatStore {
  isLoading: boolean;
  error: string | null;
  abortController: AbortController | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  stopGeneration: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isLoading: false,
  error: null,
  abortController: null,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setAbortController: (controller) => set({ abortController: controller }),

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, isLoading: false });
    }
  },
}));
