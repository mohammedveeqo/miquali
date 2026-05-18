/**
 * AI Chat Store — Zustand store for concept chat and AI tutor interactions.
 * Tracks conversation history, streaming state, exchange limits, and assessment results.
 * This store is session-only (no localStorage persistence).
 */

import { create } from 'zustand';
import type { AIChatState } from '@/types';
import type { ChatMessage } from '@/types';

/** Maximum number of learner messages allowed in concept chat */
const MAX_EXCHANGE_COUNT = 4;

/** Soft limit for total messages in an AI tutor session */
const MAX_SESSION_MESSAGE_COUNT = 20;

/** Actions available on the AI Chat Store */
interface AIChatActions {
  /** Append a new message to the conversation */
  addMessage: (message: ChatMessage) => void;
  /** Set whether an AI response is currently being streamed */
  setStreaming: (isStreaming: boolean) => void;
  /** Increment the learner exchange count by 1 (concept chat, max 4) */
  incrementExchangeCount: () => void;
  /** Increment the session message count by 1 (tutor chat, soft limit 20) */
  incrementSessionMessageCount: () => void;
  /** Set the concept chat assessment result */
  setAssessmentResult: (result: 'pass' | 'fail' | null) => void;
  /** Reset all chat state to initial values */
  resetChat: () => void;
  /** Returns true when the concept chat exchange limit (4) has been reached */
  isExchangeLimitReached: () => boolean;
  /** Returns true when the AI tutor session message limit (20) has been reached */
  isSessionLimitReached: () => boolean;
}

/** Combined store type: state + actions */
type AIChatStore = AIChatState & AIChatActions;

/** Initial state values for the AI Chat Store */
const initialState: AIChatState = {
  messages: [],
  isStreaming: false,
  exchangeCount: 0,
  sessionMessageCount: 0,
  assessmentResult: null,
};

/**
 * Zustand store for AI chat state management.
 * Used by both the Concept Chat (exchange-limited) and AI Tutor (session-limited) components.
 */
export const useAIChatStore = create<AIChatStore>((set, get) => ({
  ...initialState,

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setStreaming: (isStreaming: boolean) => {
    set({ isStreaming });
  },

  incrementExchangeCount: () => {
    set((state) => ({
      exchangeCount: state.exchangeCount + 1,
    }));
  },

  incrementSessionMessageCount: () => {
    set((state) => ({
      sessionMessageCount: state.sessionMessageCount + 1,
    }));
  },

  setAssessmentResult: (result: 'pass' | 'fail' | null) => {
    set({ assessmentResult: result });
  },

  resetChat: () => {
    set({ ...initialState });
  },

  isExchangeLimitReached: () => {
    return get().exchangeCount >= MAX_EXCHANGE_COUNT;
  },

  isSessionLimitReached: () => {
    return get().sessionMessageCount >= MAX_SESSION_MESSAGE_COUNT;
  },
}));
