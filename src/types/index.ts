export type AppMode = 'chat' | 'writing';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  mode: AppMode;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  isAvailable: boolean;
}

export interface WritingPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  icon: string;
}

export interface AppState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  activeMode: AppMode;
  theme: 'dark' | 'light';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface WritingState {
  prompts: WritingPrompt[];
  selectedPrompt: WritingPrompt | null;
  isGenerating: boolean;
}
