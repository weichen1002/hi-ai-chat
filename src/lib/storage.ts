import { AppMode, Conversation } from '@/types';
import {
  getDefaultOutputMode,
  getDefaultTemperature,
  getDefaultTimeoutMs,
  isOutputMode,
  normalizeTemperature,
  normalizeTimeoutMs,
} from '@/lib/chat-config';

const STORAGE_KEY = 'hi-ai-chat-conversations';
const SESSION_KEY = 'hi-ai-chat-session';
const DB_NAME = 'hi-ai-chat-db';
const DB_VERSION = 1;
const STORE_NAME = 'app';
const CONVERSATIONS_RECORD_KEY = 'conversations';
const SAVE_DEBOUNCE_MS = 800;

interface PersistedSession {
  currentConversationId: string | null;
}

interface StoredConversationsRecord {
  key: typeof CONVERSATIONS_RECORD_KEY;
  conversations: Conversation[];
}

let pendingConversations: Conversation[] | null = null;
let saveTimer: number | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function normalizeConversations(conversations: Conversation[]): Conversation[] {
  return conversations.map((conversation) => ({
    ...conversation,
    model: conversation.model || 'gpt-5.5',
    mode: conversation.mode === 'writing' ? 'writing' : 'chat',
    temperature: normalizeConversationTemperature(conversation),
    outputMode: normalizeConversationOutputMode(conversation),
    timeoutMs: normalizeConversationTimeout(conversation),
  }));
}

function getConversationMode(conversation: Conversation): AppMode {
  return conversation.mode === 'writing' ? 'writing' : 'chat';
}

function normalizeConversationTemperature(conversation: Conversation): number | null {
  return normalizeTemperature(conversation.temperature ?? getDefaultTemperature());
}

function normalizeConversationOutputMode(conversation: Conversation) {
  return isOutputMode(conversation.outputMode) ? conversation.outputMode : getDefaultOutputMode();
}

function normalizeConversationTimeout(conversation: Conversation): number {
  const mode = getConversationMode(conversation);
  return normalizeTimeoutMs(conversation.timeoutMs ?? getDefaultTimeoutMs(mode), mode);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }

    if (!window.indexedDB) {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('打开 IndexedDB 失败'));
  });
}

async function readConversationsFromIndexedDb(): Promise<Conversation[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(CONVERSATIONS_RECORD_KEY);

    request.onsuccess = () => {
      const record = request.result as StoredConversationsRecord | undefined;
      resolve(normalizeConversations(record?.conversations || []));
    };

    request.onerror = () => {
      reject(request.error ?? new Error('读取 IndexedDB 数据失败'));
    };

    transaction.oncomplete = () => {
      database.close();
    };

    transaction.onerror = () => {
      database.close();
    };
  });
}

async function writeConversationsToIndexedDb(conversations: Conversation[]): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.put({
      key: CONVERSATIONS_RECORD_KEY,
      conversations,
    } satisfies StoredConversationsRecord);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('写入 IndexedDB 数据失败'));
    };
  });
}

function loadLegacyConversations(): Conversation[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return normalizeConversations(JSON.parse(stored) as Conversation[]);
  } catch (error) {
    console.error('加载旧版本地对话失败:', error);
    return [];
  }
}

function saveLegacyConversations(conversations: Conversation[]): void {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('回退保存本地对话失败:', error);
  }
}

function clearLegacyConversations(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清理旧版本地对话失败:', error);
  }
}

export async function loadConversations(): Promise<Conversation[]> {
  if (!isBrowser()) return [];

  try {
    const indexedDbConversations = await readConversationsFromIndexedDb();
    if (indexedDbConversations.length > 0) {
      return indexedDbConversations;
    }

    const legacyConversations = loadLegacyConversations();
    if (legacyConversations.length > 0) {
      await writeConversationsToIndexedDb(legacyConversations);
      clearLegacyConversations();
    }

    return legacyConversations;
  } catch (error) {
    console.error('加载对话失败:', error);
    return loadLegacyConversations();
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (!isBrowser()) return;

  pendingConversations = conversations;

  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }

  saveTimer = window.setTimeout(() => {
    void flushConversationSave();
  }, SAVE_DEBOUNCE_MS);
}

export async function flushConversationSave(): Promise<void> {
  if (!isBrowser() || !pendingConversations) return;

  const conversationsToSave = pendingConversations;
  pendingConversations = null;

  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }

  try {
    await writeConversationsToIndexedDb(conversationsToSave);
    clearLegacyConversations();
  } catch (error) {
    console.error('保存对话失败:', error);
    saveLegacyConversations(conversationsToSave);
  }
}

export function saveCurrentConversationId(currentConversationId: string | null): void {
  if (!isBrowser()) return;

  try {
    const session: PersistedSession = { currentConversationId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('保存会话状态失败:', error);
  }
}

export function loadCurrentConversationId(): string | null {
  if (!isBrowser()) return null;

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
