import { create } from 'zustand';
import type {
  ChatChannel,
  ChatMessage,
  DmThread,
  ChatDmMessage,
  UnreadCount,
} from '@/types/chat';

// ============================================
// Store Interface
// ============================================

interface ChatStore {
  // Active navigation state
  activeChannelId: string | null;
  activeDmThreadId: string | null;

  // Data
  channels: ChatChannel[];
  dmThreads: DmThread[];
  channelMessages: Map<string, ChatMessage[]>;
  dmMessages: Map<string, ChatDmMessage[]>;
  unreadCounts: Map<string, number>;

  // UI state
  sidebarView: 'channels' | 'dms';
  memberSidebarOpen: boolean;
  replyingTo: ChatMessage | ChatDmMessage | null;

  // Loading states
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: Map<string, boolean>;

  // Actions — navigation
  setActiveChannel: (id: string | null) => void;
  setActiveDmThread: (id: string | null) => void;
  setSidebarView: (view: 'channels' | 'dms') => void;
  setMemberSidebarOpen: (open: boolean) => void;
  setReplyingTo: (message: ChatMessage | ChatDmMessage | null) => void;

  // Actions — data
  setChannels: (channels: ChatChannel[]) => void;
  setDmThreads: (threads: DmThread[]) => void;
  setUnreadCounts: (counts: UnreadCount[]) => void;
  decrementUnread: (id: string) => void;

  // Actions — channel messages
  setChannelMessages: (channelId: string, messages: ChatMessage[]) => void;
  prependChannelMessages: (channelId: string, messages: ChatMessage[]) => void;
  addChannelMessage: (channelId: string, message: ChatMessage) => void;
  updateChannelMessage: (channelId: string, message: ChatMessage) => void;
  removeChannelMessage: (channelId: string, messageId: string) => void;

  // Actions — DM messages
  setDmMessages: (threadId: string, messages: ChatDmMessage[]) => void;
  prependDmMessages: (threadId: string, messages: ChatDmMessage[]) => void;
  addDmMessage: (threadId: string, message: ChatDmMessage) => void;
  updateDmMessage: (threadId: string, message: ChatDmMessage) => void;
  removeDmMessage: (threadId: string, messageId: string) => void;

  // Actions — loading
  setIsLoadingChannels: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setIsLoadingMoreMessages: (loading: boolean) => void;
  setHasMoreMessages: (id: string, hasMore: boolean) => void;

  // Actions — reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  activeChannelId: null,
  activeDmThreadId: null,
  channels: [],
  dmThreads: [],
  channelMessages: new Map<string, ChatMessage[]>(),
  dmMessages: new Map<string, ChatDmMessage[]>(),
  unreadCounts: new Map<string, number>(),
  sidebarView: 'channels' as const,
  memberSidebarOpen: false,
  replyingTo: null,
  isLoadingChannels: false,
  isLoadingMessages: false,
  isLoadingMoreMessages: false,
  hasMoreMessages: new Map<string, boolean>(),
};

// ============================================
// Store
// ============================================

export const useChatStore = create<ChatStore>((set) => ({
  ...initialState,

  // Navigation
  setActiveChannel: (id) =>
    set({
      activeChannelId: id,
      activeDmThreadId: null,
      replyingTo: null,
    }),

  setActiveDmThread: (id) =>
    set({
      activeDmThreadId: id,
      activeChannelId: null,
      replyingTo: null,
    }),

  setSidebarView: (view) => set({ sidebarView: view }),
  setMemberSidebarOpen: (open) => set({ memberSidebarOpen: open }),
  setReplyingTo: (message) => set({ replyingTo: message }),

  // Data
  setChannels: (channels) => set({ channels }),
  setDmThreads: (threads) => set({ dmThreads: threads }),

  setUnreadCounts: (counts) => {
    const map = new Map<string, number>();
    for (const c of counts) {
      map.set(c.id, c.count);
    }
    set({ unreadCounts: map });
  },

  decrementUnread: (id) =>
    set((state) => {
      const newCounts = new Map(state.unreadCounts);
      const current = newCounts.get(id) ?? 0;
      if (current <= 1) {
        newCounts.delete(id);
      } else {
        newCounts.set(id, current - 1);
      }
      return { unreadCounts: newCounts };
    }),

  // Channel messages
  setChannelMessages: (channelId, messages) =>
    set((state) => {
      const newMap = new Map(state.channelMessages);
      newMap.set(channelId, messages);
      return { channelMessages: newMap };
    }),

  prependChannelMessages: (channelId, messages) =>
    set((state) => {
      const newMap = new Map(state.channelMessages);
      const existing = newMap.get(channelId) ?? [];
      newMap.set(channelId, [...messages, ...existing]);
      return { channelMessages: newMap };
    }),

  addChannelMessage: (channelId, message) =>
    set((state) => {
      const newMap = new Map(state.channelMessages);
      const existing = newMap.get(channelId) ?? [];

      // Prevent duplicate messages
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      newMap.set(channelId, [...existing, message]);
      return { channelMessages: newMap };
    }),

  updateChannelMessage: (channelId, message) =>
    set((state) => {
      const newMap = new Map(state.channelMessages);
      const existing = newMap.get(channelId) ?? [];
      newMap.set(
        channelId,
        existing.map((m) => (m.id === message.id ? message : m))
      );
      return { channelMessages: newMap };
    }),

  removeChannelMessage: (channelId, messageId) =>
    set((state) => {
      const newMap = new Map(state.channelMessages);
      const existing = newMap.get(channelId) ?? [];
      newMap.set(
        channelId,
        existing.filter((m) => m.id !== messageId)
      );
      return { channelMessages: newMap };
    }),

  // DM messages
  setDmMessages: (threadId, messages) =>
    set((state) => {
      const newMap = new Map(state.dmMessages);
      newMap.set(threadId, messages);
      return { dmMessages: newMap };
    }),

  prependDmMessages: (threadId, messages) =>
    set((state) => {
      const newMap = new Map(state.dmMessages);
      const existing = newMap.get(threadId) ?? [];
      newMap.set(threadId, [...messages, ...existing]);
      return { dmMessages: newMap };
    }),

  addDmMessage: (threadId, message) =>
    set((state) => {
      const newMap = new Map(state.dmMessages);
      const existing = newMap.get(threadId) ?? [];

      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      newMap.set(threadId, [...existing, message]);
      return { dmMessages: newMap };
    }),

  updateDmMessage: (threadId, message) =>
    set((state) => {
      const newMap = new Map(state.dmMessages);
      const existing = newMap.get(threadId) ?? [];
      newMap.set(
        threadId,
        existing.map((m) => (m.id === message.id ? message : m))
      );
      return { dmMessages: newMap };
    }),

  removeDmMessage: (threadId, messageId) =>
    set((state) => {
      const newMap = new Map(state.dmMessages);
      const existing = newMap.get(threadId) ?? [];
      newMap.set(
        threadId,
        existing.filter((m) => m.id !== messageId)
      );
      return { dmMessages: newMap };
    }),

  // Loading
  setIsLoadingChannels: (loading) => set({ isLoadingChannels: loading }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setIsLoadingMoreMessages: (loading) =>
    set({ isLoadingMoreMessages: loading }),

  setHasMoreMessages: (id, hasMore) =>
    set((state) => {
      const newMap = new Map(state.hasMoreMessages);
      newMap.set(id, hasMore);
      return { hasMoreMessages: newMap };
    }),

  // Reset
  reset: () => set(initialState),
}));
